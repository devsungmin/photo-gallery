// EXIF DateTimeOriginal에 타임존 정보가 없으므로 KST 기준으로 고정
process.env.TZ = "Asia/Seoul";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import exifr from "exifr";
import sharp from "sharp";

const PHOTOS_DIR = path.resolve("public/photos");
const THUMBNAILS_DIR = path.resolve("public/thumbnails");
const OPTIMIZED_DIR = path.resolve("public/optimized");
const OUTPUT_FILE = path.resolve("src/data/photos.json");
const THUMB_WIDTH = 400;
const OPTIMIZED_MAX = 2400;
const CONCURRENCY = Math.max(1, os.cpus().length);

interface PhotoMeta {
  id: string;
  fileName: string;
  src: string;
  thumbnail: string;
  category: string;
  width: number;
  height: number;
  dateTaken: string | null;
  camera: string | null;
  lens: string | null;
  aperture: number | null;
  shutterSpeed: string | null;
  iso: number | null;
  focalLength: number | null;
}

function formatShutterSpeed(exposureTime: number | undefined): string | null {
  if (!exposureTime) return null;
  if (exposureTime >= 1) return `${exposureTime}s`;
  return `1/${Math.round(1 / exposureTime)}s`;
}

function formatCamera(make: string | undefined, model: string | undefined): string | null {
  if (!model) return null;
  const m = model.trim();
  if (make && !m.toLowerCase().startsWith(make.toLowerCase().trim())) {
    return `${make.trim()} ${m}`;
  }
  return m;
}

async function scanImages(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanImages(fullPath)));
    } else if (path.extname(entry.name).toLowerCase() === ".webp") {
      files.push(fullPath);
    }
  }

  return files;
}

async function processImage(filePath: string): Promise<PhotoMeta> {
  const relativePath = path.relative(PHOTOS_DIR, filePath);
  const parts = relativePath.split(path.sep);
  const category = parts.length > 1 ? parts[0] : "uncategorized";
  const fileName = path.basename(filePath, ".webp");
  const webpName = path.basename(relativePath);
  const relativeDir = path.dirname(relativePath);

  // --- Metadata ---
  const source = sharp(filePath);
  const metadata = await source.metadata();

  // --- Thumbnail (WebP) ---
  const thumbDir = path.join(THUMBNAILS_DIR, relativeDir);
  fs.mkdirSync(thumbDir, { recursive: true });
  const thumbPath = path.join(thumbDir, webpName);

  const THUMB_HEIGHT = Math.round(THUMB_WIDTH * 2 / 3); // 3:2 비율

  await source
    .rotate()
    .resize({ width: THUMB_WIDTH, height: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  // 세로 썸네일 → 3:2 캔버스에 중앙 배치 (흰색 배경)
  const thumbInfo = await sharp(thumbPath).metadata();
  if (thumbInfo.width && thumbInfo.height && thumbInfo.height > thumbInfo.width) {
    const padded = await sharp({
      create: { width: THUMB_WIDTH, height: THUMB_HEIGHT, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .composite([{
        input: await sharp(thumbPath)
          .resize({ width: THUMB_WIDTH, height: THUMB_HEIGHT, fit: "inside", withoutEnlargement: true })
          .toBuffer(),
        gravity: "centre",
      }])
      .webp({ quality: 80 })
      .toBuffer();
    fs.writeFileSync(thumbPath, padded);
  }

  const thumbRelative = path.relative(path.resolve("public"), thumbPath).split(path.sep).join("/");

  // --- Optimized web version ---
  const optDir = path.join(OPTIMIZED_DIR, relativeDir);
  fs.mkdirSync(optDir, { recursive: true });
  const optPath = path.join(optDir, webpName);

  await sharp(filePath)
    .rotate()
    .resize({ width: OPTIMIZED_MAX, height: OPTIMIZED_MAX, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toFile(optPath);

  const src = "/" + path.relative(path.resolve("public"), optPath).split(path.sep).join("/");

  // --- EXIF ---
  // WebP 파일은 exifr.parse(filePath)가 지원되지 않으므로
  // sharp로 EXIF 바이너리를 추출한 뒤 exifr로 파싱
  let exif: Record<string, unknown> | null = null;
  try {
    const exifBuffer = metadata.exif;
    if (exifBuffer) {
      exif = await exifr.parse(exifBuffer, {
        pick: [
          "DateTimeOriginal",
          "Make",
          "Model",
          "LensModel",
          "FNumber",
          "ExposureTime",
          "ISO",
          "FocalLength",
          "Orientation",
          "ImageWidth",
          "ImageHeight",
          "ExifImageWidth",
          "ExifImageHeight",
        ],
      });
    }
  } catch {
    // No EXIF data available
  }

  let width = (exif?.ExifImageWidth as number) ?? (exif?.ImageWidth as number) ?? metadata?.width ?? 0;
  let height = (exif?.ExifImageHeight as number) ?? (exif?.ImageHeight as number) ?? metadata?.height ?? 0;

  // EXIF Orientation 5~8은 90°/270° 회전 → width/height swap
  const orientation = metadata?.orientation ?? 1;
  if (orientation >= 5 && orientation <= 8) {
    [width, height] = [height, width];
  }

  const dateTaken = exif?.DateTimeOriginal
    ? new Date(exif.DateTimeOriginal as string | Date).toISOString()
    : null;

  return {
    id: relativePath.replace(/[/\\]/g, "-").replace(/\.[^.]+$/, ""),
    fileName,
    src,
    thumbnail: "/" + thumbRelative,
    category,
    width,
    height,
    dateTaken,
    camera: formatCamera(exif?.Make as string, exif?.Model as string),
    lens: (exif?.LensModel as string) ?? null,
    aperture: (exif?.FNumber as number) ?? null,
    shutterSpeed: formatShutterSpeed(exif?.ExposureTime as number),
    iso: (exif?.ISO as number) ?? null,
    focalLength: exif?.FocalLength ? Math.round(exif.FocalLength as number) : null,
  };
}

async function main() {
  console.log("Scanning photos in", PHOTOS_DIR);

  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error("Error: public/photos/ directory not found.");
    process.exit(1);
  }

  const imageFiles = await scanImages(PHOTOS_DIR);

  if (imageFiles.length === 0) {
    console.log("No images found. Creating empty photos.json.");
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  console.log(`Found ${imageFiles.length} images. Processing (${CONCURRENCY} parallel)...`);

  let completed = 0;
  const photos: PhotoMeta[] = [];

  // 동시 실행 개수를 제한하며 병렬 처리
  for (let i = 0; i < imageFiles.length; i += CONCURRENCY) {
    const batch = imageFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map((file) => processImage(file)));

    for (let j = 0; j < results.length; j++) {
      completed++;
      const result = results[j];
      if (result.status === "fulfilled") {
        photos.push(result.value);
        console.log(`  [${completed}/${imageFiles.length}] ✓ ${result.value.fileName} (${result.value.camera ?? "no EXIF"})`);
      } else {
        console.error(`  [${completed}/${imageFiles.length}] ✗ ${path.basename(batch[j])}: ${result.reason}`);
      }
    }
  }

  // Sort by dateTaken (newest first), then by fileName
  photos.sort((a, b) => {
    if (a.dateTaken && b.dateTaken) return b.dateTaken.localeCompare(a.dateTaken);
    if (a.dateTaken) return -1;
    if (b.dateTaken) return 1;
    return a.fileName.localeCompare(b.fileName);
  });

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(photos, null, 2));

  console.log(`\nGenerated ${OUTPUT_FILE} with ${photos.length} photos.`);
  console.log(`Thumbnails saved to ${THUMBNAILS_DIR}`);
}

main().catch(console.error);
