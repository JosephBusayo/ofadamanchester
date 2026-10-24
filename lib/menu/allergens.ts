// The 14 allergens UK food businesses must declare (Food Information Regulations 2014).
export const UK_ALLERGENS = {
  celery: "Celery",
  gluten: "Cereals containing gluten",
  crustaceans: "Crustaceans",
  eggs: "Eggs",
  fish: "Fish",
  lupin: "Lupin",
  milk: "Milk",
  molluscs: "Molluscs",
  mustard: "Mustard",
  nuts: "Tree nuts",
  peanuts: "Peanuts",
  sesame: "Sesame",
  soya: "Soya",
  sulphites: "Sulphur dioxide & sulphites",
} as const;

export type AllergenKey = keyof typeof UK_ALLERGENS;

export function allergenNames(keys: readonly string[]): string[] {
  return keys.map((k) => UK_ALLERGENS[k as AllergenKey] ?? k);
}
