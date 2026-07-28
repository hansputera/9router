import { machineIdSync } from "node-machine-id";
import crypto from "node:crypto";

const isBun = process.versions.bun;
let cachedRawId = null;

function loadRawMachineId() {
  if (cachedRawId) return cachedRawId;
  try {
    if (isBun) {
      cachedRawId = Bun.getMachineId();
    } else {
      cachedRawId = machineIdSync();
    }
  } catch {
    cachedRawId = crypto.randomUUID();
  }
  return cachedRawId;
}

export async function getConsistentMachineId(salt = "endpoint-proxy-salt") {
  const rawId = loadRawMachineId();
  return crypto.createHash("sha256").update(rawId + salt).digest("hex").substring(0, 16);
}
