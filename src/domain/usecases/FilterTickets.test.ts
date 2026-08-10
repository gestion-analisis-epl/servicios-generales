import { describe, expect, it } from 'vitest';
import { createTicket } from '../entities/Ticket';
import { filterTickets } from './FilterTickets';

function ticket(fechaYHora: string) {
  return createTicket({ folio: fechaYHora, fechaYHora });
}

describe('filterTickets', () => {
  const tickets = [ticket('2026-01-15'), ticket('2026-06-10'), ticket('2027-03-01')];

  it('returns everything when no filter is applied', () => {
    expect(filterTickets(tickets, {})).toHaveLength(3);
  });

  it('excludes everything when meses is explicitly empty', () => {
    expect(filterTickets(tickets, { meses: [] })).toHaveLength(0);
  });

  it('filters by mes regardless of año', () => {
    const result = filterTickets(tickets, { meses: [1] });
    expect(result.map((t) => t.folio)).toEqual(['2026-01-15']);
  });

  it('filters by trimestre', () => {
    const result = filterTickets(tickets, { trimestres: [2] });
    expect(result.map((t) => t.folio)).toEqual(['2026-06-10']);
  });

  it('filters by año', () => {
    const result = filterTickets(tickets, { anios: [2027] });
    expect(result.map((t) => t.folio)).toEqual(['2027-03-01']);
  });

  it('filters by date range', () => {
    const result = filterTickets(tickets, { fechaInicio: '2026-02-01', fechaFin: '2026-12-31' });
    expect(result.map((t) => t.folio)).toEqual(['2026-06-10']);
  });
});
