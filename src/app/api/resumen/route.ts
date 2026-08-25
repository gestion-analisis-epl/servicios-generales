import { NextRequest, NextResponse } from 'next/server';
import { findAllOffices } from '@/data/OfficeRepository';
import { filterOffices } from '@/domain/usecases/FilterOffices';
import { getOfficesSummary } from '@/domain/usecases/GetOfficesSummary';
import { getMonthlyTotalByCompany } from '@/domain/usecases/GetMonthlyTotalByCompany';
import { getUpcomingPaymentTotals } from '@/domain/usecases/GetUpcomingPaymentTotals';
import { getOfficesTableRows } from '@/domain/usecases/GetOfficesTableRows';
import { getUpcomingExpirationsGantt } from '@/domain/usecases/GetUpcomingExpirationsGantt';

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
      summary: getOfficesSummary(offices),
      monthlyTotalByCompany: getMonthlyTotalByCompany(offices),
      upcomingPaymentTotals: getUpcomingPaymentTotals(offices),
      officesTableRows: getOfficesTableRows(offices),
      upcomingExpirationsGantt: getUpcomingExpirationsGantt(offices)
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
