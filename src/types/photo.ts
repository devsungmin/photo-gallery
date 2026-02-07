export interface PhotoMeta {
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

export type SortKey = "dateTaken" | "camera" | "iso" | "focalLength";
