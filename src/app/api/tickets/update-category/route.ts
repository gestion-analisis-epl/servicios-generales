import { NextRequest, NextResponse } from 'next/server';
import { updateTicketCategoriaCorregida } from '@/data/TicketRepository';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const folio = String(body?.folio || '');
  const categoria = String(body?.categoria || '');

  try {
    await updateTicketCategoriaCorregida(folio, categoria);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'No se pudo guardar la categoría.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
