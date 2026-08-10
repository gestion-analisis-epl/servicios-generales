import { NextRequest, NextResponse } from 'next/server';
import { findAllOffices } from '@/data/OfficeRepository';
import { filterOffices } from '@/domain/usecases/FilterOffices';
import { getPagosSummary } from '@/domain/usecases/GetPagosSummary';
import { getPagosDetail } from '@/domain/usecases/GetPagosDetail';
import { getPagosPorFechaLimite } from '@/domain/usecases/GetPagosPorFechaLimite';
import { getOficinasVigentesPorFecha } from '@/domain/usecases/GetOficinasVigentesPorFecha';

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
      estados: ['⛔ VENCIDO', '🔴 CRÍTICO', '🟡 PRÓXIMO', '🟢 A TIEMPO', '🟠 INDETERMINADO']
    },
    data: {
      pagosSummary: getPagosSummary(offices),
      pagosDetail: getPagosDetail(offices),
      pagosPorFecha: getPagosPorFechaLimite(offices),
      oficinasPorFecha: getOficinasVigentesPorFecha(offices)
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
