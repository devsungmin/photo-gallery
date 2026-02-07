import { useState, useMemo, useCallback } from "react";
import { useDarkMode } from "./hooks/useDarkMode";
import { photos, categories } from "./data/photos";
import { Header } from "./components/Header/Header";
import { CategoryFilter } from "./components/CategoryFilter/CategoryFilter";
import { PhotoGrid } from "./components/PhotoGrid/PhotoGrid";
import { Lightbox } from "./components/Lightbox/Lightbox";
import type { ViewMode } from "./types/photo";
import styles from "./App.module.css";

export default function App() {
  const { isDark, toggle } = useDarkMode();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return photos
      .filter((p) => {
        const matchCategory = selectedCategory === "all" || p.category === selectedCategory;
        const matchSearch =
          !query ||
          p.fileName.toLowerCase().includes(query) ||
          (p.camera?.toLowerCase().includes(query) ?? false) ||
          (p.lens?.toLowerCase().includes(query) ?? false);
        return matchCategory && matchSearch;
      })
      .sort((a, b) => {
        const da = a.dateTaken ?? "";
        const db = b.dateTaken ?? "";
        return db.localeCompare(da);
      });
  }, [selectedCategory, searchQuery]);

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
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <CategoryFilter categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
      <PhotoGrid photos={filtered} onPhotoClick={openLightbox} viewMode={viewMode} />
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
