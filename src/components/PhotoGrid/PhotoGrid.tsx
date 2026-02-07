import type { PhotoMeta } from "../../types/photo";
import { PhotoCard } from "../PhotoCard/PhotoCard";
import styles from "./PhotoGrid.module.css";

interface PhotoGridProps {
  photos: PhotoMeta[];
  onPhotoClick: (index: number) => void;
}

export function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  return (
    <div className={styles.grid}>
      {photos.length === 0 && <div className={styles.empty}>No photos found.</div>}
      {photos.map((photo, index) => (
        <PhotoCard key={photo.id} photo={photo} onClick={() => onPhotoClick(index)} />
      ))}
    </div>
  );
}
