import { useState, useMemo, useCallback } from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import { photos, categories } from "./data/photos";
import type { PhotoMeta, SortKey } from "./types/photo";
import { Header } from "./components/Header/Header";
import { CategoryFilter } from "./components/CategoryFilter/CategoryFilter";
import { PhotoGrid } from "./components/PhotoGrid/PhotoGrid";
import { Lightbox } from "./components/Lightbox/Lightbox";
import styles from "./App.module.css";

function sortPhotos(list: PhotoMeta[], sortBy: SortKey): PhotoMeta[] {
  return [...list].sort((a, b) => {
    switch (sortBy) {
      case "dateTaken": {
        const da = a.dateTaken ?? "";
        const db = b.dateTaken ?? "";
        return db.localeCompare(da);
      }
      case "camera": {
        const ca = a.camera ?? "";
        const cb = b.camera ?? "";
        return ca.localeCompare(cb);
      }
      case "iso": {
        return (a.iso ?? 0) - (b.iso ?? 0);
      }
      case "focalLength": {
        return (a.focalLength ?? 0) - (b.focalLength ?? 0);
      }
      default:
        return 0;
    }
  });
}

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("dateTaken");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const matched = photos.filter((p) => {
      const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
      const matchSearch =
        !query ||
        p.fileName.toLowerCase().includes(query) ||
        (p.camera?.toLowerCase().includes(query) ?? false) ||
        (p.lens?.toLowerCase().includes(query) ?? false);
      return matchCategory && matchSearch;
    });
    return sortPhotos(matched, sortBy);
  }, [selectedCategory, searchQuery, sortBy]);

  const openLightbox = useCallback((index: number) => setLightboxIndex(index), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevPhoto = useCallback(
    () => setLightboxIndex((i) => (i !== null && i > 0 ? i - 1 : i)),
    [],
  );
  const nextPhoto = useCallback(
    () => setLightboxIndex((i) => (i !== null && i < filtered.length - 1 ? i + 1 : i)),
    [],
  );

  return (
    <div className={styles.app}>
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isDark={isDark}
        onToggleTheme={toggle}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
      <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      <PhotoGrid photos={filtered} onPhotoClick={openLightbox} />
      {lightboxIndex !== null && (
        <Lightbox
          photos={filtered}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </div>
  );
}
