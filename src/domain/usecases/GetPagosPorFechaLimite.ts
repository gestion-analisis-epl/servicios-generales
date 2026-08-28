import { Office } from '../entities/Office';

export interface PagoPorFechaOffice {
  codigo: string;
  empresa: string;
  totalFactura: number;
}

export interface PagoPorFechaRow {
  fecha: string;
  totalFactura: number;
  totalOficinas: number;
  diasRestantes: number | null;
  vencimiento: 'CRÍTICO' | 'A TIEMPO' | 'REVISAR';
  oficinas: PagoPorFechaOffice[];
}

const DIAS_CRITICO = 30;

export function getPagosPorFechaLimite(offices: Office[], today: Date = new Date()): PagoPorFechaRow[] {
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const groups: Record<string, { fecha: string; sortDate: Date | null; totalFactura: number; totalOficinas: number; oficinas: PagoPorFechaOffice[] }> = {};

  offices.forEach((o) => {
    if (!o.fechaLimitePago) return;

    const date = new Date(o.fechaLimitePago);
    const isValid = !isNaN(date.getTime());
    const key = isValid ? formatDateKey(date) : o.fechaLimitePago;

    if (!groups[key]) groups[key] = { fecha: key, sortDate: isValid ? date : null, totalFactura: 0, totalOficinas: 0, oficinas: [] };
    groups[key].totalFactura += o.totalFactura;
    groups[key].totalOficinas++;
    groups[key].oficinas.push({ codigo: o.codigo, empresa: o.empresa, totalFactura: o.totalFactura });
  });

  return Object.values(groups)
    .map((g) => {
      if (!g.sortDate) {
        return { fecha: g.fecha, totalFactura: g.totalFactura, totalOficinas: g.totalOficinas, diasRestantes: null, vencimiento: 'REVISAR' as const, oficinas: g.oficinas };
      }

      const diasRestantes = Math.ceil((g.sortDate.getTime() - startOfToday.getTime()) / 86_400_000);
      const vencimiento = diasRestantes < DIAS_CRITICO ? ('CRÍTICO' as const) : ('A TIEMPO' as const);
      return { fecha: g.fecha, totalFactura: g.totalFactura, totalOficinas: g.totalOficinas, diasRestantes, vencimiento, oficinas: g.oficinas };
    })
    .sort((a, b) => b.totalFactura - a.totalFactura);
}

function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
