import { NextRequest, NextResponse } from 'next/server';
import { findAllOffices } from '@/data/OfficeRepository';
import { filterOffices } from '@/domain/usecases/FilterOffices';
import { getVigenciasSummary } from '@/domain/usecases/GetVigenciasSummary';
import { getVigenciasGantt } from '@/domain/usecases/GetVigenciasGantt';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = {
    ciudades: parseList(params, 'ciudades'),
    oficinas: parseList(params, 'oficinas'),
    estados: parseList(params, 'estados')
  };

  const allOffices = await findAllOffices();
  const offices = filterOffices(allOffices, filters);

  return NextResponse.json({
    filterOptions: {
      ciudades: uniqueSorted(allOffices.map((o) => o.ciudad)),
      oficinas: uniqueSorted(allOffices.map((o) => o.codigo)),
      estados: ['⛔ VENCIDO', '🔴 URGENTE', '🟡 PRÓXIMO', '🟢 A TIEMPO', '🟠 INDETERMINADO']
    },
    data: {
      vigenciasSummary: getVigenciasSummary(offices),
      vigenciasGantt: getVigenciasGantt(offices)
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
