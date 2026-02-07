import type { PhotoMeta } from "../../types/photo";
import styles from "./PhotoCard.module.css";

interface PhotoCardProps {
  photo: PhotoMeta;
  onClick: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export function PhotoCard({ photo, onClick }: PhotoCardProps) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.imageWrapper}>
        <img className={styles.image} src={photo.thumbnail} alt={photo.fileName} loading="lazy" />
        <div className={styles.overlay}>
          <div className={styles.fileName}>{photo.fileName}</div>
          <div className={styles.exifRow}>
            {photo.camera && <span>{photo.camera}</span>}
          </div>
          <div className={styles.exifRow}>
            {[
              photo.focalLength ? `${photo.focalLength}mm` : null,
              photo.aperture ? `f/${photo.aperture}` : null,
              photo.shutterSpeed,
              photo.iso ? `ISO ${photo.iso}` : null,
            ]
              .filter(Boolean)
              .join("  \u00b7  ")}
          </div>
          {photo.dateTaken && (
            <div className={styles.date}>{formatDate(photo.dateTaken)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
