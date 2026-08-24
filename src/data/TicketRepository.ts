import { getSheetRows, invalidateSheetCache, updateSheetCell } from './sheetsClient';
import { createTicket, Ticket } from '../domain/entities/Ticket';
import { parseSheetDate } from './parsers';

const TICKET_SHEET_NAME = 'Datos Tickets';
const CATEGORIA_CORREGIDA_HEADER = 'Categoría Corregida';
const CATEGORIA_OTRO = 'OTRO';
const TICKET_ASIGNADO_FILTRO = process.env.TICKET_ASIGNADO_FILTRO || '';

export async function findAllTickets(): Promise<Ticket[]> {
  const rows = await getSheetRows(TICKET_SHEET_NAME);
  return rows.map(mapRowToTicket).filter((t) => t.asignadoA === TICKET_ASIGNADO_FILTRO);
}

export async function updateTicketCategoriaCorregida(folio: string, nuevaCategoria: string): Promise<void> {
  if (!nuevaCategoria || nuevaCategoria === CATEGORIA_OTRO) {
    throw new Error('La nueva categoría no puede estar vacía ni ser "OTRO".');
  }

  invalidateSheetCache(TICKET_SHEET_NAME);
  const rows = await getSheetRows(TICKET_SHEET_NAME);
  const row = rows.find((r) => str(r['Folio']) === folio);

  if (!row) throw new Error(`No se encontró el ticket con folio "${folio}".`);
  if (str(row['Categoria']) !== CATEGORIA_OTRO) {
    throw new Error('Solo los tickets con categoría "OTRO" pueden corregirse.');
  }

  await updateSheetCell(TICKET_SHEET_NAME, row.__row as number, CATEGORIA_CORREGIDA_HEADER, nuevaCategoria);
}

function mapRowToTicket(row: Record<string, unknown>): Ticket {
  return createTicket({
    folio: str(row['Folio']),
    empresa: str(row['Empresa']),
    departamento: str(row['Departamento']),
    tipo: str(row['Tipo']),
    categoria: str(row['Categoria']),
    categoriaCorregida: str(row[CATEGORIA_CORREGIDA_HEADER]),
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
