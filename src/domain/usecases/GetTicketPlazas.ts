import { Ticket } from '../entities/Ticket';

export function getTicketPlazas(tickets: Ticket[]): string[] {
  const plazas = new Set<string>();

  tickets.forEach((t) => {
    plazas.add(t.plaza || 'SIN PLAZA');
  });

  return Array.from(plazas).sort((a, b) => a.localeCompare(b));
}
