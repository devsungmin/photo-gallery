import type { Photo } from "../../types/photo";
import styles from "./PhotoCard.module.css";

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={photo.src} alt={photo.title} loading="lazy" />
        <div className={styles.overlay}>
          <span className={styles.title}>{photo.title}</span>
        </div>
      </div>
    </div>
  );
}
