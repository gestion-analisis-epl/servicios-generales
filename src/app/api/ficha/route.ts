import { NextResponse } from 'next/server';
import { findAllOffices } from '@/data/OfficeRepository';
import { findAllTickets } from '@/data/TicketRepository';
import { getOfficesForFicha } from '@/domain/usecases/GetOfficesForFicha';
import { getOfficeTicketsMatch } from '@/domain/usecases/GetOfficeTicketsMatch';
import { getTicketsDetail } from '@/domain/usecases/GetTicketsDetail';
import { getTicketsByCategoria } from '@/domain/usecases/GetTicketsByCategoria';

export async function GET() {
  const offices = await findAllOffices();
  const tickets = await findAllTickets();

  const ticketMatch = getOfficeTicketsMatch(offices, tickets);
  const ticketsByOffice: Record<string, ReturnType<typeof getTicketsDetail>> = {};
  const ticketCategoriaTotalsByOffice: Record<string, ReturnType<typeof getTicketsByCategoria>> = {};

  Object.entries(ticketMatch).forEach(([codigo, matchedTickets]) => {
    const detail = getTicketsDetail(matchedTickets);
    ticketsByOffice[codigo] = detail;
    ticketCategoriaTotalsByOffice[codigo] = getTicketsByCategoria(detail);
  });

  return NextResponse.json({
    data: {
      offices: getOfficesForFicha(offices),
      ticketsByOffice,
      ticketCategoriaTotalsByOffice
    }
  });
}
