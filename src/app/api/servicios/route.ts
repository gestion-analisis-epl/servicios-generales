import { NextRequest, NextResponse } from 'next/server';
import { findAllOffices } from '@/data/OfficeRepository';
import { findAllGastosServicios } from '@/data/GastosServiciosRepository';
import {
  buildGastosRows,
  filterGastosRows,
  getGastosCategorias,
  getGastosTotalsByCategoria
} from '@/domain/usecases/GetGastosServicios';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = {
    ciudades: parseList(params, 'ciudades'),
    categorias: parseList(params, 'categorias'),
    estatuses: parseList(params, 'estatuses')
  };

  const [offices, gastos] = await Promise.all([findAllOffices(), findAllGastosServicios()]);
  const allRows = buildGastosRows(gastos, offices);
  const rows = filterGastosRows(allRows, filters);
  const categorias = getGastosCategorias(allRows);

  return NextResponse.json({
    filterOptions: {
      ciudades: uniqueSorted(allRows.map((r) => r.ciudad)),
      categorias,
      estatuses: uniqueSorted(allRows.map((r) => r.estatus))
    },
    data: {
      rows,
      totalsByCategoria: getGastosTotalsByCategoria(rows, categorias)
    }
  });
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function parseList(params: URLSearchParams, key: string): string[] | undefined {
  if (!params.has(key)) return undefined;
  return (params.get(key) || '').split(',').filter(Boolean);
}
