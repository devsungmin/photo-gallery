import type { PhotoMeta, ViewMode } from "../../types/photo";
import { PhotoCard } from "../PhotoCard/PhotoCard";
import styles from "./PhotoGrid.module.css";

interface DateGroup {
  date: string;
  label: string;
  photos: { photo: PhotoMeta; globalIndex: number }[];
}

interface PhotoGridProps {
  photos: PhotoMeta[];
  onPhotoClick: (index: number) => void;
  viewMode: ViewMode;
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function groupByDate(photos: PhotoMeta[]): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  photos.forEach((photo, globalIndex) => {
    const dateKey = photo.dateTaken
      ? photo.dateTaken.slice(0, 10)
      : "unknown";
    const label = photo.dateTaken
      ? formatDateLabel(photo.dateTaken)
      : "날짜 없음";

    if (!groups.has(dateKey)) {
      groups.set(dateKey, { date: dateKey, label, photos: [] });
    }
    groups.get(dateKey)!.photos.push({ photo, globalIndex });
  });

  return Array.from(groups.values());
}

export function PhotoGrid({ photos, onPhotoClick, viewMode }: PhotoGridProps) {
  if (photos.length === 0) {
    return <div className={styles.empty}>No photos found.</div>;
  }

  if (viewMode === "grid") {
    return (
      <div className={styles.flatGrid}>
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={() => onPhotoClick(index)}
          />
        ))}
      </div>
    );
  }

  const groups = groupByDate(photos);

  return (
    <div className={styles.timeline}>
      {groups.map((group) => (
        <section key={group.date} className={styles.dateSection}>
          <div className={styles.dateHeader}>
            <h2 className={styles.dateLabel}>{group.label}</h2>
            <span className={styles.dateCount}>{group.photos.length}장</span>
          </div>
          <div className={styles.grid}>
            {group.photos.map(({ photo, globalIndex }) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onClick={() => onPhotoClick(globalIndex)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
