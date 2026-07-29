import { v4 as uuidv4 } from "uuid";
import { getAdapter } from "../driver.js";

function rowToUser(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, image: row.image, createdAt: row.createdAt };
}

export async function getUserById(id) {
  const db = await getAdapter();
  return rowToUser(db.get(`SELECT * FROM users WHERE id = ?`, [id]));
}

export async function getUserByEmail(email) {
  const db = await getAdapter();
  return rowToUser(db.get(`SELECT * FROM users WHERE email = ?`, [email]));
}

export async function upsertUser(data) {
  const db = await getAdapter();
  const now = new Date().toISOString();
  let user = getUserByEmail(data.email);
  if (user) {
    db.run(`UPDATE users SET name = ?, image = ? WHERE id = ?`, [data.name || null, data.image || null, user.id]);
    user = { ...user, name: data.name, image: data.image };
  } else {
    const id = data.id || uuidv4();
    db.run(`INSERT INTO users(id, name, email, image, createdAt) VALUES(?, ?, ?, ?, ?)`, [id, data.name || null, data.email, data.image || null, now]);
    user = { id, name: data.name, email: data.email, image: data.image, createdAt: now };
  }
  return user;
}
