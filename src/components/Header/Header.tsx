import type { ViewMode } from "../../types/photo";
import styles from "./Header.module.css";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function Header({
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  viewMode,
  onViewModeChange,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <img src="/favicon.svg" alt="logo" className={styles.logoIcon} />
        devsungmin's Photo Gallery
      </div>
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="검색 (파일명, 카메라, 렌즈...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${viewMode === "timeline" ? styles.viewBtnActive : ""}`}
            onClick={() => onViewModeChange("timeline")}
            aria-label="타임라인 보기"
            title="타임라인"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="16" height="3" rx="1" />
              <rect x="2" y="5" width="5" height="5" rx="1" />
              <rect x="9" y="5" width="5" height="5" rx="1" />
              <rect x="0" y="12" width="16" height="3" rx="1" />
            </svg>
          </button>
          <button
            className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""}`}
            onClick={() => onViewModeChange("grid")}
            aria-label="그리드 보기"
            title="그리드"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="0" y="0" width="7" height="7" rx="1" />
              <rect x="9" y="0" width="7" height="7" rx="1" />
              <rect x="0" y="9" width="7" height="7" rx="1" />
              <rect x="9" y="9" width="7" height="7" rx="1" />
            </svg>
          </button>
        </div>
      </div>
      <button className={styles.themeToggle} onClick={onToggleTheme} aria-label="Toggle theme">
        {isDark ? "\u2600\ufe0f" : "\ud83c\udf19"}
      </button>
    </header>
  );
}
