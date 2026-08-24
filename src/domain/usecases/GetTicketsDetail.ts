import { Ticket } from '../entities/Ticket';
import { formatTableDate } from './GetOfficesTableRows';
import { formatDuration } from './FormatDuration';
import { getEffectiveCategoria } from './GetEffectiveCategoria';

export interface TicketDetailRow {
  folio: string;
  departamento: string;
  empresa: string;
  categoria: string;
  categoriaCorregida: string;
  categoriaEfectiva: string;
  tipo: string;
  estatus: string;
  solicita: string;
  solicitud: string;
  plaza: string;
  fecha: string;
  ultimoCambio: string;
  duracion: string;
}

export function getTicketsDetail(tickets: Ticket[], estatusFiltro?: string | null): TicketDetailRow[] {
  const filtered = estatusFiltro ? tickets.filter((t) => t.estatus === estatusFiltro) : tickets;

  return filtered.map((t) => ({
    folio: t.folio,
    departamento: t.departamento,
    empresa: t.empresa,
    categoria: t.categoria,
    categoriaCorregida: t.categoriaCorregida,
    categoriaEfectiva: getEffectiveCategoria(t.categoria, t.categoriaCorregida),
    tipo: t.tipo,
    estatus: t.estatus,
    solicita: t.solicita,
    solicitud: t.solicitud,
    plaza: t.plaza,
    fecha: formatTableDate(t.fechaYHora),
    ultimoCambio: formatTableDate(t.ultimoCambio),
    duracion: formatDuration(Number(t.tiempoEfectivoSegundos))
  }));
}
