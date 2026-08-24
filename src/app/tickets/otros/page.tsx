'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchJsonCached, invalidateCachedUrl } from '@/lib/fetchCache';
import { Badge, categoriaBadgeClass } from '@/components/TicketDialogs';
import type { TicketDetailRow } from '@/domain/usecases/GetTicketsDetail';

interface TicketsApiData {
  ticketsDetail: TicketDetailRow[];
  categoriaOptions: string[];
}

const CATEGORIA_OTRO = 'OTRO';

export default function TicketsOtrosPage() {
  const [tickets, setTickets] = useState<TicketDetailRow[]>([]);
  const [categoriaOptions, setCategoriaOptions] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, string | null | 'loading'>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchJsonCached<{ data: TicketsApiData }>('/api/tickets', 60_000);
        if (cancelled) return;
        const otro = result.data.ticketsDetail.filter((t) => t.categoria === CATEGORIA_OTRO && !t.categoriaCorregida);
        setTickets(otro);
        setCategoriaOptions(result.data.categoriaOptions);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function handleSuggest(folio: string) {
    setSuggestions((s) => ({ ...s, [folio]: 'loading' }));
    try {
      const response = await fetch('/api/tickets/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio })
      });
      const result = await response.json();
      setSuggestions((s) => ({ ...s, [folio]: result.suggestion || null }));
    } catch {
      setSuggestions((s) => ({ ...s, [folio]: null }));
    }
  }

  async function handleSave(folio: string, categoria: string) {
    if (!categoria) return;
    setSaving((s) => ({ ...s, [folio]: true }));
    setErrors((e) => ({ ...e, [folio]: '' }));
    try {
      const response = await fetch('/api/tickets/update-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folio, categoria })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo guardar la categoría.');
      invalidateCachedUrl('/api/tickets');
      setTickets((t) => t.filter((row) => row.folio !== folio));
    } catch (err) {
      setErrors((e) => ({ ...e, [folio]: err instanceof Error ? err.message : 'No se pudo guardar la categoría.' }));
    } finally {
      setSaving((s) => ({ ...s, [folio]: false }));
    }
  }

  return (
    <div className="p-6">
      <header className="h-16 -mx-6 -mt-6 mb-6 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
        <div>
          <Link href="/tickets" className="text-xs text-indigo-600 hover:underline">← Volver a Tickets</Link>
          <h1 className="text-lg font-bold">Corregir categoría OTRO</h1>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-400 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          Error: {error}
        </div>
      )}
      {loading && (
        <div className="mb-4 rounded-lg border border-indigo-400 bg-indigo-50 px-3.5 py-2.5 text-sm text-indigo-600">
          Cargando…
        </div>
      )}

      {!loading && tickets.length === 0 && !error && (
        <div className="bg-white rounded-[10px] shadow-sm p-8 text-center text-slate-400">
          No hay tickets con categoría OTRO pendientes de corrección.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {tickets.map((row) => {
          const suggestion = suggestions[row.folio];
          const isLoadingSuggestion = suggestion === 'loading';
          const suggestionValue = isLoadingSuggestion || suggestion === undefined ? null : suggestion;

          return (
            <div key={row.folio} className="bg-white rounded-[10px] shadow-sm p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold">Ticket {row.folio}</p>
                  <p className="text-xs text-slate-400">{row.empresa} · {row.plaza} · {row.fecha}</p>
                </div>
              </div>

              <p className="text-sm text-slate-700 mb-3">{row.solicitud}</p>

              {errors[row.folio] && <p className="text-xs text-rose-600 mb-2">{errors[row.folio]}</p>}

              <div className="flex items-center gap-2 flex-wrap">
                {suggestion === undefined && (
                  <button
                    onClick={() => handleSuggest(row.folio)}
                    className="rounded-md px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                  >
                    Sugerir con IA
                  </button>
                )}
                {isLoadingSuggestion && <span className="text-xs text-slate-400">Consultando IA…</span>}

                {suggestionValue && (
                  <>
                    <span className="text-xs text-slate-400">Sugerencia IA:</span>
                    <Badge text={suggestionValue} className={categoriaBadgeClass(suggestionValue)} />
                    <button
                      onClick={() => handleSave(row.folio, suggestionValue)}
                      disabled={saving[row.folio]}
                      className="rounded-md px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white disabled:opacity-50"
                    >
                      Aceptar sugerencia
                    </button>
                  </>
                )}
                {suggestion !== undefined && suggestionValue === null && !isLoadingSuggestion && (
                  <span className="text-xs text-slate-400">Sin sugerencia disponible.</span>
                )}

                <select
                  value={selected[row.folio] || ''}
                  onChange={(e) => setSelected((s) => ({ ...s, [row.folio]: e.target.value }))}
                  className="border border-slate-200 rounded-md px-2 py-1.5 text-sm ml-auto"
                >
                  <option value="">Elegir categoría manualmente…</option>
                  {categoriaOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleSave(row.folio, selected[row.folio] || '')}
                  disabled={!selected[row.folio] || saving[row.folio]}
                  className="rounded-md px-3 py-1.5 text-xs font-medium bg-slate-700 text-white disabled:opacity-50"
                >
                  {saving[row.folio] ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
