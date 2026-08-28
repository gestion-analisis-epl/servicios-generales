import { Office, ESTADO_VENCIDO } from '../entities/Office';

export interface CompanyOffice {
  codigo: string;
  totalMensual: number;
  fechaLimitePago: string;
}

export interface CompanyTotal {
  empresa: string;
  total: number;
  oficinas: CompanyOffice[];
}

export function getMonthlyTotalByCompany(offices: Office[]): CompanyTotal[] {
  const totals: Record<string, CompanyOffice[]> = {};

  offices.forEach((o) => {
    if (o.estadoVigencia === ESTADO_VENCIDO) return;
    const key = o.empresa || 'Sin empresa';
    if (!totals[key]) totals[key] = [];
    totals[key].push({ codigo: o.codigo, totalMensual: Number(o.totalMensual) || 0, fechaLimitePago: o.fechaLimitePago });
  });

  return Object.keys(totals)
    .map((empresa) => ({
      empresa,
      total: totals[empresa].reduce((sum, o) => sum + o.totalMensual, 0),
      oficinas: totals[empresa]
    }))
    .sort((a, b) => b.total - a.total);
}
