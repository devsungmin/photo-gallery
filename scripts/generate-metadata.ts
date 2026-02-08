import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import exifr from "exifr";
import sharp from "sharp";

const PHOTOS_DIR = path.resolve("public/photos");
const THUMBNAILS_DIR = path.resolve("public/thumbnails");
const OPTIMIZED_DIR = path.resolve("public/optimized");
const OUTPUT_FILE = path.resolve("src/data/photos.json");
const THUMB_WIDTH = 400;
const OPTIMIZED_MAX = 2400;
// sharp가 직접 처리 가능한 포맷
const SHARP_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tiff"]);
// 네이티브 도구로만 처리 가능한 포맷 (sharp 미지원)
const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);
const RAW_EXTENSIONS = new Set([".arw", ".cr2", ".cr3", ".nef", ".orf", ".rw2", ".raf", ".pef", ".srw", ".dng"]);
const NATIVE_ONLY_EXTENSIONS = new Set([...HEIC_EXTENSIONS, ...RAW_EXTENSIONS]);
const IS_MAC = process.platform === "darwin";
const IMAGE_EXTENSIONS = new Set([...SHARP_EXTENSIONS, ...NATIVE_ONLY_EXTENSIONS]);

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

async function scanImages(dir: string, baseDir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanImages(fullPath, baseDir)));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }

  return files;
}

/** 네이티브 도구로 이미지를 WebP로 변환 (macOS: sips, Linux: dcraw/heif-convert) */
async function convertToWebp(
  inputPath: string,
  outputPath: string,
  maxWidth: number,
  quality: number,
): Promise<sharp.Metadata> {
  const ext = path.extname(inputPath).toLowerCase();

  if (IS_MAC) {
    // macOS: sips → 임시 JPEG → sharp → WebP
    const tmpJpg = outputPath + ".tmp.jpg";
    try {
      execSync(
        `sips -s format jpeg -s formatOptions 95 --resampleWidth ${maxWidth} "${inputPath}" --out "${tmpJpg}"`,
        { stdio: "pipe" },
      );
      const metadata = await sharp(tmpJpg).metadata();
      await sharp(tmpJpg).webp({ quality }).toFile(outputPath);
      return metadata;
    } finally {
      if (fs.existsSync(tmpJpg)) fs.unlinkSync(tmpJpg);
    }
  }

  // Linux
  let sourceBuffer: Buffer;

  if (HEIC_EXTENSIONS.has(ext)) {
    // HEIC → heif-convert → 임시 JPEG → sharp
    const tmpJpg = outputPath + ".tmp.jpg";
    try {
      execSync(`heif-convert "${inputPath}" "${tmpJpg}"`, { stdio: "pipe" });
      sourceBuffer = fs.readFileSync(tmpJpg);
    } finally {
      if (fs.existsSync(tmpJpg)) fs.unlinkSync(tmpJpg);
    }
  } else {
    // RAW/DNG → exiftool로 내장 풀사이즈 JPEG 프리뷰 추출
    try {
      sourceBuffer = execSync(`exiftool -b -JpgFromRaw "${inputPath}"`, {
        maxBuffer: 50 * 1024 * 1024,
      });
      if (sourceBuffer.length < 1024) throw new Error("No JpgFromRaw");
    } catch {
      // JpgFromRaw 실패 시 PreviewImage 시도 (DNG 등)
      sourceBuffer = execSync(`exiftool -b -PreviewImage "${inputPath}"`, {
        maxBuffer: 50 * 1024 * 1024,
      });
    }
  }

  const metadata = await sharp(sourceBuffer).metadata();
  await sharp(sourceBuffer)
    .rotate()
    .resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath);
  return metadata;
}

async function processImage(filePath: string): Promise<PhotoMeta> {
  const relativePath = path.relative(PHOTOS_DIR, filePath);
  const parts = relativePath.split(path.sep);
  const category = parts.length > 1 ? parts[0] : "uncategorized";
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const useSips = NATIVE_ONLY_EXTENSIONS.has(ext);
  const webpName = path.basename(relativePath).replace(path.extname(relativePath), ".webp");
  const relativeDir = path.dirname(relativePath);

  // --- Thumbnail (WebP) ---
  const thumbDir = path.join(THUMBNAILS_DIR, relativeDir);
  fs.mkdirSync(thumbDir, { recursive: true });
  const thumbPath = path.join(thumbDir, webpName);

  let metadata: sharp.Metadata;

  if (useSips) {
    metadata = await convertToWebp(filePath, thumbPath, THUMB_WIDTH, 80);
  } else {
    const source = sharp(filePath);
    metadata = await source.metadata();
    await source
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(thumbPath);
  }

  const thumbRelative = path.relative(path.resolve("public"), thumbPath).split(path.sep).join("/");

  // --- Optimized web version (WebP, 모든 포맷 대상) ---
  const optDir = path.join(OPTIMIZED_DIR, relativeDir);
  fs.mkdirSync(optDir, { recursive: true });
  const optPath = path.join(optDir, webpName);

  if (useSips) {
    await convertToWebp(filePath, optPath, OPTIMIZED_MAX, 85);
  } else {
    await sharp(filePath)
      .rotate()
      .resize({ width: OPTIMIZED_MAX, height: OPTIMIZED_MAX, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(optPath);
  }

  const src = "/" + path.relative(path.resolve("public"), optPath).split(path.sep).join("/");

  // --- EXIF ---
  let exif: Record<string, unknown> | null = null;
  try {
    exif = await exifr.parse(filePath, {
      pick: [
        "DateTimeOriginal",
        "Make",
        "Model",
        "LensModel",
        "FNumber",
        "ExposureTime",
        "ISO",
        "FocalLength",
        "ImageWidth",
        "ImageHeight",
        "ExifImageWidth",
        "ExifImageHeight",
      ],
    });
  } catch {
    // No EXIF data available
  }

  const width = (exif?.ExifImageWidth as number) ?? (exif?.ImageWidth as number) ?? metadata?.width ?? 0;
  const height = (exif?.ExifImageHeight as number) ?? (exif?.ImageHeight as number) ?? metadata?.height ?? 0;

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

  const imageFiles = await scanImages(PHOTOS_DIR, PHOTOS_DIR);

  if (imageFiles.length === 0) {
    console.log("No images found. Creating empty photos.json.");
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  console.log(`Found ${imageFiles.length} images. Processing...`);

  const photos: PhotoMeta[] = [];
  for (const file of imageFiles) {
    try {
      const meta = await processImage(file);
      photos.push(meta);
      console.log(`  ✓ ${meta.fileName} (${meta.camera ?? "no EXIF"})`);
    } catch (err) {
      console.error(`  ✗ ${path.basename(file)}: ${err}`);
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
