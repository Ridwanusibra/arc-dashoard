// backend/db/db.ts
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

let db: Database | null = null;

/**
 * Get the SQLite database connection.
 * Creates the database and transactions table if they don't exist.
 */
export async function getDB() {
  if (!db) {
    db = await open({
      filename: 'arc.db',       // SQLite database file
      driver: sqlite3.Database, // SQLite driver
    });

    // Create the transactions table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        hash TEXT PRIMARY KEY,
        from_addr TEXT,
        to_addr TEXT,
        value REAL,
        gas_used INTEGER,
        timestamp INTEGER,
        faucet INTEGER DEFAULT 0
      )
    `);

    console.log('✅ Database initialized and transactions table ready');
  }
  return db;
}

/**
 * Helper to insert a transaction into the database.
 * Used by the indexer.
 */
export async function insertTransaction(tx: {
  hash: string;
  from_addr: string;
  to_addr: string;
  value: number;
  gas_used: number;
  timestamp: number;
  faucet?: number;
}) {
  const database = await getDB();
  await database.run(
    `INSERT OR IGNORE INTO transactions 
      (hash, from_addr, to_addr, value, gas_used, timestamp, faucet)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    tx.hash,
    tx.from_addr.toLowerCase(),
    tx.to_addr?.toLowerCase() || '',
    tx.value,
    tx.gas_used,
    tx.timestamp,
    tx.faucet ?? 0
  );
}