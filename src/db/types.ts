export type Category = {
  id: number;
  nome: string;
  colore: string;
};

export type Expense = {
  id: number;
  /** Importo in centesimi di euro (intero, evita errori di arrotondamento). */
  importo: number;
  category_id: number;
  /** Data in formato ISO "YYYY-MM-DD". */
  data: string;
  nota: string | null;
};

export type NewCategory = Omit<Category, 'id'>;
export type NewExpense = Omit<Expense, 'id'>;
