import type { PhotoMeta } from "../types/photo";
import photosData from "./photos.json";

const base = import.meta.env.BASE_URL;

export const photos: PhotoMeta[] = photosData.map((p) => ({
  ...p,
  src: base + p.src.slice(1),
  thumbnail: base + p.thumbnail.slice(1),
}));

export const categories: string[] = [
  "all",
  ...new Set(photos.map((p) => p.category)),
];
