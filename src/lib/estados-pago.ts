export const ESTADOS_PAGO = ["PENDIENTE", "PARCIAL", "PAGADO_TOTAL"] as const;

export type EstadoPago = (typeof ESTADOS_PAGO)[number];

export function esEstadoPago(valor: string): valor is EstadoPago {
  return (ESTADOS_PAGO as readonly string[]).includes(valor);
}
