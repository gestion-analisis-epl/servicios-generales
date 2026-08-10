import { getSheetRows } from './sheetsClient';
import { createTicket, Ticket } from '../domain/entities/Ticket';
import { parseSheetDate } from './parsers';

const TICKET_SHEET_NAME = 'Datos Tickets';
const TICKET_ASIGNADO_FILTRO = process.env.TICKET_ASIGNADO_FILTRO || '';

export async function findAllTickets(): Promise<Ticket[]> {
  const rows = await getSheetRows(TICKET_SHEET_NAME);
  return rows.map(mapRowToTicket).filter((t) => t.asignadoA === TICKET_ASIGNADO_FILTRO);
}

function mapRowToTicket(row: Record<string, unknown>): Ticket {
  return createTicket({
    folio: str(row['Folio']),
    empresa: str(row['Empresa']),
    departamento: str(row['Departamento']),
    tipo: str(row['Tipo']),
    categoria: str(row['Categoria']),
    estatus: str(row['Estatus']),
    solicita: str(row['Solicita']),
    solicitud: str(row['Solicitud']),
    asignadoA: str(row['Asignado A']),
    plaza: str(row['Plaza']),
    plazaNombreArrendamientos: str(row['Plaza Nombre Arrendamientos']),
    fechaYHora: parseSheetDate(row['Fecha y Hora']),
    ultimoCambio: parseSheetDate(row['Ultimo Cambio']),
    duracion: str(row['Duración']),
    tiempoEfectivoSegundos: str(row['Helper_Tiempo'])
  });
}

function str(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
