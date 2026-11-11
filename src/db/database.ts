import * as SQLite from 'expo-sqlite';

const DB_NAME = 'unci-unci.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase) {
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = row?.user_version ?? 0;

  if (version < 1) {
    await db.execAsync(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        colore TEXT NOT NULL
      );
      CREATE TABLE expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        importo INTEGER NOT NULL,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        nota TEXT
      );
      CREATE INDEX idx_expenses_data ON expenses(data);
      CREATE INDEX idx_expenses_category ON expenses(category_id);
      PRAGMA user_version = 1;
    `);
  }

  if (version < 2) {
    await db.execAsync(`
      CREATE TABLE settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
      PRAGMA user_version = 2;
    `);
  }
}

/** Apre (una sola volta) il database e applica le migrazioni. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await migrate(db);
      return db;
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}
