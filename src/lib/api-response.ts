import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true as const, data }, { status });
}
export function created<T>(data: T) {
  return ok(data, 201);
}
export function fail(error: string, status = 400, meta?: Record<string, unknown>) {
  return NextResponse.json({ ok: false as const, error, meta }, { status });
}
export function unauthorized(error = "No autenticado.") {
  return fail(error, 401);
}
export function forbidden(error = "No autorizado.") {
  return fail(error, 403);
}
export function notFound(error = "Recurso no encontrado.") {
  return fail(error, 404);
}
