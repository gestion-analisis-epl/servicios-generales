import { Office, ESTADO_VENCIDO } from '../entities/Office';

export interface CompanyTotal {
  empresa: string;
  total: number;
}

export function getMonthlyTotalByCompany(offices: Office[]): CompanyTotal[] {
  const totals: Record<string, number> = {};

  offices.forEach((o) => {
    if (o.estadoVigencia === ESTADO_VENCIDO) return;
    const key = o.empresa || 'Sin empresa';
    totals[key] = (totals[key] || 0) + (Number(o.totalMensual) || 0);
  });

  return Object.keys(totals)
    .map((empresa) => ({ empresa, total: totals[empresa] }))
    .sort((a, b) => b.total - a.total);
}
