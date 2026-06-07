// EXIF DateTimeOriginal에 타임존 정보가 없으므로 KST 기준으로 고정
process.env.TZ = "Asia/Seoul";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import exifr from "exifr";
import sharp from "sharp";

const PHOTOS_DIR = path.resolve("photos-src");
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

// sharp가 바로 디코딩할 수 있는 소스 포맷 (확장자 우선순위: 앞일수록 우선)
const READABLE_EXTS = [".webp", ".jpg", ".jpeg", ".png", ".tif", ".tiff"];
// sharp 기본 빌드로는 디코딩이 어려운 포맷 → 변환 없이 두면 누락되므로 경고 대상
const NEEDS_CONVERT_EXTS = [".arw", ".dng", ".heic", ".heif", ".cr2", ".nef", ".raf"];

async function scanRaw(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await scanRaw(fullPath)));
    } else if (entry.name !== ".DS_Store") {
      files.push(fullPath);
    }
  }
  return files;
}

// 모든 소스 이미지를 수집한다. 같은 이름의 webp/jpg가 함께 있으면 우선순위가 높은 하나만 사용한다.
// sharp가 못 읽는 포맷(RAW/HEIC)은 따로 모아 경고로 알린다 (조용한 누락 방지).
async function scanImages(dir: string): Promise<{ images: string[]; unreadable: string[] }> {
  const all = await scanRaw(dir);

  // (디렉터리 + 확장자 제외 파일명) 기준으로 묶어 중복 제거
  const groups = new Map<string, string[]>();
  const unreadable: string[] = [];

  for (const file of all) {
    const ext = path.extname(file).toLowerCase();
    if (READABLE_EXTS.includes(ext)) {
      const key = path.join(path.dirname(file), path.basename(file, path.extname(file)));
      const list = groups.get(key) ?? [];
      list.push(file);
      groups.set(key, list);
    } else if (NEEDS_CONVERT_EXTS.includes(ext)) {
      unreadable.push(file);
    }
    // 그 외 확장자(.txt 등)는 무시
  }

  const images: string[] = [];
  for (const [, list] of groups) {
    list.sort(
      (a, b) =>
        READABLE_EXTS.indexOf(path.extname(a).toLowerCase()) -
        READABLE_EXTS.indexOf(path.extname(b).toLowerCase()),
    );
    images.push(list[0]);
  }

  // RAW/HEIC 원본이 있는데 같은 이름의 디코딩 가능한 짝이 없으면 진짜 누락 → 경고
  const trulyUnreadable = unreadable.filter((raw) => {
    const key = path.join(path.dirname(raw), path.basename(raw, path.extname(raw)));
    return !groups.has(key);
  });

  return { images, unreadable: trulyUnreadable };
}

// 출력물(썸네일·최적화본)이 모두 존재하고 원본보다 최신이면 재생성 불필요
function outputsUpToDate(filePath: string, thumbPath: string, optPath: string): boolean {
  try {
    const srcMtime = fs.statSync(filePath).mtimeMs;
    const thumbMtime = fs.statSync(thumbPath).mtimeMs;
    const optMtime = fs.statSync(optPath).mtimeMs;
    return thumbMtime >= srcMtime && optMtime >= srcMtime;
  } catch {
    return false;
  }
}

async function processImage(filePath: string, cached?: PhotoMeta): Promise<PhotoMeta> {
  const relativePath = path.relative(PHOTOS_DIR, filePath);
  const parts = relativePath.split(path.sep);
  const category = parts.length > 1 ? parts[0] : "uncategorized";
  const srcExt = path.extname(filePath);
  const fileName = path.basename(filePath, srcExt);
  // 출력물은 소스 확장자와 무관하게 항상 .webp (jpg/png 소스도 webp로 인코딩)
  const webpName = fileName + ".webp";
  const relativeDir = path.dirname(relativePath);

  // --- 증분 처리: 출력물이 최신이고 캐시된 메타데이터가 있으면 sharp/exif 작업 전부 skip ---
  {
    const thumbPathCheck = path.join(THUMBNAILS_DIR, relativeDir, webpName);
    const optPathCheck = path.join(OPTIMIZED_DIR, relativeDir, webpName);
    if (cached && outputsUpToDate(filePath, thumbPathCheck, optPathCheck)) {
      return cached;
    }
  }

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
    console.error("Error: photos-src/ directory not found.");
    process.exit(1);
  }

  const { images: imageFiles, unreadable } = await scanImages(PHOTOS_DIR);

  // sharp가 디코딩하지 못하는 원본(RAW/HEIC 등)을 크게 경고 — 조용한 누락 방지
  if (unreadable.length > 0) {
    console.warn(`\n⚠️  ${unreadable.length} source file(s) cannot be decoded directly and have NO converted (webp/jpg) counterpart.`);
    console.warn(`   These will NOT appear in the gallery. Convert them first: \`make convert\``);
    for (const f of unreadable) console.warn(`     - ${path.relative(PHOTOS_DIR, f)}`);
    console.warn("");
  }

  if (imageFiles.length === 0) {
    console.log("No images found. Creating empty photos.json.");
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2));
    return;
  }

  // 기존 photos.json을 캐시로 로드 (증분 처리용, id 기준)
  const cache = new Map<string, PhotoMeta>();
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      const prev = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf-8")) as PhotoMeta[];
      for (const p of prev) cache.set(p.id, p);
    } catch {
      // 손상된 캐시는 무시하고 전체 재생성
    }
  }

  const idOf = (filePath: string) =>
    path.relative(PHOTOS_DIR, filePath).replace(/[/\\]/g, "-").replace(/\.[^.]+$/, "");

  console.log(`Found ${imageFiles.length} images. Processing (${CONCURRENCY} parallel)...`);

  let completed = 0;
  let skipped = 0;
  const photos: PhotoMeta[] = [];

  // 동시 실행 개수를 제한하며 병렬 처리
  for (let i = 0; i < imageFiles.length; i += CONCURRENCY) {
    const batch = imageFiles.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map((file) => processImage(file, cache.get(idOf(file)))),
    );

    for (let j = 0; j < results.length; j++) {
      completed++;
      const result = results[j];
      if (result.status === "fulfilled") {
        photos.push(result.value);
        const wasCached = cache.get(idOf(batch[j])) === result.value;
        if (wasCached) {
          skipped++;
        } else {
          console.log(`  [${completed}/${imageFiles.length}] ✓ ${result.value.fileName} (${result.value.camera ?? "no EXIF"})`);
        }
      } else {
        console.error(`  [${completed}/${imageFiles.length}] ✗ ${path.basename(batch[j])}: ${result.reason}`);
      }
    }
  }

  if (skipped > 0) {
    console.log(`  ⏭ ${skipped} images unchanged (skipped regeneration)`);
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
