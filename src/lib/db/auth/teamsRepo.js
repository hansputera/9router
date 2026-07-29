import { v4 as uuidv4 } from "uuid";
import { getAdapter } from "../driver.js";

function rowToTeam(row) {
  if (!row) return null;
  return { id: row.id, name: row.name, slug: row.slug, createdAt: row.createdAt };
}

function rowToMember(row) {
  if (!row) return null;
  return { id: row.id, teamId: row.teamId, userId: row.userId, role: row.role, createdAt: row.createdAt };
}

export async function getTeams() {
  const db = await getAdapter();
  return db.all(`SELECT * FROM teams ORDER BY createdAt ASC`).map(rowToTeam);
}

export async function getTeamById(id) {
  const db = await getAdapter();
  return rowToTeam(db.get(`SELECT * FROM teams WHERE id = ?`, [id]));
}

export async function createTeam(name, userId) {
  const db = await getAdapter();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
  const teamId = uuidv4();
  db.run(`INSERT INTO teams(id, name, slug, createdAt) VALUES(?, ?, ?, ?)`, [teamId, name, slug, new Date().toISOString()]);
  // Creator becomes admin
  addTeamMember(teamId, userId, "admin");
  return getTeamById(teamId);
}

export async function getTeamMembers(teamId) {
  const db = await getAdapter();
  return db.all(
    `SELECT tm.*, u.name, u.email, u.image
     FROM team_members tm JOIN users u ON u.id = tm.userId
     WHERE tm.teamId = ?
     ORDER BY tm.role, u.name`,
    [teamId]
  );
}

export async function addTeamMember(teamId, userId, role = "member") {
  const db = await getAdapter();
  const id = uuidv4();
  const now = new Date().toISOString();
  try {
    db.run(`INSERT INTO team_members(id, teamId, userId, role, createdAt) VALUES(?, ?, ?, ?, ?)`, [id, teamId, userId, role, now]);
    return { id, teamId, userId, role, createdAt: now };
  } catch {
    // Duplicate — already a member
    return null;
  }
}

export async function removeTeamMember(teamId, userId) {
  const db = await getAdapter();
  db.run(`DELETE FROM team_members WHERE teamId = ? AND userId = ?`, [teamId, userId]);
}

export async function updateMemberRole(teamId, userId, role) {
  const db = await getAdapter();
  db.run(`UPDATE team_members SET role = ? WHERE teamId = ? AND userId = ?`, [role, teamId, userId]);
}

export async function getUserTeams(userId) {
  const db = await getAdapter();
  return db.all(
    `SELECT t.*, tm.role FROM teams t
     JOIN team_members tm ON tm.teamId = t.id
     WHERE tm.userId = ?
     ORDER BY tm.role, t.name`,
    [userId]
  );
}
