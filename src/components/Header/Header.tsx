import type { SortKey } from "../../types/photo";
import styles from "./Header.module.css";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  sortBy: SortKey;
  onSortChange: (sort: SortKey) => void;
}

const sortOptions: { value: SortKey; label: string }[] = [
  { value: "dateTaken", label: "촬영일시" },
  { value: "camera", label: "카메라" },
  { value: "focalLength", label: "초점거리" },
  { value: "iso", label: "ISO" },
];

export function Header({
  searchQuery,
  onSearchChange,
  isDark,
  onToggleTheme,
  sortBy,
  onSortChange,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>devsungmin's Photo Gallery</div>
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
        <select
          className={styles.sortSelect}
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortKey)}
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <button className={styles.themeToggle} onClick={onToggleTheme} aria-label="Toggle theme">
        {isDark ? "\u2600\ufe0f" : "\ud83c\udf19"}
      </button>
    </header>
  );
}
