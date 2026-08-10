import { NextRequest, NextResponse } from 'next/server';
import { findAllTickets } from '@/data/TicketRepository';
import { filterTickets } from '@/domain/usecases/FilterTickets';
import { getTicketsSummary } from '@/domain/usecases/GetTicketsSummary';
import { getTicketsDetail } from '@/domain/usecases/GetTicketsDetail';
import { getTicketsByCategoria } from '@/domain/usecases/GetTicketsByCategoria';
import { getTicketsByEstatus } from '@/domain/usecases/GetTicketsByEstatus';
import { getTicketsByPlaza } from '@/domain/usecases/GetTicketsByPlaza';
import { getTiempoPromedioPorCategoria } from '@/domain/usecases/GetTiempoPromedioPorCategoria';
import { getTicketsPorMes } from '@/domain/usecases/GetTicketsPorMes';
import { getTicketYears } from '@/domain/usecases/GetTicketYears';

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const filters = {
    fechaInicio: params.get('fechaInicio') || undefined,
    fechaFin: params.get('fechaFin') || undefined,
    meses: parseNumberList(params, 'meses'),
    trimestres: parseNumberList(params, 'trimestres'),
    anios: parseNumberList(params, 'anios')
  };

  const allTickets = await findAllTickets();
  const tickets = filterTickets(allTickets, filters);

  return NextResponse.json({
    filterOptions: {
      anios: getTicketYears(allTickets)
    },
    data: {
      ticketsSummary: getTicketsSummary(tickets),
      ticketsDetail: getTicketsDetail(tickets),
      ticketsByCategoria: getTicketsByCategoria(tickets),
      ticketsByEstatus: getTicketsByEstatus(tickets),
      ticketsByPlaza: getTicketsByPlaza(tickets),
      tiempoPromedioPorCategoria: getTiempoPromedioPorCategoria(tickets),
      ticketsPorMes: getTicketsPorMes(tickets)
    }
  });
}

function parseNumberList(params: URLSearchParams, key: string): number[] | undefined {
  if (!params.has(key)) return undefined;
  return (params.get(key) || '').split(',').map(Number).filter((n) => !isNaN(n));
}
