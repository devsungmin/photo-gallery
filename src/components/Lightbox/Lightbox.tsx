import { useEffect, useCallback } from "react";
import type { Photo } from "../../types/photo";
import styles from "./Lightbox.module.css";

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
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

  const { meta } = photo;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <img className={styles.image} src={photo.src.replace("w=600&h=400", "w=1200&h=800")} alt={photo.title} />
        <div className={styles.info}>
          <div className={styles.title}>{photo.title}</div>
          {meta && (
            <div className={styles.meta}>
              {meta.location && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>&#x1f4cd;</span>
                  <span>{meta.location}</span>
                </div>
              )}
              {meta.date && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>&#x1f4c5;</span>
                  <span>{meta.date}</span>
                </div>
              )}
              {meta.camera && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>&#x1f4f7;</span>
                  <span>{meta.camera}</span>
                </div>
              )}
              {meta.lens && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>&#x1f50d;</span>
                  <span>{meta.lens}</span>
                </div>
              )}
              {(meta.focalLength || meta.aperture || meta.shutterSpeed || meta.iso) && (
                <div className={styles.metaItem}>
                  <span className={styles.metaIcon}>&#x2699;&#xfe0f;</span>
                  <span className={styles.exifValues}>
                    {[meta.focalLength, meta.aperture, meta.shutterSpeed, meta.iso ? `ISO ${meta.iso}` : null]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <button className={styles.close} onClick={onClose} aria-label="Close">
        &times;
      </button>
      {currentIndex > 0 && (
        <button className={`${styles.nav} ${styles.prev}`} onClick={onPrev} aria-label="Previous">
          &#8249;
        </button>
      )}
      {currentIndex < photos.length - 1 && (
        <button className={`${styles.nav} ${styles.next}`} onClick={onNext} aria-label="Next">
          &#8250;
        </button>
      )}
    </div>
  );
}
