import { Ticket } from '../entities/Ticket';

export interface EstatusTotal {
  estatus: string;
  total: number;
}

export function getTicketsByEstatus(tickets: Ticket[]): EstatusTotal[] {
  const totals: Record<string, number> = {};

  tickets.forEach((t) => {
    const key = t.estatus || 'SIN ESTATUS';
    totals[key] = (totals[key] || 0) + 1;
  });

  return Object.entries(totals)
    .map(([estatus, total]) => ({ estatus, total }))
    .sort((a, b) => b.total - a.total);
}
