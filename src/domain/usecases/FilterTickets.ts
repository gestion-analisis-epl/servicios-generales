import { Ticket } from '../entities/Ticket';

export interface TicketFilters {
  fechaInicio?: string;
  fechaFin?: string;
  meses?: number[];
  trimestres?: number[];
  anios?: number[];
}

export function filterTickets(tickets: Ticket[], filters: TicketFilters): Ticket[] {
  const hasAnyFilter =
    filters.fechaInicio || filters.fechaFin || filters.meses !== undefined || filters.trimestres !== undefined || filters.anios !== undefined;
  if (!hasAnyFilter) return tickets;

  const start = filters.fechaInicio ? new Date(filters.fechaInicio) : null;
  const end = filters.fechaFin ? new Date(filters.fechaFin) : null;
  if (end) end.setHours(23, 59, 59, 999);

  return tickets.filter((t) => {
    if (!t.fechaYHora) return false;
    const date = new Date(t.fechaYHora);
    if (isNaN(date.getTime())) return false;

    if (start && date < start) return false;
    if (end && date > end) return false;
    if (filters.meses !== undefined && !filters.meses.includes(date.getMonth() + 1)) return false;
    if (filters.trimestres !== undefined) {
      const trimestre = Math.floor(date.getMonth() / 3) + 1;
      if (!filters.trimestres.includes(trimestre)) return false;
    }
    if (filters.anios !== undefined && !filters.anios.includes(date.getFullYear())) return false;

    return true;
  });
}
