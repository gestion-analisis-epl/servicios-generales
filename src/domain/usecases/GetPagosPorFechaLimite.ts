import { Office } from '../entities/Office';

export interface PagoPorFechaRow {
  fecha: string;
  totalFactura: number;
  totalOficinas: number;
  diasRestantes: number | null;
  vencimiento: 'CRÍTICO' | 'A TIEMPO' | 'REVISAR';
}

const DIAS_CRITICO = 30;

export function getPagosPorFechaLimite(offices: Office[], today: Date = new Date()): PagoPorFechaRow[] {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const groups: Record<string, { fecha: string; sortDate: Date | null; totalFactura: number; totalOficinas: number }> = {};

  offices.forEach((o) => {
    if (!o.fechaLimitePago) return;

    const date = new Date(o.fechaLimitePago);
    const isValid = !isNaN(date.getTime());
    const key = isValid ? formatDateKey(date) : o.fechaLimitePago;

    if (!groups[key]) groups[key] = { fecha: key, sortDate: isValid ? date : null, totalFactura: 0, totalOficinas: 0 };
    groups[key].totalFactura += o.totalFactura;
    groups[key].totalOficinas++;
  });

  return Object.values(groups)
    .map((g) => {
      if (!g.sortDate) {
        return { fecha: g.fecha, totalFactura: g.totalFactura, totalOficinas: g.totalOficinas, diasRestantes: null, vencimiento: 'REVISAR' as const };
      }

      const diasRestantes = Math.ceil((g.sortDate.getTime() - startOfToday.getTime()) / 86_400_000);
      const vencimiento = diasRestantes < DIAS_CRITICO ? ('CRÍTICO' as const) : ('A TIEMPO' as const);
      return { fecha: g.fecha, totalFactura: g.totalFactura, totalOficinas: g.totalOficinas, diasRestantes, vencimiento };
    })
    .sort((a, b) => b.totalFactura - a.totalFactura);
}

function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
