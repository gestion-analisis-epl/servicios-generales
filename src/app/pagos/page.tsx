'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { fetchJsonCached } from '@/lib/fetchCache';
import type { PagosSummary } from '@/domain/usecases/GetPagosSummary';
import type { PagoDetailRow } from '@/domain/usecases/GetPagosDetail';
import type { PagoPorFechaRow } from '@/domain/usecases/GetPagosPorFechaLimite';
import type { OficinasPorFechaPivot } from '@/domain/usecases/GetOficinasVigentesPorFecha';

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

export default function PagosPage() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ ciudades: [], oficinas: [], estados: [] });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [pagosSummary, setPagosSummary] = useState<PagosSummary | null>(null);
  const [pagosDetail, setPagosDetail] = useState<PagoDetailRow[]>([]);
  const [pagosPorFecha, setPagosPorFecha] = useState<PagoPorFechaRow[]>([]);
  const [oficinasPorFecha, setOficinasPorFecha] = useState<OficinasPorFechaPivot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ dateKey: string; rows: PagoDetailRow[] } | null>(null);

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
          data: { pagosSummary: PagosSummary; pagosDetail: PagoDetailRow[]; pagosPorFecha: PagoPorFechaRow[]; oficinasPorFecha: OficinasPorFechaPivot };
        }>(`/api/pagos?${params.toString()}`, 60_000);
        if (cancelled) return;
        setFilterOptions(result.filterOptions);
        setPagosSummary(result.data.pagosSummary);
        setPagosDetail(result.data.pagosDetail);
        setPagosPorFecha(result.data.pagosPorFecha);
        setOficinasPorFecha(result.data.oficinasPorFecha);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [filters]);

  const paymentsByDate = useMemo(() => {
    const map: Record<string, PagoDetailRow[]> = {};
    pagosDetail.forEach((row) => {
      if (!map[row.fechaLimitePago]) map[row.fechaLimitePago] = [];
      map[row.fechaLimitePago].push(row);
    });
    return map;
  }, [pagosDetail]);

  return (
    <div className="p-6">
      <header className="h-16 -mx-6 -mt-6 mb-6 flex items-center px-6 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-bold">Pagos</h1>
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

      {pagosSummary && (
        <div className="flex gap-4 flex-wrap mb-6">
          <Card accent="primary" icon={<IconMoney />} label="Total Mensual" value={formatMoney(pagosSummary.totalMensual)} />
          <Card accent="primary" icon={<IconBuilding />} label="Arrendamientos Totales" value={pagosSummary.totalArrendamientos} />
          <Card accent="warning" icon={<IconAlertClock />} label="Por Vencer" value={pagosSummary.porVencer} />
          <Card accent="danger" icon={<IconWarning />} label="Vencidos" value={pagosSummary.vencidos} />
        </div>
      )}

      <PaymentsCalendar paymentsByDate={paymentsByDate} onSelectDay={(dateKey, rows) => setSelectedDay({ dateKey, rows })} />

      <div className="flex gap-4 flex-wrap mt-6">
        <PaymentsByDateChart rows={pagosPorFecha} />
        <PaymentsVencimientoHeatmap rows={pagosPorFecha} />
      </div>

      {oficinasPorFecha && <OficinasPorFechaTable pivot={oficinasPorFecha} />}

      {selectedDay && (
        <PaymentsDayDialog dateKey={selectedDay.dateKey} rows={selectedDay.rows} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
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

const IconMoney = () => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5c0-1.1 1.12-2 2.5-2s2.5.9 2.5 2-1.12 1.5-2.5 1.5-2.5.4-2.5 1.5 1.12 2 2.5 2 2.5-.9 2.5-2" /></>);
const IconBuilding = () => icon(<><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>);
const IconWarning = () => icon(<><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /></>);
const IconAlertClock = () => icon(<><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" /></>);
const IconChevronLeft = () => icon(<path d="M15 6l-6 6 6 6" />);
const IconChevronRight = () => icon(<path d="M9 6l6 6-6 6" />);

function formatMoney(value: number): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

function formatMoneyCompact(value: number): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 });
}

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[10px] shadow-sm p-5 flex-1 min-w-[380px] flex flex-col ${className}`}>
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function PaymentsByDateChart({ rows }: { rows: PagoPorFechaRow[] }) {
  const max = Math.max(0, ...rows.map((r) => r.totalFactura));

  return (
    <Panel title="Total por Fecha Límite de Pago">
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos para mostrar.</p>
      ) : (
        <div className="h-full flex flex-col justify-center gap-3.5 max-h-[420px] overflow-y-auto pr-1">
          {rows.map((r) => {
            const widthPct = max ? (r.totalFactura / max) * 100 : 0;
            return (
              <div key={r.fecha} title={`${r.fecha} — ${formatMoney(r.totalFactura)}`} className="grid grid-cols-[90px_1fr] items-center gap-2.5">
                <div className="text-xs text-slate-500 text-right">{r.fecha}</div>
                <div className="relative h-8 rounded-md bg-slate-100">
                  <div className="h-full rounded-md bg-indigo-500" style={{ width: `${Math.max(widthPct, 3)}%` }} />
                  {widthPct >= 22 ? (
                    <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-semibold text-white">{formatMoneyCompact(r.totalFactura)}</span>
                  ) : (
                    <span className="absolute inset-y-0 flex items-center text-[11px] font-semibold text-slate-600" style={{ left: `calc(${Math.max(widthPct, 3)}% + 6px)` }}>
                      {formatMoneyCompact(r.totalFactura)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

const VENCIMIENTO_ROW_CLASSES: Record<PagoPorFechaRow['vencimiento'], string> = {
  'CRÍTICO': 'bg-rose-50',
  'A TIEMPO': 'bg-emerald-50',
  'REVISAR': 'bg-amber-50'
};

const VENCIMIENTO_BADGE_CLASSES: Record<PagoPorFechaRow['vencimiento'], string> = {
  'CRÍTICO': 'bg-rose-100 text-rose-700',
  'A TIEMPO': 'bg-emerald-100 text-emerald-700',
  'REVISAR': 'bg-amber-100 text-amber-700'
};

function PaymentsVencimientoHeatmap({ rows }: { rows: PagoPorFechaRow[] }) {
  const sorted = [...rows].sort((a, b) => {
    if (a.diasRestantes === null) return 1;
    if (b.diasRestantes === null) return -1;
    return a.diasRestantes - b.diasRestantes;
  });

  return (
    <Panel title="Días Restantes Totales por Próxima Fecha de Pago">
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos para mostrar.</p>
      ) : (
        <div className="overflow-auto max-h-[420px]">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className="text-left px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold">Fecha Límite de Pago</th>
                <th className="text-left px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold">Totales</th>
                <th className="text-left px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold">Días Restantes</th>
                <th className="text-left px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold">Vencimiento</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.fecha} className={VENCIMIENTO_ROW_CLASSES[r.vencimiento]}>
                  <td className="px-3 py-2 border-b border-slate-200">{r.fecha}</td>
                  <td className="px-3 py-2 border-b border-slate-200">{r.totalOficinas}</td>
                  <td className="px-3 py-2 border-b border-slate-200">{r.diasRestantes === null ? '-' : r.diasRestantes}</td>
                  <td className="px-3 py-2 border-b border-slate-200">
                    <Badge text={r.vencimiento} className={VENCIMIENTO_BADGE_CLASSES[r.vencimiento]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

function heatColor(value: number, min: number, max: number): string {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const hue = 120 * (1 - Math.min(1, Math.max(0, ratio)));
  return `hsl(${hue}, 70%, 85%)`;
}

function OficinasPorFechaTable({ pivot }: { pivot: OficinasPorFechaPivot }) {
  const { columns, rows, columnTotals, grandTotal } = pivot;
  const totalsValues = Object.values(columnTotals);
  const min = Math.min(1, ...totalsValues);
  const max = Math.max(grandTotal, ...totalsValues, 1);

  return (
    <Panel title="Total de Oficinas Vigentes según Próxima Fecha de Pago" className="mt-6">
      {rows.length === 0 ? (
        <p className="text-sm text-slate-400">Sin datos para mostrar.</p>
      ) : (
        <div className="overflow-auto max-h-[520px]">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 text-left px-3 py-2 border-b border-r border-slate-200 bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold whitespace-nowrap">
                  Código
                </th>
                {columns.map((c) => (
                  <th key={c} className="sticky top-0 z-10 text-center px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold whitespace-nowrap">
                    {c}
                  </th>
                ))}
                <th className="sticky top-0 z-10 text-center px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold whitespace-nowrap">
                  Suma total
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.codigo}>
                  <td className="sticky left-0 z-10 px-3 py-1.5 border-b border-r border-slate-200 bg-white font-medium whitespace-nowrap">{row.codigo}</td>
                  {columns.map((c) => (
                    <td key={c} className="text-center px-3 py-1.5 border-b border-slate-200">
                      {row.fecha === c && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded font-semibold text-emerald-900" style={{ backgroundColor: heatColor(1, min, max) }}>
                          1
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="text-center px-3 py-1.5 border-b border-slate-200">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded font-semibold text-emerald-900" style={{ backgroundColor: heatColor(1, min, max) }}>
                      1
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sticky left-0 z-10 px-3 py-2 border-t-2 border-r border-slate-300 bg-slate-50 font-semibold whitespace-nowrap">Suma total</td>
                {columns.map((c) => (
                  <td key={c} className="text-center px-3 py-2 border-t-2 border-slate-300">
                    <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded font-bold text-slate-900" style={{ backgroundColor: heatColor(columnTotals[c], min, max) }}>
                      {columnTotals[c]}
                    </span>
                  </td>
                ))}
                <td className="text-center px-3 py-2 border-t-2 border-slate-300">
                  <span className="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded font-bold text-slate-900" style={{ backgroundColor: heatColor(grandTotal, min, max) }}>
                    {grandTotal}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </Panel>
  );
}

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MONTH_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKeyOf(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function PaymentsCalendar({ paymentsByDate, onSelectDay }: { paymentsByDate: Record<string, PagoDetailRow[]>; onSelectDay: (dateKey: string, rows: PagoDetailRow[]) => void }) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayKey = dateKeyOf(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  return (
    <div className="bg-white rounded-[10px] shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Calendario de Pagos — {MONTH_LABELS[month]} {year}</h2>
        <div className="flex gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600">
            <IconChevronLeft />
          </button>
          <button onClick={() => setCursor(new Date(year, month, 1))} className="rounded-md border border-slate-200 px-3 text-xs text-slate-500 hover:text-indigo-600">Hoy</button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600">
            <IconChevronRight />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="text-center text-[10px] uppercase text-slate-400 font-semibold py-0.5">{w}</div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;

          const dateKey = dateKeyOf(year, month, day);
          const rows = paymentsByDate[dateKey] || [];
          const hasPayments = rows.length > 0;
          const isToday = dateKey === todayKey;

          return (
            <button
              key={dateKey}
              disabled={!hasPayments}
              onClick={() => onSelectDay(dateKey, rows)}
              className={`h-16 rounded-md border flex flex-col items-center justify-center gap-1 transition-colors ${
                hasPayments
                  ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100 cursor-pointer'
                  : 'border-slate-100 bg-white cursor-default'
              } ${isToday ? 'ring-2 ring-indigo-400' : ''}`}
            >
              <span className={`text-lg font-bold ${hasPayments ? 'text-indigo-700' : 'text-slate-500'}`}>{day}</span>
              {hasPayments && (
                <span className="text-[11px] font-medium text-indigo-600 bg-white rounded-full px-2 py-0.5 leading-none">
                  {rows.length}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const ESTADO_BADGE_CLASSES: Record<string, string> = {
  '⛔ VENCIDO': 'bg-rose-100 text-rose-700',
  '🔴 URGENTE': 'bg-rose-50 text-rose-600',
  '🟡 PRÓXIMO': 'bg-amber-100 text-amber-700',
  '🟢 A TIEMPO': 'bg-emerald-100 text-emerald-700',
  '🟠 INDETERMINADO': 'bg-slate-100 text-slate-600'
};

function Badge({ text, className }: { text: string; className: string }) {
  if (!text) return null;
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>{text}</span>;
}

const PAGO_DIALOG_COLUMNS: { key: keyof PagoDetailRow; label: string }[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'arrendador', label: 'Arrendador' },
  { key: 'domicilio', label: 'Domicilio' },
  { key: 'totalFactura', label: 'Total Factura' },
  { key: 'estado', label: 'Estado' }
];

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 70;

function formatDialogDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

function PaymentsDayDialog({ dateKey, rows, onClose }: { dateKey: string; rows: PagoDetailRow[]; onClose: () => void }) {
  const [sortKey, setSortKey] = useState<keyof PagoDetailRow>('codigo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [colWidths, setColWidths] = useState<Partial<Record<keyof PagoDetailRow, number>>>({});
  const resizing = useRef<{ key: keyof PagoDetailRow; startX: number; startWidth: number } | null>(null);

  function toggleSort(key: keyof PagoDetailRow) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function onResizeStart(e: React.MouseEvent, key: keyof PagoDetailRow) {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startWidth: colWidths[key] ?? DEFAULT_COL_WIDTH };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  }

  function onResizeMove(e: MouseEvent) {
    const r = resizing.current;
    if (!r) return;
    const width = Math.max(MIN_COL_WIDTH, r.startWidth + (e.clientX - r.startX));
    setColWidths((w) => ({ ...w, [r.key]: width }));
  }

  function onResizeEnd() {
    resizing.current = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-[10px] shadow-lg w-full max-w-5xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold">Pagos del {formatDialogDate(dateKey)} <span className="text-slate-400 font-normal">({rows.length})</span></h2>
          <button onClick={onClose} className="text-slate-400 hover:text-indigo-600 p-1" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-auto p-5">
          <table
            className="text-[13px] border-collapse table-fixed"
            style={{ width: PAGO_DIALOG_COLUMNS.reduce((sum, col) => sum + (colWidths[col.key] ?? DEFAULT_COL_WIDTH), 0) }}
          >
            <colgroup>
              {PAGO_DIALOG_COLUMNS.map((col) => (
                <col key={col.key} style={{ width: colWidths[col.key] ?? DEFAULT_COL_WIDTH }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {PAGO_DIALOG_COLUMNS.map((col) => (
                  <th key={col.key} className="relative text-left px-3 py-2.5 border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold">
                    <span onClick={() => toggleSort(col.key)} className="cursor-pointer select-none block truncate pr-2">
                      {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                    </span>
                    <span
                      onMouseDown={(e) => onResizeStart(e, col.key)}
                      className="absolute top-0 -right-1.5 z-10 h-full w-3 cursor-col-resize flex justify-center group"
                    >
                      <span className="h-full w-0.5 group-hover:bg-indigo-400" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr key={`${row.codigo}-${i}`}>
                  {PAGO_DIALOG_COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 border-b border-slate-200 truncate">
                      {col.key === 'estado' ? (
                        <Badge text={row.estado} className={ESTADO_BADGE_CLASSES[row.estado] || 'bg-slate-100 text-slate-600'} />
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={PAGO_DIALOG_COLUMNS.length} className="px-3 py-6 text-center text-slate-400">
                    Sin pagos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
