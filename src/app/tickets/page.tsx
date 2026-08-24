'use client';

import { useEffect, useState } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { TicketsDialog, TicketDetailDialog } from '@/components/TicketDialogs';
import Link from 'next/link';
import { fetchJsonCached } from '@/lib/fetchCache';
import type { TicketsSummary } from '@/domain/usecases/GetTicketsSummary';
import type { TicketDetailRow } from '@/domain/usecases/GetTicketsDetail';
import type { CategoriaTotal } from '@/domain/usecases/GetTicketsByCategoria';
import type { EstatusTotal } from '@/domain/usecases/GetTicketsByEstatus';
import type { PlazaTotal } from '@/domain/usecases/GetTicketsByPlaza';
import type { TiempoPromedioCategoria } from '@/domain/usecases/GetTiempoPromedioPorCategoria';
import type { MesTotal } from '@/domain/usecases/GetTicketsPorMes';

interface TicketsData {
  ticketsSummary: TicketsSummary;
  ticketsDetail: TicketDetailRow[];
  ticketsByCategoria: CategoriaTotal[];
  ticketsByEstatus: EstatusTotal[];
  ticketsByPlaza: PlazaTotal[];
  tiempoPromedioPorCategoria: TiempoPromedioCategoria[];
  ticketsPorMes: MesTotal[];
  categoriaOptions: string[];
}

interface FilterOptions {
  anios: number[];
}

interface Filters {
  fechaInicio: string;
  fechaFin: string;
  meses?: string[];
  trimestres?: string[];
  anios?: string[];
}

const EMPTY_FILTERS: Filters = { fechaInicio: '', fechaFin: '', meses: undefined, trimestres: undefined, anios: undefined };

const MES_OPTIONS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const TRIMESTRE_OPTIONS = ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4'];

export default function TicketsPage() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ anios: [] });
  const [data, setData] = useState<TicketsData | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketsDialog, setTicketsDialog] = useState<{ title: string; estatus: string | null } | null>(null);
  const [ticketDetailRow, setTicketDetailRow] = useState<TicketDetailRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.fechaInicio) params.set('fechaInicio', filters.fechaInicio);
      if (filters.fechaFin) params.set('fechaFin', filters.fechaFin);
      if (filters.meses !== undefined) params.set('meses', filters.meses.map((m) => MES_OPTIONS.indexOf(m) + 1).join(','));
      if (filters.trimestres !== undefined) params.set('trimestres', filters.trimestres.map((t) => TRIMESTRE_OPTIONS.indexOf(t) + 1).join(','));
      if (filters.anios !== undefined) params.set('anios', filters.anios.join(','));

      try {
        const result = await fetchJsonCached<{ filterOptions: FilterOptions; data: TicketsData }>(`/api/tickets?${params.toString()}`, 60_000);
        if (cancelled) return;
        setFilterOptions(result.filterOptions);
        setData(result.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filters]);

  const totalOtro = data?.ticketsDetail.filter((t) => t.categoria === 'OTRO' && !t.categoriaCorregida).length || 0;

  return (
    <div className="p-6">
      <header className="h-16 -mx-6 -mt-6 mb-6 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-bold">Tickets</h1>
        <Link
          href="/tickets/otros"
          className="rounded-md px-3.5 py-1.5 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Corregir categoría OTRO {totalOtro > 0 ? `(${totalOtro})` : ''}
        </Link>
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
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase text-slate-400 tracking-wide">Período Tickets (Fecha y Hora)</label>
          <div className="flex items-center gap-1.5">
            <input type="date" value={filters.fechaInicio} onChange={(e) => setFilters((f) => ({ ...f, fechaInicio: e.target.value }))} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" />
            <span className="text-xs text-slate-400">a</span>
            <input type="date" value={filters.fechaFin} onChange={(e) => setFilters((f) => ({ ...f, fechaFin: e.target.value }))} className="border border-slate-200 rounded-md px-2 py-1.5 text-sm" />
          </div>
        </div>
        <MultiSelectFilter label="Mes" options={MES_OPTIONS} value={filters.meses ?? MES_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, meses: v }))} />
        <MultiSelectFilter label="Trimestre" options={TRIMESTRE_OPTIONS} value={filters.trimestres ?? TRIMESTRE_OPTIONS} onChange={(v) => setFilters((f) => ({ ...f, trimestres: v }))} />
        <MultiSelectFilter label="Año" options={filterOptions.anios.map(String)} value={filters.anios ?? filterOptions.anios.map(String)} onChange={(v) => setFilters((f) => ({ ...f, anios: v }))} />
        <button onClick={() => setFilters(EMPTY_FILTERS)} className="rounded-md px-4 py-1.5 text-sm bg-white border border-slate-200">Limpiar filtros</button>
      </div>

      {data && (
        <>
          <CardsRow>
            <Card accent="primary" icon={<IconTicket />} label="Tickets Totales" value={data.ticketsSummary.totalTickets} onClick={() => setTicketsDialog({ title: 'Tickets Totales', estatus: null })} />
            <Card accent="warning" icon={<IconClock />} label="En Seguimiento" value={data.ticketsSummary.totalEnSeguimiento} onClick={() => setTicketsDialog({ title: 'Tickets en Seguimiento', estatus: 'EN SEGUIMIENTO' })} />
            <Card accent="success" icon={<IconCheck />} label="Finalizados" value={data.ticketsSummary.totalFinalizados} onClick={() => setTicketsDialog({ title: 'Tickets Finalizados', estatus: 'FINALIZADO' })} />
            <Card accent="primary" icon={<IconCalendar />} label="Tiempo Prom. Finalizar" value={data.ticketsSummary.tiempoPromedioFinalizar || '-'} />
            <Card accent="primary" icon={<IconCalendar />} label="Tiempo Prom. Reconocer" value={data.ticketsSummary.tiempoPromedioReconocer || '-'} />
          </CardsRow>

          <div className="flex gap-4 flex-wrap mb-6">
            <Panel title="Tickets por Categoría">
              <RankedBarList rows={data.ticketsByCategoria.map((r) => ({ label: r.categoria, total: r.total }))} />
            </Panel>
            <Panel title="Tickets por Estatus">
              <EstatusDonutChart rows={data.ticketsByEstatus} />
            </Panel>
          </div>

          <div className="flex gap-4 flex-wrap mb-6">
            <Panel title="Tickets por Plaza" className="min-w-full">
              <PlazaVerticalBarChart rows={data.ticketsByPlaza} />
            </Panel>
          </div>

          <div className="flex gap-4 flex-wrap mb-6">
            <Panel title="Tiempo Promedio en Finalizar por Categoría">
              <DurationBarList rows={data.tiempoPromedioPorCategoria} />
            </Panel>
            <Panel title="Tickets Totales por Mes vs Finalizados">
              <TicketsPorMesChart rows={data.ticketsPorMes} />
            </Panel>
          </div>

          {ticketsDialog && (
            <TicketsDialog
              title={ticketsDialog.title}
              rows={ticketsDialog.estatus ? data.ticketsDetail.filter((t) => t.estatus === ticketsDialog.estatus) : data.ticketsDetail}
              onClose={() => setTicketsDialog(null)}
              onRowClick={setTicketDetailRow}
            />
          )}

          {ticketDetailRow && (
            <TicketDetailDialog row={ticketDetailRow} onClose={() => setTicketDetailRow(null)} />
          )}
        </>
      )}
    </div>
  );
}

function CardsRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 flex-wrap mb-6">{children}</div>;
}

const ACCENT_CLASSES: Record<string, string> = {
  primary: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500'
};

function Card({ accent, icon, label, value, onClick }: { accent: keyof typeof ACCENT_CLASSES; icon: React.ReactNode; label: string; value: string | number; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`bg-white rounded-[10px] shadow-sm px-5 py-4.5 flex-1 min-w-[180px] text-left ${onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}`}
    >
      <div className={`w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-white ${ACCENT_CLASSES[accent]}`}>{icon}</div>
      <h3 className="text-xs uppercase text-slate-400 tracking-wide mb-1.5">{label}</h3>
      <p className="text-[22px] font-bold">{value}</p>
    </Tag>
  );
}

function icon(path: React.ReactNode) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      {path}
    </svg>
  );
}

const IconTicket = () => icon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);
const IconClock = () => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>);
const IconCheck = () => icon(<path d="M20 6 9 17l-5-5" />);
const IconCalendar = () => icon(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></>);

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[10px] shadow-sm p-5 flex-1 min-w-[380px] flex flex-col ${className}`}>
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function RankedBarList({ rows }: { rows: { label: string; total: number }[] }) {
  const max = Math.max(0, ...rows.map((r) => r.total));

  if (rows.length === 0) return <p className="text-sm text-slate-400">Sin datos para mostrar.</p>;

  return (
    <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
      {rows.map((r) => {
        const widthPct = max ? (r.total / max) * 100 : 0;
        return (
          <div key={r.label} title={`${r.label}: ${r.total} ticket(s)`} className="relative h-[38px] rounded-lg overflow-hidden bg-slate-100 flex items-center">
            <div className="absolute left-0 top-0 h-full rounded-lg bg-indigo-500/15" style={{ width: `${widthPct}%` }} />
            <div className="relative z-10 flex-1 px-3.5 text-sm font-medium truncate">{r.label}</div>
            <div className="relative z-10 px-3.5 text-sm text-slate-400 font-semibold">{r.total}</div>
          </div>
        );
      })}
    </div>
  );
}

const ESTATUS_HEX_COLORS: Record<string, string> = {
  FINALIZADO: '#10b981',
  'EN SEGUIMIENTO': '#f59e0b',
  CANCELADO: '#fb7185'
};
const DONUT_FALLBACK_COLORS = ['#6366f1', '#0ea5e9', '#a855f7', '#94a3b8'];

const DONUT_SIZE = 280;
const DONUT_CENTER = DONUT_SIZE / 2;
const DONUT_RADIUS = DONUT_CENTER - 24;
const DONUT_ANIMATION_MS = 900;

function easeOutCubic(p: number): number {
  return 1 - Math.pow(1 - p, 3);
}

function EstatusDonutChart({ rows }: { rows: EstatusTotal[] }) {
  const [progress, setProgress] = useState(0);
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  const strokeWidth = 34;
  const circumference = 2 * Math.PI * DONUT_RADIUS;

  useEffect(() => {
    setProgress(0);
    let start: number | undefined;
    let raf: number;

    function step(ts: number) {
      if (start === undefined) start = ts;
      const p = Math.min(1, (ts - start) / DONUT_ANIMATION_MS);
      setProgress(easeOutCubic(p));
      if (p < 1) raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [rows]);

  if (rows.length === 0 || total === 0) return <p className="text-sm text-slate-400">Sin datos para mostrar.</p>;

  let cumulativePct = 0;
  const segments = rows.map((r, i) => {
    const pct = r.total / total;
    const color = ESTATUS_HEX_COLORS[r.estatus] || DONUT_FALLBACK_COLORS[i % DONUT_FALLBACK_COLORS.length];
    const offsetPct = cumulativePct;
    cumulativePct += pct;
    return { ...r, pct, color, offsetPct };
  });

  return (
    <div className="h-full flex items-center gap-6 flex-wrap justify-center">
      <svg viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} className="shrink-0 -rotate-90 w-full max-w-[280px] h-auto">
        <circle cx={DONUT_CENTER} cy={DONUT_CENTER} r={DONUT_RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        {segments.map((s) => (
          <circle
            key={s.estatus}
            cx={DONUT_CENTER}
            cy={DONUT_CENTER}
            r={DONUT_RADIUS}
            fill="none"
            stroke={s.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeDasharray={`${s.pct * progress * circumference} ${circumference}`}
            strokeDashoffset={-s.offsetPct * circumference}
          />
        ))}
        <text x={DONUT_CENTER} y={DONUT_CENTER} transform={`rotate(90 ${DONUT_CENTER} ${DONUT_CENTER})`} textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-slate-800">
          {total}
        </text>
      </svg>
      <div className="flex flex-col gap-2">
        {segments.map((s) => (
          <div key={s.estatus} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600 truncate">{s.estatus}</span>
            <span className="text-slate-400 font-semibold">{s.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DurationBarList({ rows }: { rows: { categoria: string; duracion: string; segundos: number }[] }) {
  const max = Math.max(0, ...rows.map((r) => r.segundos));

  if (rows.length === 0) return <p className="text-sm text-slate-400">Sin tickets finalizados para calcular.</p>;

  return (
    <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
      {rows.map((r) => {
        const widthPct = max ? (r.segundos / max) * 100 : 0;
        return (
          <div key={r.categoria} title={`${r.categoria}: ${r.duracion}`} className="relative h-[38px] rounded-lg overflow-hidden bg-slate-100 flex items-center">
            <div className="absolute left-0 top-0 h-full rounded-lg bg-indigo-500/15" style={{ width: `${widthPct}%` }} />
            <div className="relative z-10 flex-1 px-3.5 text-sm font-medium truncate">{r.categoria}</div>
            <div className="relative z-10 px-3.5 text-sm text-slate-400 font-semibold whitespace-nowrap">{r.duracion || '-'}</div>
          </div>
        );
      })}
    </div>
  );
}

const PLAZA_CHART_COLORS = [
  '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#fb7185',
  '#a855f7', '#14b8a6', '#f97316', '#84cc16', '#ec4899',
  '#8b5cf6', '#06b6d4', '#eab308', '#f43f5e', '#22c55e'
];

function PlazaVerticalBarChart({ rows }: { rows: PlazaTotal[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  const overallTotal = rows.reduce((sum, r) => sum + r.total, 0);

  if (rows.length === 0) return <p className="text-sm text-slate-400">Sin datos para mostrar.</p>;

  return (
    <div className="flex items-end gap-2 h-[260px] overflow-x-auto pb-1">
      {rows.map((r, i) => {
        const heightPct = (r.total / max) * 100;
        const pct = overallTotal ? (r.total / overallTotal) * 100 : 0;
        const color = PLAZA_CHART_COLORS[i % PLAZA_CHART_COLORS.length];
        return (
          <div key={r.plaza} title={`${r.plaza}: ${r.total} ticket(s) (${pct.toFixed(1)}% del total)`} className="flex flex-col items-center gap-0.5 flex-1 min-w-[56px] h-full justify-end">
            <span className="text-[12px] font-semibold text-slate-600 leading-none">{r.total}</span>
            <span className="text-[10px] text-slate-400 leading-none mb-1">{pct.toFixed(1)}%</span>
            <div className="w-full rounded-t-md" style={{ height: `${Math.max(heightPct, 3)}%`, backgroundColor: color }} />
            <span className="text-[11px] text-slate-500 whitespace-nowrap truncate max-w-[70px]">{r.plaza}</span>
          </div>
        );
      })}
    </div>
  );
}

function TicketsPorMesChart({ rows }: { rows: MesTotal[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));

  if (rows.length === 0) return <p className="text-sm text-slate-400">Sin datos para mostrar.</p>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Totales</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Finalizados</span>
      </div>
      <div className="flex-1 flex items-end gap-3 overflow-x-auto pb-1 min-h-[180px]">
        {rows.map((r) => {
          const totalPct = (r.total / max) * 100;
          const finalizadosPct = (r.finalizados / max) * 100;
          return (
            <div key={r.mes} title={`${r.mes}: ${r.total} total, ${r.finalizados} finalizados`} className="flex flex-col items-center gap-1.5 flex-1 min-w-[52px] h-full justify-end">
              <div className="flex items-end gap-1 h-full w-full justify-center">
                <div className="flex flex-col items-center justify-end h-full w-4">
                  <span className="text-[10px] font-semibold text-slate-500">{r.total}</span>
                  <div className="w-full rounded-t-md bg-indigo-500" style={{ height: `${Math.max(totalPct, 3)}%` }} />
                </div>
                <div className="flex flex-col items-center justify-end h-full w-4">
                  <span className="text-[10px] font-semibold text-slate-500">{r.finalizados}</span>
                  <div className="w-full rounded-t-md bg-emerald-500" style={{ height: `${Math.max(finalizadosPct, 3)}%` }} />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 whitespace-nowrap">{r.mes}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

