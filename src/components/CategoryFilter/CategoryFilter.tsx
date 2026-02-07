import styles from "./CategoryFilter.module.css";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className={styles.container}>
      {categories.map((cat) => (
        <button
          key={cat}
          className={`${styles.button} ${selected === cat ? styles.active : ""}`}
          onClick={() => onSelect(cat)}
        >
          {cat === "all" ? "All" : capitalize(cat)}
        </button>
      ))}
    </div>
  );
}
