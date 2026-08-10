import { Office } from '../entities/Office';
import { Ticket } from '../entities/Ticket';

const TIPO_FISICA = 'FÍSICA';

export function getOfficeTicketsMatch(offices: Office[], tickets: Ticket[]): Record<string, Ticket[]> {
  const officesByCiudad = new Map<string, Office[]>();
  offices.forEach((o) => {
    const key = normalize(o.ciudad);
    if (!key) return;
    if (!officesByCiudad.has(key)) officesByCiudad.set(key, []);
    officesByCiudad.get(key)!.push(o);
  });

  const winnerByCiudad = new Map<string, Office>();
  officesByCiudad.forEach((group, key) => {
    winnerByCiudad.set(key, pickWinner(group));
  });

  const ticketsByCiudad = new Map<string, Ticket[]>();
  tickets.forEach((t) => {
    const key = normalize(t.plazaNombreArrendamientos);
    if (!key) return;
    if (!ticketsByCiudad.has(key)) ticketsByCiudad.set(key, []);
    ticketsByCiudad.get(key)!.push(t);
  });

  const result: Record<string, Ticket[]> = {};
  winnerByCiudad.forEach((winner, key) => {
    result[winner.codigo] = ticketsByCiudad.get(key) || [];
  });
  return result;
}

// Prioriza FÍSICA sobre VIRTUAL; entre empatadas, la de mayor renta.
function pickWinner(group: Office[]): Office {
  if (group.length === 1) return group[0];

  const fisicas = group.filter((o) => o.tipoOficina === TIPO_FISICA);
  const pool = fisicas.length ? fisicas : group;

  return pool.reduce((best, o) => (o.montoRenta > best.montoRenta ? o : best), pool[0]);
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .trim();
}
