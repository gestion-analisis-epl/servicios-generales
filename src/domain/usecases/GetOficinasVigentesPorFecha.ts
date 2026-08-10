import { Office, ESTADO_VENCIDO } from '../entities/Office';

export interface OficinasPorFechaPivot {
  columns: string[];
  rows: { codigo: string; fecha: string }[];
  columnTotals: Record<string, number>;
  grandTotal: number;
}

export function getOficinasVigentesPorFecha(offices: Office[]): OficinasPorFechaPivot {
  const rows = offices
    .filter((o) => o.estadoVigencia !== ESTADO_VENCIDO && o.fechaLimitePago)
    .map((o) => {
      const date = new Date(o.fechaLimitePago);
      const isValid = !isNaN(date.getTime());
      return { codigo: o.codigo, fecha: isValid ? formatDateKey(date) : o.fechaLimitePago, sortDate: isValid ? date : null };
    })
    .sort((a, b) => a.codigo.localeCompare(b.codigo));

  const sortDateByFecha = new Map<string, Date | null>();
  rows.forEach((r) => {
    if (!sortDateByFecha.has(r.fecha)) sortDateByFecha.set(r.fecha, r.sortDate);
  });

  const columns = Array.from(sortDateByFecha.entries())
    .sort(([, dateA], [, dateB]) => {
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateA.getTime() - dateB.getTime();
    })
    .map(([fecha]) => fecha);

  const columnTotals: Record<string, number> = {};
  columns.forEach((c) => { columnTotals[c] = 0; });
  rows.forEach((r) => { columnTotals[r.fecha]++; });

  return {
    columns,
    rows: rows.map(({ codigo, fecha }) => ({ codigo, fecha })),
    columnTotals,
    grandTotal: rows.length
  };
}

function formatDateKey(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
