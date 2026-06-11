
import { Database, SqlitePool } from '@tauri-apps/plugin-sql';

// Initialize the SQLite database
let db: Database | null = null;

export async function initDb(): Promise<Database> {
  if (!db) {
    // Connect to the SQLite database
    db = await SqlitePool.load('sqlite:erp.db');
  }
  return db;
}

// Helper function to execute queries
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const database = await initDb();
  const result = await database.select(sql, params || []);
  return result as T[];
}

// Helper function to execute insert/update/delete
export async function execute(
  sql: string,
  params?: any[]
): Promise<number> {
  const database = await initDb();
  const result = await database.execute(sql, params || []);
  return result;
}
