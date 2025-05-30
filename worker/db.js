// worker/db.js

// Holds the D1 binding once initialized
let DB = null;

/**
 * Initialize the database binding. Call this at startup in index.js:
 *
 *   import { initDB } from './db.js';
 *   export default {
 *     async fetch(request, env) {
 *       initDB(env);
 *       // ...handle routing
 *     }
 *   }
 */
export function initDB(env) {
  if (!env.DB) {
    throw new Error('Missing D1 binding: DB');
  }
  DB = env.DB;
}

/**
 * Lightweight wrapper exposing prepare & exec methods.
 * Uses D1's prepare()/bind()/all()/run() API.
 */
export const db = {
  /**
   * Prepare a SQL statement.
   * @param {string} sql
   * @returns {{
   *   bind: (...params: any[]) => { all: () => Promise<{ results: any[] }>, run: () => Promise<{ success: boolean, lastInsertRowid?: number }> }
   * }}
   */
  prepare(sql) {
    if (!DB) throw new Error('DB not initialized. Call initDB(env) first.');
    return DB.prepare(sql);
  },

  /**
   * Execute multiple statements or schema SQL.
   * @param {string} sql
   * @returns {Promise<void>}
   */
  async exec(sql) {
    if (!DB) throw new Error('DB not initialized. Call initDB(env) first.');
    await DB.batch(sql);
  }
};
