import { useEffect, useCallback } from "react";
import type { PhotoMeta } from "../../types/photo";
import styles from "./Lightbox.module.css";

interface LightboxProps {
  photos: PhotoMeta[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Lightbox({ photos, currentIndex, onClose, onPrev, onNext }: LightboxProps) {
  const photo = photos[currentIndex];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!photo) return null;

  const exifEntries: { icon: string; label: string; value: string }[] = [];

  if (photo.dateTaken) {
    exifEntries.push({ icon: "\ud83d\udcc5", label: "촬영일시", value: formatDate(photo.dateTaken) });
  }
  if (photo.camera) {
    exifEntries.push({ icon: "\ud83d\udcf7", label: "카메라", value: photo.camera });
  }
  if (photo.lens) {
    exifEntries.push({ icon: "\ud83d\udd0d", label: "렌즈", value: photo.lens });
  }

  const settings = [
    photo.focalLength ? `${photo.focalLength}mm` : null,
    photo.aperture ? `f/${photo.aperture}` : null,
    photo.shutterSpeed,
    photo.iso ? `ISO ${photo.iso}` : null,
  ].filter(Boolean);

  if (settings.length > 0) {
    exifEntries.push({ icon: "\u2699\ufe0f", label: "설정", value: settings.join("  \u00b7  ") });
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <img className={styles.image} src={photo.src} alt={photo.fileName} />
        <div className={styles.info}>
          <div className={styles.fileName}>{photo.fileName}</div>
          {exifEntries.length > 0 && (
            <div className={styles.meta}>
              {exifEntries.map((entry) => (
                <div key={entry.label} className={styles.metaItem}>
                  <span className={styles.metaIcon}>{entry.icon}</span>
                  <span className={entry.label === "설정" ? styles.exifValues : ""}>{entry.value}</span>
                </div>
              ))}
            </div>
          )}
          <div className={styles.counter}>
            {currentIndex + 1} / {photos.length}
          </div>
        </div>
      </div>
      <button className={styles.close} onClick={onClose} aria-label="Close">
        &times;
      </button>
      {currentIndex > 0 && (
        <button className={`${styles.nav} ${styles.prev}`} onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous">
          &#8249;
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button className={`${styles.nav} ${styles.next}`} onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next">
          &#8250;
        </button>
      )}
    </div>
  );
}
