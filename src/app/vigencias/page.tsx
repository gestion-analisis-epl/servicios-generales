'use client';

import { useEffect, useMemo, useState } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { fetchJsonCached } from '@/lib/fetchCache';
import type { VigenciasSummary } from '@/domain/usecases/GetVigenciasSummary';
import type { VigenciaGanttRow } from '@/domain/usecases/GetVigenciasGantt';

interface FilterOptions {
  ciudades: string[];
  oficinas: string[];
  estados: string[];
}

interface Filters {
  ciudades?: string[];
  oficinas?: string[];
  estados?: string[];
}

const EMPTY_FILTERS: Filters = { ciudades: undefined, oficinas: undefined, estados: undefined };

export default function VigenciasPage() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ ciudades: [], oficinas: [], estados: [] });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [summary, setSummary] = useState<VigenciasSummary | null>(null);
  const [gantt, setGantt] = useState<VigenciaGanttRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.ciudades !== undefined) params.set('ciudades', filters.ciudades.join(','));
      if (filters.oficinas !== undefined) params.set('oficinas', filters.oficinas.join(','));
      if (filters.estados !== undefined) params.set('estados', filters.estados.join(','));

      try {
        const result = await fetchJsonCached<{
          filterOptions: FilterOptions;
          data: { vigenciasSummary: VigenciasSummary; vigenciasGantt: VigenciaGanttRow[] };
        }>(`/api/vigencias?${params.toString()}`, 60_000);
        if (cancelled) return;
        setFilterOptions(result.filterOptions);
        setSummary(result.data.vigenciasSummary);
        setGantt(result.data.vigenciasGantt);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filters]);

  return (
    <div className="p-6">
      <header className="h-16 -mx-6 -mt-6 mb-6 flex items-center px-6 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-bold">Vigencias</h1>
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

      <div className="flex items-end gap-4 flex-wrap bg-white rounded-lg shadow-sm px-4.5 py-3.5 mb-5">
        <MultiSelectFilter label="Ciudad" options={filterOptions.ciudades} value={filters.ciudades ?? filterOptions.ciudades} onChange={(v) => setFilters((f) => ({ ...f, ciudades: v }))} />
        <MultiSelectFilter label="Oficina" options={filterOptions.oficinas} value={filters.oficinas ?? filterOptions.oficinas} onChange={(v) => setFilters((f) => ({ ...f, oficinas: v }))} />
        <MultiSelectFilter label="Status de Vigencia" options={filterOptions.estados} value={filters.estados ?? filterOptions.estados} onChange={(v) => setFilters((f) => ({ ...f, estados: v }))} />
        <button onClick={() => setFilters(EMPTY_FILTERS)} className="rounded-md px-4 py-1.5 text-sm bg-white border border-slate-200">Limpiar</button>
      </div>

      {summary && (
        <div className="flex gap-4 flex-wrap mb-6">
          <Card accent="success" icon={<IconCheck />} label="Vigentes" value={summary.vigentes} />
          <Card accent="warning" icon={<IconClock />} label="Próximos" value={summary.proximos} />
          <Card accent="danger" icon={<IconAlertClock />} label="Urgentes" value={summary.criticos} />
          <Card accent="neutral" icon={<IconWarning />} label="Indeterminado" value={summary.indeterminados} />
        </div>
      )}

      <VigenciasGantt rows={gantt} />
    </div>
  );
}

const ACCENT_CLASSES: Record<string, string> = {
  primary: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-orange-500'
};

function Card({ accent, icon, label, value }: { accent: keyof typeof ACCENT_CLASSES; icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-[10px] shadow-sm px-5 py-4.5 flex-1 min-w-[180px]">
      <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-white ${ACCENT_CLASSES[accent]}`}>{icon}</div>
      <h3 className="text-xs uppercase text-slate-400 tracking-wide mb-1.5">{label}</h3>
      <p className="text-[22px] font-bold">{value}</p>
    </div>
  );
}

function icon(path: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      {path}
    </svg>
  );
}

const IconCheck = () => icon(<path d="M20 6 9 17l-5-5" />);
const IconClock = () => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>);
const IconWarning = () => icon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></>);
const IconAlertClock = () => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" /></>);

const GANTT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTH_WIDTH_PX = 90;
const LABEL_WIDTH_PX = 160;

const BAR_COLOR_CLASSES: Record<string, string> = {
  '⛔ VENCIDO': 'bg-rose-500',
  '🔴 URGENTE': 'bg-rose-400',
  '🟡 PRÓXIMO': 'bg-amber-500',
  '🟢 A TIEMPO': 'bg-emerald-500',
  '🟠 INDETERMINADO': 'bg-slate-400'
};

function VigenciasGantt({ rows }: { rows: VigenciaGanttRow[] }) {
  const today = useMemo(() => new Date(), []);

  const { timelineStart, timelineEnd, months, todayPct } = useMemo(() => {
    const JUNE = 5;
    const baseYear = today.getMonth() >= JUNE ? today.getFullYear() : today.getFullYear() - 1;
    const start = new Date(baseYear, JUNE, 1).getTime();
    const defaultEnd = new Date(baseYear + 1, 11, 31).getTime();

    const ends = rows.map((r) => new Date(r.finVigencia).getTime()).filter((t) => !isNaN(t));
    const end = Math.max(...ends, defaultEnd, today.getTime());
    const span = end - start || 1;

    const monthList: { label: string; pct: number }[] = [];
    const cursor = new Date(start);
    cursor.setDate(1);
    cursor.setHours(0, 0, 0, 0);
    while (cursor.getTime() <= end) {
      monthList.push({ label: `${GANTT_MONTHS[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(-2)}`, pct: ((cursor.getTime() - start) / span) * 100 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    return { timelineStart: start, timelineEnd: end, months: monthList, todayPct: ((today.getTime() - start) / span) * 100 };
  }, [rows, today]);

  const totalSpan = timelineEnd - timelineStart || 1;
  const timelineWidth = Math.max(months.length * MONTH_WIDTH_PX, 480);

  return (
    <div className="bg-white rounded-[10px] shadow-sm p-5">
      <h2 className="text-sm font-semibold mb-4">Vigencias de Arrendamientos</h2>

      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin arrendamientos para mostrar.</p>
      ) : (
        <div className="overflow-auto max-h-[540px]">
          <div className="relative" style={{ width: LABEL_WIDTH_PX + timelineWidth }}>
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{ left: LABEL_WIDTH_PX, width: timelineWidth }}>
              {months.map((m, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-slate-100" style={{ left: `${m.pct}%` }} />
              ))}
            </div>

            <div className="sticky top-0 z-20 bg-white grid items-end gap-3 pb-2.5 border-b border-slate-200 mb-1" style={{ gridTemplateColumns: `${LABEL_WIDTH_PX}px 1fr` }}>
              <div className="sticky left-0 bg-white" />
              <div className="relative h-4" style={{ minWidth: timelineWidth }}>
                {months.map((m, i) => (
                  <span key={i} className="absolute top-0 text-[11px] text-slate-400 whitespace-nowrap" style={{ left: `${m.pct}%` }}>{m.label}</span>
                ))}
              </div>
            </div>

            {rows.map((r, i) => {
              const endTime = new Date(r.finVigencia).getTime();
              const startTime = Math.max(new Date(r.inicioVigencia).getTime(), timelineStart);
              const leftPct = Math.max(0, ((startTime - timelineStart) / totalSpan) * 100);
              const widthPct = Math.max(0.5, ((endTime - startTime) / totalSpan) * 100);
              const diasRestantes = Math.ceil((endTime - today.getTime()) / 86_400_000);
              const barColor = BAR_COLOR_CLASSES[r.estado] || 'bg-slate-400';

              return (
                <div
                  key={`${r.codigo}-${i}`}
                  className={`grid items-center gap-3 py-1 ${i % 2 === 1 ? 'bg-slate-50/70' : ''}`}
                  style={{ gridTemplateColumns: `${LABEL_WIDTH_PX}px 1fr` }}
                >
                  <div className={`sticky left-0 z-10 text-[12px] font-semibold truncate pr-2 ${i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}`}>{r.codigo}</div>
                  <div
                    className="relative h-5"
                    style={{ minWidth: timelineWidth }}
                    title={`${formatShortDate(startTime)} → ${formatShortDate(endTime)} | ${diasRestantes} día(s) para el fin de vigencia`}
                  >
                    <div className={`absolute top-0 h-full rounded-[3px] flex items-center px-2 overflow-hidden shadow-sm ${barColor}`} style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
                      <span className="text-[10px] text-white font-semibold whitespace-nowrap">{formatShortDate(endTime)}</span>
                    </div>
                    {todayPct >= 0 && todayPct <= 100 && (
                      <div className="absolute -top-1 -bottom-1 w-0.5 bg-slate-800/50" style={{ left: `${todayPct}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
}
