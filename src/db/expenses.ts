import { getDb } from './database';
import type { Expense, NewExpense } from './types';

const COLUMNS = 'id, importo, category_id, data, nota';

export type ExpenseFilter = {
  /** Estremi inclusi, formato "YYYY-MM-DD". */
  from?: string;
  to?: string;
  categoryIds?: number[];
};

export async function createExpense(input: NewExpense): Promise<Expense> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO expenses (importo, category_id, data, nota) VALUES (?, ?, ?, ?)',
    input.importo,
    input.category_id,
    input.data,
    input.nota,
  );
  return { id: res.lastInsertRowId, ...input };
}

export async function getExpenses(filter: ExpenseFilter = {}): Promise<Expense[]> {
  const db = await getDb();
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter.from) {
    where.push('data >= ?');
    params.push(filter.from);
  }
  if (filter.to) {
    where.push('data <= ?');
    params.push(filter.to);
  }
  if (filter.categoryIds) {
    if (filter.categoryIds.length === 0) return [];
    where.push(`category_id IN (${filter.categoryIds.map(() => '?').join(',')})`);
    params.push(...filter.categoryIds);
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return db.getAllAsync<Expense>(
    `SELECT ${COLUMNS} FROM expenses ${clause} ORDER BY data DESC, id DESC`,
    params,
  );
}

export async function getExpense(id: number): Promise<Expense | null> {
  const db = await getDb();
  return db.getFirstAsync<Expense>(`SELECT ${COLUMNS} FROM expenses WHERE id = ?`, id);
}

export async function updateExpense(id: number, input: NewExpense): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE expenses SET importo = ?, category_id = ?, data = ?, nota = ? WHERE id = ?',
    input.importo,
    input.category_id,
    input.data,
    input.nota,
    id,
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

export async function countExpensesByCategory(categoryId: number): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM expenses WHERE category_id = ?',
    categoryId,
  );
  return row?.n ?? 0;
}

export type CategoryTotal = {
  category_id: number;
  nome: string;
  colore: string;
  /** Totale in centesimi nel periodo (0 se nessuna spesa). */
  totale: number;
};

export type PeriodSummary = {
  totale: number;
  conteggio: number;
  perCategoria: CategoryTotal[];
};

/** Totale, numero di spese e totale per categoria (ordinate dal più alto) nel periodo. */
export async function getSummary(range: { from: string; to: string }): Promise<PeriodSummary> {
  const db = await getDb();
  const perCategoria = await db.getAllAsync<CategoryTotal>(
    `SELECT c.id AS category_id, c.nome, c.colore,
            COALESCE(SUM(e.importo), 0) AS totale
       FROM categories c
       LEFT JOIN expenses e
         ON e.category_id = c.id AND e.data >= ? AND e.data <= ?
      GROUP BY c.id
      ORDER BY totale DESC, c.id`,
    range.from,
    range.to,
  );
  const row = await db.getFirstAsync<{ totale: number; n: number }>(
    `SELECT COALESCE(SUM(importo), 0) AS totale, COUNT(*) AS n
       FROM expenses WHERE data >= ? AND data <= ?`,
    range.from,
    range.to,
  );
  return { totale: row?.totale ?? 0, conteggio: row?.n ?? 0, perCategoria };
}
