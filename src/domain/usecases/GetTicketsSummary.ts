import { Ticket } from '../entities/Ticket';
import { formatDuration } from './FormatDuration';

export interface TicketsSummary {
  totalTickets: number;
  totalEnSeguimiento: number;
  totalFinalizados: number;
  tiempoPromedioFinalizar: string;
  tiempoPromedioReconocer: string;
}

export function getTicketsSummary(tickets: Ticket[]): TicketsSummary {
  const enSeguimiento = tickets.filter((t) => t.estatus === 'EN SEGUIMIENTO');
  const finalizados = tickets.filter((t) => t.estatus === 'FINALIZADO');

  return {
    totalTickets: tickets.length,
    totalEnSeguimiento: enSeguimiento.length,
    totalFinalizados: finalizados.length,
    tiempoPromedioFinalizar: formatDuration(averageSeconds(finalizados)),
    tiempoPromedioReconocer: formatDuration(averageSeconds(enSeguimiento))
  };
}

function averageSeconds(tickets: Ticket[]): number {
  const valid = tickets.filter((t) => Number(t.tiempoEfectivoSegundos) > 0);
  if (!valid.length) return 0;

  const total = valid.reduce((sum, t) => sum + Number(t.tiempoEfectivoSegundos), 0);
  return total / valid.length;
}
