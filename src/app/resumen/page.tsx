'use client';

import { useState, useEffect } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { fetchJsonCached } from '@/lib/fetchCache';
import type { OfficesSummary } from '@/domain/usecases/GetOfficesSummary';
import type { CompanyTotal } from '@/domain/usecases/GetMonthlyTotalByCompany';
import type { PaymentDateTotal } from '@/domain/usecases/GetUpcomingPaymentTotals';
import type { OfficeTableRow } from '@/domain/usecases/GetOfficesTableRows';
import type { GanttRow } from '@/domain/usecases/GetUpcomingExpirationsGantt';

interface FilterOptions {
  ciudades: string[];
  oficinas: string[];
  estados: string[];
}

interface ResumenData {
  summary: OfficesSummary;
  monthlyTotalByCompany: CompanyTotal[];
  upcomingPaymentTotals: PaymentDateTotal[];
  officesTableRows: OfficeTableRow[];
  upcomingExpirationsGantt: GanttRow[];
}

interface Filters {
  ciudades?: string[];
  oficinas?: string[];
  estados?: string[];
}

const EMPTY_FILTERS: Filters = { ciudades: undefined, oficinas: undefined, estados: undefined };

export default function ResumenPage() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ ciudades: [], oficinas: [], estados: [] });
  const [data, setData] = useState<ResumenData | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
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
        const result = await fetchJsonCached<{ filterOptions: FilterOptions; data: ResumenData }>(`/api/resumen?${params.toString()}`, 60_000);
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

  return (
    <div className="p-6">
      <header className="h-16 -mx-6 -mt-6 mb-6 flex items-center px-6 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-bold">Resumen General</h1>
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
        <MultiSelectFilter label="Estado de Vigencia" options={filterOptions.estados} value={filters.estados ?? filterOptions.estados} onChange={(v) => setFilters((f) => ({ ...f, estados: v }))} />
        <button onClick={() => setFilters(EMPTY_FILTERS)} className="rounded-md px-4 py-1.5 text-sm bg-white border border-slate-200">Limpiar</button>
      </div>

      {data && (
        <>
          <h2 className="text-[15px] font-semibold mb-3">Oficinas</h2>
          <CardsRow>
            <Card accent="primary" icon={<IconBuilding />} label="Total Oficinas" value={data.summary.totalOficinas} />
            <Card accent="success" icon={<IconCheck />} label="Vigentes" value={data.summary.totalVigentes} />
            <Card accent="danger" icon={<IconWarning />} label="Vencidos" value={data.summary.totalVencidos} />
            <Card accent="danger" icon={<IconAlertClock />} label="Críticos" value={data.summary.totalCriticos} />
            <Card accent="warning" icon={<IconClock />} label="Renta Mensual" value={formatMoney(data.summary.totalRentaMensual)} />
          </CardsRow>

          <div className="flex gap-4 flex-wrap mb-6">
            <Panel title="Total Mensual por Empresa">
              <RankedBarList rows={data.monthlyTotalByCompany} />
            </Panel>
            <Panel title="Próximas Fechas de Pago">
              <FunnelList rows={data.upcomingPaymentTotals} />
            </Panel>
          </div>

          <Panel title="Oficinas según Estado de Vigencia" className="mb-6">
            <OfficesTable rows={data.officesTableRows} />
          </Panel>

          <Panel title="Próximos a Vencer">
            <GanttChart rows={data.upcomingExpirationsGantt} />
          </Panel>
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

const IconClock = () => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>);
const IconCheck = () => icon(<path d="M20 6 9 17l-5-5" />);
const IconBuilding = () => icon(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>);
const IconWarning = () => icon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></>);
const IconAlertClock = () => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" /></>);

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[10px] shadow-sm p-5 flex-1 min-w-[320px] ${className}`}>
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function RankedBarList({ rows }: { rows: CompanyTotal[] }) {
  const max = Math.max(0, ...rows.map((r) => r.total));
  const totalGeneral = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {rows.map((r) => {
        const widthPct = max ? (r.total / max) * 100 : 0;
        const sharePct = totalGeneral ? (r.total / totalGeneral) * 100 : 0;
        return (
          <div key={r.empresa} title={`${formatMoney(r.total)} (${sharePct.toFixed(1)}% del total)`} className="relative h-[42px] rounded-lg overflow-hidden bg-slate-100 flex items-center">
            <div className="absolute left-0 top-0 h-full rounded-lg bg-indigo-500/15" style={{ width: `${widthPct}%` }} />
            <div className="relative z-10 flex-1 px-3.5 text-sm font-medium truncate">{r.empresa}</div>
            <div className="relative z-10 px-3.5 text-sm text-slate-400 font-semibold">{formatMoney(r.total)}</div>
          </div>
        );
      })}
    </div>
  );
}

function FunnelList({ rows }: { rows: PaymentDateTotal[] }) {
  const max = Math.max(0, ...rows.map((r) => r.totalOficinas));

  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => {
        const widthPct = max ? (r.totalOficinas / max) * 100 : 0;
        return (
          <div key={r.fecha} title={`${r.totalOficinas} oficina(s) con pago el ${r.fecha}`} className="grid grid-cols-[90px_1fr_60px] items-center gap-2.5">
            <div className="text-xs text-slate-400 text-right">{r.fecha}</div>
            <div className="flex justify-center">
              <div className="h-[22px] rounded-md bg-indigo-600 min-w-2" style={{ width: `${widthPct}%` }} />
            </div>
            <div className="text-xs font-semibold">{r.totalOficinas}</div>
          </div>
        );
      })}
    </div>
  );
}

const ESTADO_PRIORITY = ['⛔ VENCIDO', '🔴 CRÍTICO', '🟡 PRÓXIMO', '🟢 A TIEMPO', '🟠 INDETERMINADO'];
const ESTADO_BADGE_CLASSES: Record<string, string> = {
  '⛔ VENCIDO': 'bg-rose-100 text-rose-700',
  '🔴 CRÍTICO': 'bg-rose-50 text-rose-600',
  '🟡 PRÓXIMO': 'bg-amber-100 text-amber-700',
  '🟢 A TIEMPO': 'bg-emerald-100 text-emerald-700',
  '🟠 INDETERMINADO': 'bg-slate-100 text-slate-600'
};

const LEGAL_BADGE_CLASSES: Record<string, string> = {
  'Sí': 'bg-emerald-100 text-emerald-700',
  'No': 'bg-rose-100 text-rose-700'
};

const TABLE_COLUMNS: { key: keyof OfficeTableRow; label: string }[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'inicioVigencia', label: 'Inicio Vigencia' },
  { key: 'finVigencia', label: 'Fin Vigencia' },
  { key: 'estado', label: 'Estado' },
  { key: 'legal', label: 'Legal' }
];

const PAGE_SIZE_OPTIONS = [8, 25, 50, 100];

function OfficesTable({ rows }: { rows: OfficeTableRow[] }) {
  const [sortKey, setSortKey] = useState<keyof OfficeTableRow>('estado');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof OfficeTableRow, string[]>>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const filtered = rows.filter((row) =>
    TABLE_COLUMNS.every((col) => {
      const active = columnFilters[col.key];
      return !active || active.includes(String(row[col.key]));
    })
  );

  const sorted = [...filtered].sort((a, b) => {
    let va: string | number = a[sortKey];
    let vb: string | number = b[sortKey];
    if (sortKey === 'estado') { va = ESTADO_PRIORITY.indexOf(va as string); vb = ESTADO_PRIORITY.indexOf(vb as string); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  function rowClass(estado: string) {
    if (estado === '⛔ VENCIDO') return 'bg-rose-500/10';
    if (estado === '🔴 CRÍTICO') return 'bg-rose-500/5';
    return '';
  }

  function toggleSort(key: keyof OfficeTableRow) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function uniqueColumnValues(key: keyof OfficeTableRow): string[] {
    return Array.from(new Set(rows.map((r) => String(r[key])))).sort();
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] border-collapse">
          <thead>
            <tr>
              {TABLE_COLUMNS.map((col) => {
                const options = uniqueColumnValues(col.key);
                return (
                  <th key={col.key} className="text-left px-3 py-2.5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between gap-2">
                      <span onClick={() => toggleSort(col.key)} className="cursor-pointer text-slate-400 uppercase text-[11px] font-semibold whitespace-nowrap">
                        {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </span>
                      <MultiSelectFilter
                        label=""
                        options={options}
                        value={columnFilters[col.key] ?? options}
                        onChange={(v) => { setColumnFilters((f) => ({ ...f, [col.key]: v })); setPage(1); }}
                        compact
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className={rowClass(row.estado)}>
                {TABLE_COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 border-b border-slate-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[220px]">
                    {col.key === 'estado' ? (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${ESTADO_BADGE_CLASSES[row.estado] || 'bg-slate-100 text-slate-600'}`}>
                        {row.estado}
                      </span>
                    ) : col.key === 'legal' ? (
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${LEGAL_BADGE_CLASSES[row.legal] || 'bg-slate-100 text-slate-600'}`}>
                        {row.legal}
                      </span>
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Mostrando {pageRows.length ? start + 1 : 0} a {start + pageRows.length} de {sorted.length}</span>
          <span className="text-slate-300">|</span>
          <label className="flex items-center gap-1.5">
            Filas por página
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-slate-200 rounded-md px-1.5 py-1 text-xs"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="min-w-7 h-7 rounded-md border border-slate-200 disabled:opacity-40">‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`min-w-7 h-7 rounded-md border text-xs ${p === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200'}`}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="min-w-7 h-7 rounded-md border border-slate-200 disabled:opacity-40">›</button>
        </div>
      </div>
    </div>
  );
}

const GANTT_MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function GanttChart({ rows }: { rows: GanttRow[] }) {
  const [today] = useState(() => Date.now());
  if (!rows.length) return <p className="text-sm text-slate-400">Sin arrendamientos próximos o críticos.</p>;

  const ends = rows.map((r) => new Date(r.finVigencia).getTime());
  const timelineStart = new Date(2026, 5, 1).getTime();
  const timelineEnd = Math.max(...ends, today, timelineStart + 1);
  const totalSpan = timelineEnd - timelineStart || 1;
  const todayPct = ((today - timelineStart) / totalSpan) * 100;

  const months: { label: string; pct: number }[] = [];
  const cursor = new Date(timelineStart);
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getTime() <= timelineEnd) {
    months.push({ label: `${GANTT_MONTHS[cursor.getMonth()]} ${String(cursor.getFullYear()).slice(-2)}`, pct: ((cursor.getTime() - timelineStart) / totalSpan) * 100 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-[160px_1fr] gap-3 pb-2.5 border-b border-slate-200 mb-1">
        <div />
        <div className="relative h-4 min-w-[480px]">
          {months.map((m, i) => (
            <span key={i} className="absolute top-0 text-[11px] text-slate-400 whitespace-nowrap" style={{ left: `${m.pct}%` }}>{m.label}</span>
          ))}
        </div>
      </div>
      {rows.map((r, i) => {
        const start = Math.max(new Date(r.inicioVigencia).getTime(), timelineStart);
        const end = new Date(r.finVigencia).getTime();
        const leftPct = Math.max(0, ((start - timelineStart) / totalSpan) * 100);
        const widthPct = Math.max(0.5, ((end - start) / totalSpan) * 100);
        const diasRestantes = Math.ceil((end - today) / 86400000);
        const barColor = r.estado === '🔴 CRÍTICO' ? 'bg-rose-500' : 'bg-amber-500';

        return (
          <div key={i} className="grid grid-cols-[160px_1fr] items-center gap-3 py-1.5">
            <div className="text-[12px] font-semibold truncate">{r.codigo}</div>
            <div
              className="relative h-6 bg-slate-100 rounded-full min-w-[480px]"
              title={`${r.codigo} | ${formatShortDate(start)} - ${formatShortDate(end)} | ${diasRestantes} días para vencer`}
            >
              <div className={`absolute top-0 h-full rounded-full flex items-center px-2.5 overflow-hidden ${barColor}`} style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
                <span className="text-[11px] text-white font-semibold whitespace-nowrap">{formatShortDate(end)}</span>
              </div>
              <div className="absolute -top-1 -bottom-1 w-0.5 bg-slate-800/50" style={{ left: `${todayPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatMoney(value: number): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

function formatShortDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' });
}
