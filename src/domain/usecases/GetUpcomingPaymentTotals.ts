import { Office, ESTADO_VENCIDO } from '../entities/Office';

export interface PaymentDateOffice {
  codigo: string;
  empresa: string;
  totalMensual: number;
}

export interface PaymentDateTotal {
  fecha: string;
  totalOficinas: number;
  oficinas: PaymentDateOffice[];
}

export function getUpcomingPaymentTotals(offices: Office[]): PaymentDateTotal[] {
  const totals: Record<string, { fecha: string; sortDate: Date; oficinas: PaymentDateOffice[] }> = {};

  offices.forEach((o) => {
    if (o.estadoVigencia === ESTADO_VENCIDO) return;
    if (!o.fechaLimitePago) return;

    const date = new Date(o.fechaLimitePago);
    const isValid = !isNaN(date.getTime());
    const key = isValid ? formatDateKey(date) : o.fechaLimitePago;
    const sortDate = isValid ? date : new Date(8640000000000000);

    if (!totals[key]) totals[key] = { fecha: key, sortDate, oficinas: [] };
    totals[key].oficinas.push({ codigo: o.codigo, empresa: o.empresa, totalMensual: o.totalMensual });
  });

  return Object.values(totals)
    .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())
    .map((row) => ({ fecha: row.fecha, totalOficinas: row.oficinas.length, oficinas: row.oficinas }));
}

function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
