import { randomBytes, scryptSync } from "node:crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function generarPasswordAleatorio(): string {
  return randomBytes(32).toString("hex");
}
