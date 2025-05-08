import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import log from '../utils/logger.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Function to initialize the MySQL connection pool
async function initDatabase() {
  try {
    const pool = await mysql.createPool({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'aphians_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test the connection
    const connection = await pool.getConnection();
    log.info('MySQL Connected: Connection pool initialized');
    connection.release();

    return pool;
  } catch (err) {
    log.error('Error initializing database pool:', err.message, err.stack);
    throw err;
  }
}

// Export the database pool
const db = await initDatabase();

export default db;