import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const config: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'scrap_db',
  user: process.env.DB_USER || 'username',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Create pool based on environment
let pool: Pool;

if (process.env.DATABASE_URL) {
  console.log('PostgreSQL: Using DATABASE_URL:', process.env.DATABASE_URL);
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('PostgreSQL: Using individual DB config:', config);
  pool = new Pool(config);
}

// Add connection event listeners for debugging
pool.on('connect', () => console.log('PostgreSQL: Client connected successfully.'));
pool.on('error', (err) => console.error('PostgreSQL: Client error:', err.message, err.stack));
pool.on('acquire', () => console.log('PostgreSQL: Client acquired from pool.'));
pool.on('release', () => console.log('PostgreSQL: Client released to pool.'));

export default pool;
export { Pool, PoolConfig };