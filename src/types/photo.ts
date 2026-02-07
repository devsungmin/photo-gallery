export interface PhotoMeta {
  camera?: string;
  lens?: string;
  focalLength?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: number;
  date?: string;
  location?: string;
}

export interface Photo {
  id: number;
  title: string;
  src: string;
  category: string;
  tags: string[];
  meta?: PhotoMeta;
}
