import { NextRequest, NextResponse } from 'next/server';
import { findAllTickets } from '@/data/TicketRepository';
import { findCategoriaCatalog } from '@/data/CategoriaRepository';
import { suggestCategoria } from '@/data/GeminiClient';
import { getDistinctCategorias } from '@/domain/usecases/GetDistinctCategorias';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const folio = String(body?.folio || '');

  const tickets = await findAllTickets();
  const ticket = tickets.find((t) => t.folio === folio);

  if (!ticket) {
    return NextResponse.json({ error: `No se encontró el ticket con folio "${folio}".` }, { status: 404 });
  }

  const categoriaCatalog = await findCategoriaCatalog();
  const categoriaOptions = getDistinctCategorias(tickets, categoriaCatalog);
  const suggestion = await suggestCategoria(ticket.solicitud, categoriaOptions);

  return NextResponse.json({ suggestion, categoriaOptions });
}
