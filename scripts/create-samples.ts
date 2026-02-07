/**
 * Creates sample JPEG images with embedded EXIF data for testing.
 * Uses sharp to generate colored gradient images and exifr for reference.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PHOTOS_DIR = path.resolve("public/photos");

interface SamplePhoto {
  fileName: string;
  category: string;
  color: { r: number; g: number; b: number };
  exif: {
    DateTimeOriginal: string;
    Make: string;
    Model: string;
    LensModel: string;
    FNumber: number;
    ExposureTime: number;
    ISO: number;
    FocalLength: number;
  };
}

const samples: SamplePhoto[] = [
  {
    fileName: "sunset-mountain.jpg",
    category: "nature",
    color: { r: 255, g: 120, b: 50 },
    exif: {
      DateTimeOriginal: "2024-09-15T18:32:00",
      Make: "Sony",
      Model: "ILCE-7RM4",
      LensModel: "FE 24-70mm F2.8 GM",
      FNumber: 8,
      ExposureTime: 1 / 125,
      ISO: 100,
      FocalLength: 35,
    },
  },
  {
    fileName: "morning-forest.jpg",
    category: "nature",
    color: { r: 34, g: 139, b: 34 },
    exif: {
      DateTimeOriginal: "2024-06-22T07:15:00",
      Make: "Canon",
      Model: "Canon EOS R5",
      LensModel: "RF15-35mm F2.8 L IS USM",
      FNumber: 5.6,
      ExposureTime: 1 / 60,
      ISO: 400,
      FocalLength: 20,
    },
  },
  {
    fileName: "ocean-cliff.jpg",
    category: "nature",
    color: { r: 30, g: 144, b: 255 },
    exif: {
      DateTimeOriginal: "2024-08-03T16:45:00",
      Make: "Nikon",
      Model: "NIKON Z 9",
      LensModel: "NIKKOR Z 14-24mm f/2.8 S",
      FNumber: 11,
      ExposureTime: 1 / 250,
      ISO: 64,
      FocalLength: 18,
    },
  },
  {
    fileName: "lake-reflection.jpg",
    category: "nature",
    color: { r: 70, g: 130, b: 180 },
    exif: {
      DateTimeOriginal: "2024-10-12T06:50:00",
      Make: "Fujifilm",
      Model: "X-T5",
      LensModel: "XF16-55mmF2.8 R LM WR",
      FNumber: 8,
      ExposureTime: 1 / 30,
      ISO: 200,
      FocalLength: 23,
    },
  },
  {
    fileName: "city-night.jpg",
    category: "city",
    color: { r: 25, g: 25, b: 112 },
    exif: {
      DateTimeOriginal: "2024-11-28T21:10:00",
      Make: "Sony",
      Model: "ILCE-7M3",
      LensModel: "FE 16-35mm F2.8 GM",
      FNumber: 2.8,
      ExposureTime: 1 / 15,
      ISO: 3200,
      FocalLength: 24,
    },
  },
  {
    fileName: "street-view.jpg",
    category: "city",
    color: { r: 169, g: 169, b: 169 },
    exif: {
      DateTimeOriginal: "2024-07-19T14:20:00",
      Make: "Leica",
      Model: "Leica Q3",
      LensModel: "Summilux 28mm f/1.7 ASPH.",
      FNumber: 4,
      ExposureTime: 1 / 500,
      ISO: 100,
      FocalLength: 28,
    },
  },
  {
    fileName: "bridge-sunset.jpg",
    category: "city",
    color: { r: 255, g: 165, b: 0 },
    exif: {
      DateTimeOriginal: "2024-05-30T19:05:00",
      Make: "Canon",
      Model: "Canon EOS R6m2",
      LensModel: "RF24-105mm F4 L IS USM",
      FNumber: 8,
      ExposureTime: 1 / 200,
      ISO: 100,
      FocalLength: 50,
    },
  },
  {
    fileName: "neon-alley.jpg",
    category: "city",
    color: { r: 255, g: 0, b: 128 },
    exif: {
      DateTimeOriginal: "2024-12-05T22:30:00",
      Make: "Sony",
      Model: "ILCE-7CM2",
      LensModel: "FE 35mm F1.4 GM",
      FNumber: 1.4,
      ExposureTime: 1 / 60,
      ISO: 800,
      FocalLength: 35,
    },
  },
  {
    fileName: "portrait-smile.jpg",
    category: "people",
    color: { r: 255, g: 218, b: 185 },
    exif: {
      DateTimeOriginal: "2024-04-10T10:30:00",
      Make: "Nikon",
      Model: "NIKON Z 6III",
      LensModel: "NIKKOR Z 85mm f/1.2 S",
      FNumber: 1.4,
      ExposureTime: 1 / 1000,
      ISO: 100,
      FocalLength: 85,
    },
  },
  {
    fileName: "cafe-friends.jpg",
    category: "people",
    color: { r: 139, g: 90, b: 43 },
    exif: {
      DateTimeOriginal: "2024-03-22T15:40:00",
      Make: "Fujifilm",
      Model: "X100VI",
      LensModel: "Fujinon 23mm f/2",
      FNumber: 2.8,
      ExposureTime: 1 / 125,
      ISO: 800,
      FocalLength: 23,
    },
  },
  {
    fileName: "street-musician.jpg",
    category: "people",
    color: { r: 178, g: 102, b: 0 },
    exif: {
      DateTimeOriginal: "2024-08-17T18:00:00",
      Make: "Sony",
      Model: "ILCE-7M4",
      LensModel: "FE 50mm F1.2 GM",
      FNumber: 1.8,
      ExposureTime: 1 / 250,
      ISO: 400,
      FocalLength: 50,
    },
  },
  {
    fileName: "traveler-back.jpg",
    category: "people",
    color: { r: 85, g: 107, b: 47 },
    exif: {
      DateTimeOriginal: "2024-07-05T09:15:00",
      Make: "Canon",
      Model: "Canon EOS R7",
      LensModel: "RF-S18-150mm F3.5-6.3 IS STM",
      FNumber: 5.6,
      ExposureTime: 1 / 500,
      ISO: 200,
      FocalLength: 24,
    },
  },
];

function buildExifBuffer(exif: SamplePhoto["exif"]): Buffer {
  // Build a minimal EXIF APP1 segment with IFD0 + ExifIFD
  // This is a simplified EXIF writer for sample data

  const encoder = new TextEncoder();

  // Helper to write a UTF-8 string as bytes
  function strBytes(s: string): number[] {
    return [...encoder.encode(s), 0];
  }

  // We'll use the exif-writing capability of sharp instead
  // Sharp supports withExif/withExifMerge for embedding EXIF
  // But let's just return a dummy - we'll use sharp's withExifMerge
  return Buffer.alloc(0);
}

// Convert ExposureTime to EXIF rational representation
function toRational(value: number): [number, number] {
  if (value >= 1) return [Math.round(value * 1000), 1000];
  const denom = Math.round(1 / value);
  return [1, denom];
}

async function createSampleImage(sample: SamplePhoto): Promise<void> {
  const dir = path.join(PHOTOS_DIR, sample.category);
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, sample.fileName);

  const width = 1200;
  const height = 800;

  // Create a gradient-like image using raw pixel data
  const channels = 3;
  const pixels = Buffer.alloc(width * height * channels);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const gradX = x / width;
      const gradY = y / height;

      pixels[idx] = Math.min(255, Math.round(sample.color.r * (0.3 + 0.7 * gradX)));
      pixels[idx + 1] = Math.min(255, Math.round(sample.color.g * (0.3 + 0.7 * gradY)));
      pixels[idx + 2] = Math.min(255, Math.round(sample.color.b * (0.5 + 0.5 * gradX * gradY)));
    }
  }

  // Build EXIF data for sharp
  const exifData: Record<string, unknown> = {};

  // IFD0 (main image)
  const ifd0: Record<string, unknown> = {
    Make: sample.exif.Make,
    Model: sample.exif.Model,
  };

  // ExifIFD — sharp expects rational EXIF values as "numerator/denominator" strings
  const [expNum, expDen] = toRational(sample.exif.ExposureTime);
  const exifIFD: Record<string, unknown> = {
    DateTimeOriginal: sample.exif.DateTimeOriginal.replace("T", " ").replace(/-/g, ":"),
    FNumber: `${Math.round(sample.exif.FNumber * 10)}/10`,
    ExposureTime: `${expNum}/${expDen}`,
    ISOSpeedRatings: String(sample.exif.ISO),
    FocalLength: `${sample.exif.FocalLength}/1`,
    LensModel: sample.exif.LensModel,
    ExifImageWidth: String(width),
    ExifImageHeight: String(height),
  };

  // Sharp's withExifMerge expects an object with IFD keys
  const exifObj = {
    IFD0: ifd0,
    IFD2: exifIFD,
  };

  await sharp(pixels, { raw: { width, height, channels } })
    .jpeg({ quality: 85 })
    .withExifMerge(exifObj)
    .toFile(filePath);
}

async function main() {
  console.log("Creating sample photos with EXIF data...\n");

  for (const sample of samples) {
    try {
      await createSampleImage(sample);
      console.log(`  ✓ ${sample.category}/${sample.fileName} (${sample.exif.Model})`);
    } catch (err) {
      console.error(`  ✗ ${sample.category}/${sample.fileName}: ${err}`);
    }
  }

  console.log(`\nCreated ${samples.length} sample photos in ${PHOTOS_DIR}`);
  console.log('Run "npm run generate" to extract metadata.');
}

main().catch(console.error);
