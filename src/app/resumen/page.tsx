'use client';

import { useRef, useState, useEffect } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { fetchJsonCached } from '@/lib/fetchCache';
import type { OfficesSummary } from '@/domain/usecases/GetOfficesSummary';
import type { CompanyTotal, CompanyOffice } from '@/domain/usecases/GetMonthlyTotalByCompany';
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
  const [selectedPaymentDate, setSelectedPaymentDate] = useState<PaymentDateTotal | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyTotal | null>(null);

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
        <MultiSelectFilter label="Status de Vigencia" options={filterOptions.estados} value={filters.estados ?? filterOptions.estados} onChange={(v) => setFilters((f) => ({ ...f, estados: v }))} />
        <button onClick={() => setFilters(EMPTY_FILTERS)} className="rounded-md px-4 py-1.5 text-sm bg-white border border-slate-200">Limpiar</button>
      </div>

      {data && (
        <>
          <h2 className="text-[15px] font-semibold mb-3">Oficinas</h2>
          <CardsRow>
            <Card accent="primary" icon={<IconBuilding />} label="Total Oficinas" value={data.summary.totalOficinas} />
            <Card accent="success" icon={<IconCheck />} label="Vigentes" value={data.summary.totalVigentes} />
            <Card accent="danger" icon={<IconWarning />} label="Vencidos" value={data.summary.totalVencidos} />
            <Card accent="danger" icon={<IconAlertClock />} label="Urgentes" value={data.summary.totalCriticos} />
            <Card accent="warning" icon={<IconClock />} label="Renta Mensual" value={formatMoney(data.summary.totalRentaMensual)} />
          </CardsRow>

          <div className="flex gap-4 flex-wrap mb-6">
            <Panel title="Total Mensual por Empresa">
              <RankedBarList rows={data.monthlyTotalByCompany} onSelect={setSelectedCompany} />
            </Panel>
            <Panel title="Próximas Fechas de Pago">
              <FunnelList rows={data.upcomingPaymentTotals} onSelect={setSelectedPaymentDate} />
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

      {selectedPaymentDate && (
        <PaymentDateDialog row={selectedPaymentDate} onClose={() => setSelectedPaymentDate(null)} />
      )}
      {selectedCompany && (
        <CompanyDialog row={selectedCompany} onClose={() => setSelectedCompany(null)} />
      )}
    </div>
  );
}

interface PaymentDateRow {
  codigo: string;
  empresa: string;
  totalMensual: number;
  pct: number;
}

const PAYMENT_DIALOG_COLUMNS: { key: keyof PaymentDateRow; label: string; align: 'left' | 'right' }[] = [
  { key: 'codigo', label: 'Oficina', align: 'left' },
  { key: 'empresa', label: 'Empresa', align: 'left' },
  { key: 'totalMensual', label: 'Monto Mensual', align: 'right' },
  { key: 'pct', label: '%', align: 'right' }
];

const PAYMENT_FILTERABLE_COLUMNS: (keyof PaymentDateRow)[] = ['codigo', 'empresa'];

function PaymentDateDialog({ row, onClose }: { row: PaymentDateTotal; onClose: () => void }) {
  const [sortKey, setSortKey] = useState<keyof PaymentDateRow>('totalMensual');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof PaymentDateRow, string[]>>>({});

  const totalMonto = row.oficinas.reduce((sum, o) => sum + o.totalMensual, 0);
  const rows: PaymentDateRow[] = row.oficinas.map((o) => ({
    codigo: o.codigo,
    empresa: o.empresa,
    totalMensual: o.totalMensual,
    pct: totalMonto ? (o.totalMensual / totalMonto) * 100 : 0
  }));

  function toggleSort(key: keyof PaymentDateRow) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'codigo' || key === 'empresa' ? 'asc' : 'desc'); }
  }

  function uniqueColumnValues(key: keyof PaymentDateRow): string[] {
    return Array.from(new Set(rows.map((r) => String(r[key])))).sort();
  }

  const filtered = rows.filter((r) =>
    PAYMENT_FILTERABLE_COLUMNS.every((key) => {
      const active = columnFilters[key];
      return !active || active.includes(String(r[key]));
    })
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-[10px] shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold">
            Pagos con vencimiento {row.fecha} <span className="text-slate-400 font-normal">({sorted.length}{sorted.length !== rows.length ? ` de ${rows.length}` : ''})</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-indigo-600 p-1" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-auto p-5 flex-1">
          <table className="w-full text-[13px] border-collapse">
            <thead>
              <tr>
                {PAYMENT_DIALOG_COLUMNS.map((col) => (
                  <th key={col.key} className={`px-3 py-2 border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                    <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : 'justify-between'}`}>
                      <span onClick={() => toggleSort(col.key)} className="cursor-pointer select-none whitespace-nowrap">
                        {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                      </span>
                      {PAYMENT_FILTERABLE_COLUMNS.includes(col.key) && (
                        <MultiSelectFilter
                          label=""
                          options={uniqueColumnValues(col.key)}
                          value={columnFilters[col.key] ?? uniqueColumnValues(col.key)}
                          onChange={(v) => setColumnFilters((f) => ({ ...f, [col.key]: v }))}
                          compact
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={`${r.codigo}-${i}`} className="hover:bg-indigo-50/60">
                  <td className="px-3 py-2 border-b border-slate-200">{r.codigo}</td>
                  <td className="px-3 py-2 border-b border-slate-200">{r.empresa}</td>
                  <td className="px-3 py-2 border-b border-slate-200 text-right">{formatMoney(r.totalMensual)}</td>
                  <td className="px-3 py-2 border-b border-slate-200 text-right text-slate-500">{r.pct.toFixed(1)}%</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={PAYMENT_DIALOG_COLUMNS.length} className="px-3 py-6 text-center text-slate-400">
                    Sin oficinas para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="px-3 py-2 text-left font-semibold">Total</td>
                <td className="px-3 py-2 text-right font-semibold">{formatMoney(sorted.reduce((sum, r) => sum + r.totalMensual, 0))}</td>
                <td className="px-3 py-2 text-right font-semibold">{sorted.reduce((sum, r) => sum + r.pct, 0).toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

interface CompanyOfficeRow {
  codigo: string;
  totalMensual: number;
  pct: number;
  fechaLimitePago: string;
}

const COMPANY_DIALOG_COLUMNS: { key: keyof CompanyOfficeRow; label: string; align: 'left' | 'right' }[] = [
  { key: 'codigo', label: 'Oficina', align: 'left' },
  { key: 'totalMensual', label: 'Monto Mensual', align: 'right' },
  { key: 'pct', label: '%', align: 'right' },
  { key: 'fechaLimitePago', label: 'Fecha de Pago', align: 'left' }
];

const COMPANY_FILTERABLE_COLUMNS: (keyof CompanyOfficeRow)[] = ['codigo', 'fechaLimitePago'];
const COMPANY_SEARCHABLE_FIELDS: (keyof CompanyOfficeRow)[] = ['codigo', 'fechaLimitePago'];

const COMPANY_DEFAULT_COL_WIDTH = 150;
const COMPANY_MIN_COL_WIDTH = 70;

function CompanyDialog({ row, onClose }: { row: CompanyTotal; onClose: () => void }) {
  const [sortKey, setSortKey] = useState<keyof CompanyOfficeRow>('totalMensual');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [colWidths, setColWidths] = useState<Partial<Record<keyof CompanyOfficeRow, number>>>({});
  const [search, setSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof CompanyOfficeRow, string[]>>>({});
  const resizing = useRef<{ key: keyof CompanyOfficeRow; startX: number; startWidth: number } | null>(null);

  const rows: CompanyOfficeRow[] = row.oficinas.map((o: CompanyOffice) => ({
    codigo: o.codigo,
    totalMensual: o.totalMensual,
    pct: row.total ? (o.totalMensual / row.total) * 100 : 0,
    fechaLimitePago: o.fechaLimitePago
  }));

  function toggleSort(key: keyof CompanyOfficeRow) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir(key === 'codigo' || key === 'fechaLimitePago' ? 'asc' : 'desc'); }
  }

  const searchTerm = search.trim().toUpperCase();
  const searched = searchTerm
    ? rows.filter((r) => COMPANY_SEARCHABLE_FIELDS.some((key) => String(r[key] ?? '').toUpperCase().includes(searchTerm)))
    : rows;

  const filtered = searched.filter((r) =>
    COMPANY_FILTERABLE_COLUMNS.every((key) => {
      const active = columnFilters[key];
      return !active || active.includes(String(r[key]));
    })
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  function uniqueColumnValues(key: keyof CompanyOfficeRow): string[] {
    return Array.from(new Set(rows.map((r) => String(r[key])))).sort();
  }

  function onResizeStart(e: React.MouseEvent, key: keyof CompanyOfficeRow) {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startWidth: colWidths[key] ?? COMPANY_DEFAULT_COL_WIDTH };
    document.addEventListener('mousemove', onResizeMove);
    document.addEventListener('mouseup', onResizeEnd);
  }

  function onResizeMove(e: MouseEvent) {
    const r = resizing.current;
    if (!r) return;
    const width = Math.max(COMPANY_MIN_COL_WIDTH, r.startWidth + (e.clientX - r.startX));
    setColWidths((w) => ({ ...w, [r.key]: width }));
  }

  function onResizeEnd() {
    resizing.current = null;
    document.removeEventListener('mousemove', onResizeMove);
    document.removeEventListener('mouseup', onResizeEnd);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[10px] shadow-lg w-full max-w-[95vw] xl:max-w-[700px] h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 gap-4">
          <h2 className="text-sm font-semibold whitespace-nowrap">
            {row.empresa} <span className="text-slate-400 font-normal">({sorted.length}{sorted.length !== rows.length ? ` de ${rows.length}` : ''})</span>
          </h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por oficina, fecha…"
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full max-w-sm"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-indigo-600 p-1 shrink-0" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-auto p-5 flex-1">
          <table className="w-full text-[13px] border-collapse table-fixed">
            <colgroup>
              {COMPANY_DIALOG_COLUMNS.map((col) => (
                <col key={col.key} style={colWidths[col.key] ? { width: colWidths[col.key] } : undefined} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {COMPANY_DIALOG_COLUMNS.map((col) => {
                  const options = uniqueColumnValues(col.key);
                  return (
                    <th key={col.key} className={`relative px-3 py-2.5 border-b border-slate-200 bg-slate-50 text-slate-400 uppercase text-[11px] font-semibold ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      <div className={`flex items-center gap-1 pr-2 ${col.align === 'right' ? 'justify-end' : 'justify-between'}`}>
                        <span onClick={() => toggleSort(col.key)} className="cursor-pointer select-none truncate">
                          {col.label} {sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </span>
                        {COMPANY_FILTERABLE_COLUMNS.includes(col.key) && (
                          <MultiSelectFilter
                            label=""
                            options={options}
                            value={columnFilters[col.key] ?? options}
                            onChange={(v) => setColumnFilters((f) => ({ ...f, [col.key]: v }))}
                            compact
                          />
                        )}
                      </div>
                      <span
                        onMouseDown={(e) => onResizeStart(e, col.key)}
                        className="absolute top-0 -right-1.5 z-10 h-full w-3 cursor-col-resize flex justify-center group"
                      >
                        <span className="h-full w-0.5 group-hover:bg-indigo-400" />
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={`${r.codigo}-${i}`} className="hover:bg-indigo-50/60">
                  <td className="px-3 py-2.5 border-b border-slate-200 truncate">{r.codigo}</td>
                  <td className="px-3 py-2.5 border-b border-slate-200 truncate text-right">{formatMoney(r.totalMensual)}</td>
                  <td className="px-3 py-2.5 border-b border-slate-200 truncate text-right text-slate-500">{r.pct.toFixed(1)}%</td>
                  <td className="px-3 py-2.5 border-b border-slate-200 truncate">{r.fechaLimitePago}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={COMPANY_DIALOG_COLUMNS.length} className="px-3 py-6 text-center text-slate-400">
                    Sin arrendamientos para mostrar.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="px-3 py-2.5 text-left font-semibold">Total</td>
                <td className="px-3 py-2.5 text-right font-semibold">{formatMoney(sorted.reduce((sum, r) => sum + r.totalMensual, 0))}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{sorted.reduce((sum, r) => sum + r.pct, 0).toFixed(1)}%</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
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
    <div className={`bg-white rounded-[10px] shadow-sm p-5 flex-1 min-w-[320px] flex flex-col ${className}`}>
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </div>
  );
}

function RankedBarList({ rows, onSelect }: { rows: CompanyTotal[]; onSelect: (row: CompanyTotal) => void }) {
  const max = Math.max(0, ...rows.map((r) => r.total));
  const totalGeneral = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {rows.map((r) => {
        const widthPct = max ? (r.total / max) * 100 : 0;
        const sharePct = totalGeneral ? (r.total / totalGeneral) * 100 : 0;
        return (
          <div
            key={r.empresa}
            title={`${formatMoney(r.total)} (${sharePct.toFixed(1)}% del total) — clic para ver detalle`}
            onClick={() => onSelect(r)}
            className="relative h-[42px] rounded-lg overflow-hidden bg-slate-100 flex items-center cursor-pointer hover:bg-slate-200/70"
          >
            <div className="absolute left-0 top-0 h-full rounded-lg bg-indigo-500/15" style={{ width: `${widthPct}%` }} />
            <div className="relative z-10 flex-1 px-3.5 text-sm font-medium truncate">{r.empresa}</div>
            <div className="relative z-10 px-3.5 text-sm text-slate-400 font-semibold whitespace-nowrap">
              {formatMoney(r.total)} <span className="text-slate-400/70 font-normal">({sharePct.toFixed(1)}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FunnelList({ rows, onSelect }: { rows: PaymentDateTotal[]; onSelect: (row: PaymentDateTotal) => void }) {
  const max = Math.max(0, ...rows.map((r) => r.totalOficinas));
  const total = rows.reduce((sum, r) => sum + r.totalOficinas, 0);

  return (
    <div className="flex-1 flex flex-col justify-around gap-1.5">
      {rows.map((r) => {
        const widthPct = max ? (r.totalOficinas / max) * 100 : 0;
        const sharePct = total ? (r.totalOficinas / total) * 100 : 0;
        const label = `${r.totalOficinas} (${sharePct.toFixed(1)}%)`;
        const labelFitsInside = widthPct >= 22;
        return (
          <div
            key={r.fecha}
            title={`${r.totalOficinas} oficina(s) con pago el ${r.fecha} — clic para ver detalle`}
            onClick={() => onSelect(r)}
            className="grid grid-cols-[90px_1fr] items-center gap-2.5 cursor-pointer group"
          >
            <div className="text-xs text-slate-400 text-right group-hover:text-indigo-600">{r.fecha}</div>
            <div className="flex items-center h-[22px]">
              <div className="h-full rounded-md bg-indigo-600 group-hover:bg-indigo-700 min-w-2 flex items-center justify-end px-2" style={{ width: `${widthPct}%` }}>
                {labelFitsInside && (
                  <span className="text-xs font-semibold text-white whitespace-nowrap">{label}</span>
                )}
              </div>
              {!labelFitsInside && (
                <span className="text-xs font-semibold text-slate-700 whitespace-nowrap ml-2">{label}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const ESTADO_PRIORITY = ['⛔ VENCIDO', '🔴 URGENTE', '🟡 PRÓXIMO', '🟢 A TIEMPO', '🟠 INDETERMINADO'];
const ESTADO_BADGE_CLASSES: Record<string, string> = {
  '⛔ VENCIDO': 'bg-rose-100 text-rose-700',
  '🔴 URGENTE': 'bg-rose-50 text-rose-600',
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
  { key: 'clasificacion', label: 'Clasificación' },
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
    if (estado === '🔴 URGENTE') return 'bg-rose-500/5';
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
        const barColor = r.estado === '🔴 URGENTE' ? 'bg-rose-500' : 'bg-amber-500';

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
