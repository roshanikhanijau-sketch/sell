import path from 'path';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Resolve directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export async function getDB() {
  if (dbInstance) return dbInstance;
  const dbPath = path.join(__dirname, 'db.sqlite');
  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  // Initialise tables
  await dbInstance.run(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT,
      college_id TEXT,
      verified INTEGER DEFAULT 0,
      otp TEXT,
      otp_expires INTEGER
    );
  `);
  return dbInstance;
}

export async function findUserByEmail(email) {
  const db = await getDB();
  return db.get('SELECT * FROM users WHERE email = ?', email.toLowerCase());
}

export async function upsertUser(user) {
  const db = await getDB();
  const { email, name, college_id, verified = 0, otp = null, otp_expires = null } = user;
  await db.run(
    `INSERT INTO users (email, name, college_id, verified, otp, otp_expires)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       name=excluded.name,
       college_id=excluded.college_id,
       verified=excluded.verified,
       otp=excluded.otp,
       otp_expires=excluded.otp_expires;`,
    email.toLowerCase(),
    name,
    college_id,
    verified,
    otp,
    otp_expires
  );
  return findUserByEmail(email);
}

export const openDb = getDB;

export async function verifyUserOtp(email, otp) {
  const db = await getDB();
  const user = await findUserByEmail(email);
  if (!user) return null;
  const now = Date.now();
  if (user.otp !== otp || now > user.otp_expires) return null;
  await db.run('UPDATE users SET verified = 1, otp = NULL, otp_expires = NULL WHERE email = ?', email.toLowerCase());
  return findUserByEmail(email);
}
