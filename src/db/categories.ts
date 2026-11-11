import { getDb } from './database';
import type { Category, NewCategory } from './types';

export async function createCategory(input: NewCategory): Promise<Category> {
  const db = await getDb();
  const res = await db.runAsync(
    'INSERT INTO categories (nome, colore) VALUES (?, ?)',
    input.nome,
    input.colore,
  );
  return { id: res.lastInsertRowId, ...input };
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDb();
  return db.getAllAsync<Category>('SELECT id, nome, colore FROM categories ORDER BY id');
}

export async function getCategory(id: number): Promise<Category | null> {
  const db = await getDb();
  return db.getFirstAsync<Category>(
    'SELECT id, nome, colore FROM categories WHERE id = ?',
    id,
  );
}

export async function updateCategory(id: number, input: NewCategory): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE categories SET nome = ?, colore = ? WHERE id = ?',
    input.nome,
    input.colore,
    id,
  );
}

/** Elimina la categoria e, a cascata, tutte le sue spese. */
export async function deleteCategory(id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM categories WHERE id = ?', id);
}
