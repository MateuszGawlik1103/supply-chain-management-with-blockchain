import fs from 'fs';
import pkg from 'pg';

const { Pool } = pkg;

const password = fs.readFileSync(process.env.DATABASE_PASSWORD_FILE, "utf8").trim();

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  database: process.env.DATABASE_NAME,
  password: password,
  port: 5432
});

export default pool;
