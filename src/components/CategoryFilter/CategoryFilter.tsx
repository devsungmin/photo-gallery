import styles from "./CategoryFilter.module.css";

const labels: Record<string, string> = {
  all: "All",
  nature: "Nature",
  city: "City",
  people: "People",
};

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
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
          {labels[cat] ?? cat}
        </button>
      ))}
    </div>
  );
}
