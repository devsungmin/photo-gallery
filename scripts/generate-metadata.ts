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
// 브라우저가 직접 표시 가능한 포맷
const WEB_SAFE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
// sharp가 직접 처리 가능한 포맷
const SHARP_EXTENSIONS = new Set([...WEB_SAFE_EXTENSIONS, ".tiff", ".dng"]);
// sips로만 처리 가능한 포맷 (sharp가 미지원)
const SIPS_ONLY_EXTENSIONS = new Set([".heic", ".heif", ".arw", ".cr2", ".cr3", ".nef", ".orf", ".rw2", ".raf", ".pef", ".srw"]);
const IMAGE_EXTENSIONS = new Set([...SHARP_EXTENSIONS, ...SIPS_ONLY_EXTENSIONS]);

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

/** macOS sips를 사용해 이미지를 JPEG로 변환 */
function convertWithSips(
  inputPath: string,
  outputPath: string,
  maxWidth: number,
  quality = 90,
): boolean {
  try {
    execSync(
      `sips -s format jpeg -s formatOptions ${quality} --resampleWidth ${maxWidth} "${inputPath}" --out "${outputPath}"`,
      { stdio: "pipe" },
    );
    return fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1024;
  } catch {
    return false;
  }
}

async function processImage(filePath: string): Promise<PhotoMeta> {
  const relativePath = path.relative(PHOTOS_DIR, filePath);
  const parts = relativePath.split(path.sep);
  const category = parts.length > 1 ? parts[0] : "uncategorized";
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const isWebSafe = WEB_SAFE_EXTENSIONS.has(ext);
  const useSips = SIPS_ONLY_EXTENSIONS.has(ext);
  const jpgName = path.basename(relativePath).replace(path.extname(relativePath), ".jpg");
  const relativeDir = path.dirname(relativePath);

  // --- Thumbnail ---
  const thumbDir = path.join(THUMBNAILS_DIR, relativeDir);
  fs.mkdirSync(thumbDir, { recursive: true });
  const thumbJpgPath = path.join(thumbDir, jpgName);

  let metadata: sharp.Metadata | undefined;

  if (useSips) {
    // HEIC, ARW 등 sharp 미지원 포맷 → sips로 썸네일 생성
    convertWithSips(filePath, thumbJpgPath, THUMB_WIDTH, 80);
    metadata = await sharp(thumbJpgPath).metadata();
  } else {
    // sharp가 직접 처리 가능한 포맷
    const thumbSource = sharp(filePath);
    metadata = await thumbSource.metadata();
    await thumbSource
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(thumbJpgPath);
  }

  const thumbRelative = path.relative(path.resolve("public"), thumbJpgPath).split(path.sep).join("/");

  // --- Optimized web version (비브라우저 포맷용) ---
  let src: string;

  if (isWebSafe) {
    // 브라우저가 직접 표시 가능 → 원본 사용
    src = "/" + path.relative(path.resolve("public"), filePath).split(path.sep).join("/");
  } else {
    // DNG, TIFF, HEIC, ARW 등 → 웹용 JPEG 생성
    const optDir = path.join(OPTIMIZED_DIR, relativeDir);
    fs.mkdirSync(optDir, { recursive: true });
    const optJpgPath = path.join(optDir, jpgName);

    if (useSips) {
      // sips로 고해상도 JPEG 변환
      convertWithSips(filePath, optJpgPath, OPTIMIZED_MAX, 90);
    } else {
      // sharp로 변환 (DNG, TIFF 등)
      await sharp(filePath)
        .rotate()
        .resize({ width: OPTIMIZED_MAX, height: OPTIMIZED_MAX, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 90 })
        .toFile(optJpgPath);
    }

    src = "/" + path.relative(path.resolve("public"), optJpgPath).split(path.sep).join("/");
  }

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
