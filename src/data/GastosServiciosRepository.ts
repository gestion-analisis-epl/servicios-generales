import { getSheetRows } from './sheetsClient';
import { parseMoney, parseSheetDate } from './parsers';
import type { GastoServicio } from '../domain/entities/GastoServicio';

const SOL_RECURSOS_SHEET_NAME = 'SolRecursos';

export async function findAllGastosServicios(): Promise<GastoServicio[]> {
  const rows = await getSheetRows(SOL_RECURSOS_SHEET_NAME);

  return rows
    .map((row) => ({
      folio: text(pick(row, 'FOLIO')),
      fecha: parseSheetDate(pick(row, 'FECHA INICIAL')),
      estatus: text(pick(row, 'ESTATUS')),
      codigo: text(pick(row, 'CODIGO')),
      ciudad: text(pick(row, 'CIUDAD')),
      categoria: normalizeCategoria(text(pick(row, 'CATEGORIA'))),
      monto: parseMoney(pick(row, 'IMPORTE DEPOSITADO')),
      montoSolicitado: parseMoney(pick(row, 'IMPORTE SOLICITADO'))
    }))
    .filter((g) => g.categoria !== '' || g.codigo !== '' || g.monto !== 0 || g.montoSolicitado !== 0);
}

export function normalizeCategoria(raw: string): string {
  const n = normalize(raw);
  if (!n) return 'Sin categoría';
  if (n.includes('LIMPIEZA')) return 'Limpieza';
  if (n.includes('GARRAFON')) return 'Garrafones';
  if (n.includes('CFE')) return 'CFE';
  if (n.includes('AGUA')) return 'Agua';
  return raw.trim();
}

function pick(row: Record<string, unknown>, normalizedHeader: string): unknown {
  const key = Object.keys(row).find((header) => normalize(header) === normalizedHeader);
  return key ? row[key] : undefined;
}

function text(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
}
