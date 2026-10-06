import { GASTO_CATEGORIAS, GastoServicio } from '../entities/GastoServicio';
import { Office } from '../entities/Office';

export interface GastosFilters {
  ciudades?: string[];
  categorias?: string[];
  estatuses?: string[];
  desde?: string;
  hasta?: string;
}

export interface GastoServicioRow extends GastoServicio {
  empresa: string;
  // Fila derivada de un pago de Querétaro repartido entre Garrafones y Limpieza.
  dividido: boolean;
}

export interface GastoCategoriaTotal {
  categoria: string;
  total: number;
  pagos: number;
}

export const FICHA_ESTATUSES = ['DEPOSITADO', 'FINALIZADA'];

const CATEGORIA_EXCLUIDA = 'OTROS';
const QUERETARO = 'QUERETARO';
const QUERETARO_GARRAFONES_DEFAULT = 528;
const QUERETARO_GARRAFONES_BY_FOLIO: Record<string, number> = {
  REC01000001658: 660,
  REC01000001496: 520,
  REC01000001527: 520
};

export function buildGastosRows(gastos: GastoServicio[], offices: Office[]): GastoServicioRow[] {
  const officeByCodigo = new Map(offices.map((o) => [o.codigo.trim(), o]));

  const rows = gastos
    .filter((g) => normalize(g.categoria) !== CATEGORIA_EXCLUIDA)
    .map((g) => {
      const office = g.codigo ? officeByCodigo.get(g.codigo) : undefined;
      return {
        ...g,
        empresa: office?.empresa ?? '',
        ciudad: g.ciudad || office?.ciudad || '',
        dividido: false
      };
    });

  return rows
    .flatMap(splitQueretaroGarrafones)
    .sort((a, b) => a.categoria.localeCompare(b.categoria) || a.ciudad.localeCompare(b.ciudad) || a.folio.localeCompare(b.folio));
}

export function filterGastosRows(rows: GastoServicioRow[], filters: GastosFilters = {}): GastoServicioRow[] {
  const estatuses = filters.estatuses?.map(normalize);
  return rows.filter((row) => {
    if (filters.ciudades !== undefined && !filters.ciudades.includes(row.ciudad)) return false;
    if (filters.categorias !== undefined && !filters.categorias.includes(row.categoria)) return false;
    if (estatuses !== undefined && !estatuses.includes(normalize(row.estatus))) return false;
    if (filters.desde || filters.hasta) {
      const dia = row.fecha.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
      if (!dia) return false;
      if (filters.desde && dia < filters.desde) return false;
      if (filters.hasta && dia > filters.hasta) return false;
    }
    return true;
  });
}

export function getGastosCategorias(rows: GastoServicioRow[]): string[] {
  const known = [...GASTO_CATEGORIAS] as string[];
  const extra = Array.from(new Set(rows.map((r) => r.categoria))).filter((c) => !known.includes(c)).sort();
  return [...known, ...extra];
}

export function getGastosTotalsByCategoria(rows: GastoServicioRow[], categorias: string[]): GastoCategoriaTotal[] {
  return categorias.map((categoria) => {
    const own = rows.filter((r) => r.categoria === categoria);
    return {
      categoria,
      total: own.reduce((sum, r) => sum + r.monto, 0),
      pagos: own.length
    };
  });
}

export function getGastosTotalsByOffice(rows: GastoServicioRow[]): Record<string, GastoCategoriaTotal[]> {
  const byCodigo = new Map<string, GastoServicioRow[]>();
  for (const row of rows) {
    const codigo = row.codigo.trim();
    if (!codigo) continue;
    byCodigo.set(codigo, [...(byCodigo.get(codigo) ?? []), row]);
  }

  const result: Record<string, GastoCategoriaTotal[]> = {};
  byCodigo.forEach((own, codigo) => {
    result[codigo] = getGastosTotalsByCategoria(own, getGastosCategorias(own)).filter((t) => t.pagos > 0);
  });
  return result;
}

// En Querétaro los garrafones se depositan junto con la limpieza: se separa su monto y el resto es limpieza.
function splitQueretaroGarrafones(row: GastoServicioRow): GastoServicioRow[] {
  if (row.categoria !== 'Garrafones' || normalize(row.ciudad) !== QUERETARO) return [row];

  const garrafonesFijo = QUERETARO_GARRAFONES_BY_FOLIO[row.folio.trim().toUpperCase()] ?? QUERETARO_GARRAFONES_DEFAULT;
  const garrafones = Math.min(garrafonesFijo, row.monto);
  const garrafonesSolicitado = Math.min(garrafonesFijo, row.montoSolicitado);
  if (garrafones <= 0 && garrafonesSolicitado <= 0) return [row];

  const limpieza = row.monto - garrafones;
  const limpiezaSolicitado = row.montoSolicitado - garrafonesSolicitado;
  const result: GastoServicioRow[] = [{ ...row, monto: garrafones, montoSolicitado: garrafonesSolicitado, dividido: true }];
  if (limpieza > 0 || limpiezaSolicitado > 0) {
    result.push({ ...row, categoria: 'Limpieza', monto: limpieza, montoSolicitado: limpiezaSolicitado, dividido: true });
  }
  return result;
}

function normalize(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
}
