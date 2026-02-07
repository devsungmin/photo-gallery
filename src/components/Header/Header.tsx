import styles from "./Header.module.css";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({ searchQuery, onSearchChange, isDark, onToggleTheme }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>Photo Gallery</div>
      <div className={styles.searchWrapper}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search photos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <button className={styles.themeToggle} onClick={onToggleTheme} aria-label="Toggle theme">
        {isDark ? "\u2600\ufe0f" : "\ud83c\udf19"}
      </button>
    </header>
  );
}
