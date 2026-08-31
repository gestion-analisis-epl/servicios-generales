import { NextRequest, NextResponse } from 'next/server';
import { findAllTickets } from '@/data/TicketRepository';
import { findCategoriaCatalog } from '@/data/CategoriaRepository';
import { filterTickets } from '@/domain/usecases/FilterTickets';
import { getTicketsSummary } from '@/domain/usecases/GetTicketsSummary';
import { getTicketsDetail } from '@/domain/usecases/GetTicketsDetail';
import { getTicketsByCategoria } from '@/domain/usecases/GetTicketsByCategoria';
import { getTicketsByEstatus } from '@/domain/usecases/GetTicketsByEstatus';
import { getTicketsByPlaza } from '@/domain/usecases/GetTicketsByPlaza';
import { getTiempoPromedioPorCategoria } from '@/domain/usecases/GetTiempoPromedioPorCategoria';
import { getTicketsPorMes } from '@/domain/usecases/GetTicketsPorMes';
import { getTicketYears } from '@/domain/usecases/GetTicketYears';
import { getEffectiveCategoria } from '@/domain/usecases/GetEffectiveCategoria';
import { getDistinctCategorias } from '@/domain/usecases/GetDistinctCategorias';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = {
    fechaInicio: params.get('fechaInicio') || undefined,
    fechaFin: params.get('fechaFin') || undefined,
    meses: parseNumberList(params, 'meses'),
    trimestres: parseNumberList(params, 'trimestres'),
    anios: parseNumberList(params, 'anios')
  };

  const [allTickets, categoriaCatalog] = await Promise.all([findAllTickets(), findCategoriaCatalog()]);
  const tickets = filterTickets(allTickets, filters);
  const ticketsConCategoriaEfectiva = tickets.map((t) => ({ ...t, categoria: getEffectiveCategoria(t.categoria, t.categoriaCorregida) }));

  return NextResponse.json({
    filterOptions: {
      anios: getTicketYears(allTickets)
    },
    data: {
      ticketsSummary: getTicketsSummary(tickets),
      ticketsDetail: getTicketsDetail(tickets),
      ticketsByCategoria: getTicketsByCategoria(ticketsConCategoriaEfectiva),
      ticketsByEstatus: getTicketsByEstatus(tickets),
      ticketsByPlaza: getTicketsByPlaza(tickets),
      tiempoPromedioPorCategoria: getTiempoPromedioPorCategoria(ticketsConCategoriaEfectiva),
      ticketsPorMes: getTicketsPorMes(tickets),
      categoriaOptions: getDistinctCategorias(allTickets, categoriaCatalog)
    }
  });
}

function parseNumberList(params: URLSearchParams, key: string): number[] | undefined {
  if (!params.has(key)) return undefined;
  return (params.get(key) || '').split(',').map(Number).filter((n) => !isNaN(n));
}
