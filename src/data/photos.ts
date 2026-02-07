import type { PhotoMeta } from "../types/photo";
import photosData from "./photos.json";

export const photos: PhotoMeta[] = photosData;

export const categories: string[] = [
  "all",
  ...new Set(photos.map((p) => p.category)),
];
