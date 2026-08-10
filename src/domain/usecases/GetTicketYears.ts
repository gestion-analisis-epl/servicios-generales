import { Ticket } from '../entities/Ticket';

export function getTicketYears(tickets: Ticket[]): number[] {
  const years = new Set<number>();

  tickets.forEach((t) => {
    const date = new Date(t.fechaYHora);
    if (!isNaN(date.getTime())) years.add(date.getFullYear());
  });

  return Array.from(years).sort((a, b) => a - b);
}
