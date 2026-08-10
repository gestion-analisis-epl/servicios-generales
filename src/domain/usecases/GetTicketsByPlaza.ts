import { Ticket } from '../entities/Ticket';

export interface PlazaTotal {
  plaza: string;
  total: number;
}

export function getTicketsByPlaza(tickets: Ticket[]): PlazaTotal[] {
  const totals: Record<string, number> = {};

  tickets.forEach((t) => {
    const key = t.plaza || 'SIN PLAZA';
    totals[key] = (totals[key] || 0) + 1;
  });

  return Object.entries(totals)
    .map(([plaza, total]) => ({ plaza, total }))
    .sort((a, b) => b.total - a.total);
}
