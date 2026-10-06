'use client';

import { useEffect, useRef, useState } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { fetchJsonCached } from '@/lib/fetchCache';
import type { GastoCategoriaTotal, GastoServicioRow } from '@/domain/usecases/GetGastosServicios';
import { Card, CardsRow, ErrorAlert, LoadingBanner, PageHeader } from '@/components/ui';

interface FilterOptions {
  ciudades: string[];
  categorias: string[];
  estatuses: string[];
}

interface Filters {
  ciudades?: string[];
  categorias?: string[];
  estatuses?: string[];
  desde?: string;
  hasta?: string;
}

interface ServiciosData {
  rows: GastoServicioRow[];
  totalsByCategoria: GastoCategoriaTotal[];
}

const DEFAULT_FILTERS: Filters = { ciudades: undefined, categorias: undefined, estatuses: ['AUTORIZADA', 'DEPOSITADO', 'FINALIZADA'] };

export default function ServiciosPage() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ ciudades: [], categorias: [], estatuses: [] });
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [data, setData] = useState<ServiciosData>({ rows: [], totalsByCategoria: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.ciudades !== undefined) params.set('ciudades', filters.ciudades.join(','));
      if (filters.categorias !== undefined) params.set('categorias', filters.categorias.join(','));
      if (filters.estatuses !== undefined) params.set('estatuses', filters.estatuses.join(','));
      if (filters.desde) params.set('desde', filters.desde);
      if (filters.hasta) params.set('hasta', filters.hasta);

      try {
        const result = await fetchJsonCached<{ filterOptions: FilterOptions; data: ServiciosData }>(
          `/api/servicios?${params.toString()}`,
          60_000
        );
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

  const visibleTotals = data.totalsByCategoria.filter(
    (t) => filters.categorias === undefined || filters.categorias.includes(t.categoria)
  );

  return (
    <div className="p-6">
      <PageHeader title="Pagos de servicios" />

      {error && <ErrorAlert message={error} />}
      {loading && <LoadingBanner />}

      <div className="flex items-end gap-4 flex-wrap bg-white rounded-lg shadow-sm px-4.5 py-3.5 mb-5">
        <MultiSelectFilter label="Ciudad" options={filterOptions.ciudades} value={filters.ciudades ?? filterOptions.ciudades} onChange={(v) => setFilters((f) => ({ ...f, ciudades: v }))} />
        <MultiSelectFilter label="Categoría" options={filterOptions.categorias} value={filters.categorias ?? filterOptions.categorias} onChange={(v) => setFilters((f) => ({ ...f, categorias: v }))} />
        <MultiSelectFilter label="Estatus" options={filterOptions.estatuses} value={filters.estatuses ?? filterOptions.estatuses} onChange={(v) => setFilters((f) => ({ ...f, estatuses: v }))} />
        <DateFilter label="Desde" value={filters.desde} max={filters.hasta} onChange={(v) => setFilters((f) => ({ ...f, desde: v }))} />
        <DateFilter label="Hasta" value={filters.hasta} min={filters.desde} onChange={(v) => setFilters((f) => ({ ...f, hasta: v }))} />
        <button onClick={() => setFilters(DEFAULT_FILTERS)} className="rounded-md px-4 py-1.5 text-sm bg-white border border-slate-200">Limpiar</button>
      </div>

      <CardsRow>
        <Card
          index={0}
          accent="success"
          icon={<IconServicio />}
          label="Total depositado"
          value={formatMoney(visibleTotals.reduce((sum, t) => sum + t.total, 0))}
          subtitle={`${visibleTotals.reduce((sum, t) => sum + t.pagos, 0)} pagos`}
        />
        {visibleTotals.filter((t) => t.categoria !== 'CFE').map((t, i) => (
          <Card
            key={t.categoria}
            index={i + 1}
            accent={t.pagos ? 'primary' : 'muted'}
            icon={<IconServicio />}
            label={t.categoria}
            value={t.pagos ? formatMoney(t.total) : 'Sin datos'}
            subtitle={t.pagos ? `${t.pagos} ${t.pagos === 1 ? 'pago' : 'pagos'}` : 'Aún no hay información cargada'}
          />
        ))}
      </CardsRow>

      <div className="bg-white rounded-[10px] shadow-sm p-5">
        <ServiciosTable rows={data.rows} />
      </div>
    </div>
  );
}

function DateFilter({ label, value, min, max, onChange }: {
  label: string;
  value?: string;
  min?: string;
  max?: string;
  onChange: (next: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] uppercase text-slate-400 tracking-wide">{label}</label>
      <input
        type="date"
        value={value ?? ''}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white"
      />
    </div>
  );
}

type ColumnKey = keyof GastoServicioRow;

const SERVICIOS_COLUMNS: { key: ColumnKey; label: string; align?: 'right'; width?: number }[] = [
  { key: 'folio', label: 'Folio' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'estatus', label: 'Estatus' },
  { key: 'codigo', label: 'Código' },
  { key: 'empresa', label: 'Empresa', width: 100 },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'montoSolicitado', label: 'Solicitado', align: 'right' },
  { key: 'monto', label: 'Depositado', align: 'right' }
];

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 80;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function displayValue(row: GastoServicioRow, key: ColumnKey): string {
  switch (key) {
    case 'monto':
      return formatMoney(row.monto);
    case 'montoSolicitado':
      return formatMoney(row.montoSolicitado);
    case 'fecha':
      return formatDate(row.fecha);
    case 'categoria':
      return row.categoria.toUpperCase();
    default:
      return String(row[key] ?? '');
  }
}

// Primera y última página siempre visibles, más la actual y sus vecinas; el resto se colapsa en "…".
function getPageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) { pages.add(2); pages.add(3); pages.add(4); }
  if (current >= total - 2) { pages.add(total - 1); pages.add(total - 2); pages.add(total - 3); }

  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const items: (number | '…')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) items.push('…');
    items.push(p);
  });
  return items;
}

function ServiciosTable({ rows }: { rows: GastoServicioRow[] }) {
  const [sortKey, setSortKey] = useState<ColumnKey>('fecha');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<ColumnKey, string[]>>>({});
  const [colWidths, setColWidths] = useState<Partial<Record<ColumnKey, number>>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const resizing = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  const filtered = rows.filter((row) =>
    SERVICIOS_COLUMNS.every((col) => {
      const active = columnFilters[col.key];
      return !active || active.includes(displayValue(row, col.key));
    })
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];
    const result = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es');
    return sortDir === 'asc' ? result : -result;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  function toggleSort(key: ColumnKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function uniqueColumnValues(key: ColumnKey): string[] {
    return Array.from(new Set(rows.map((r) => displayValue(r, key)))).sort();
  }

  function onResizeStart(e: React.MouseEvent, key: ColumnKey) {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = { key, startX: e.clientX, startWidth: colWidths[key] ?? SERVICIOS_COLUMNS.find((c) => c.key === key)?.width ?? DEFAULT_COL_WIDTH };
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
    <div>
      <div className="overflow-auto">
        <table
          className="text-[13px] border-collapse table-fixed"
          style={{ width: '100%', minWidth: SERVICIOS_COLUMNS.reduce((sum, col) => sum + (colWidths[col.key] ?? col.width ?? DEFAULT_COL_WIDTH), 0) }}
        >
          <colgroup>
            {SERVICIOS_COLUMNS.map((col) => (
              <col key={col.key} style={{ width: colWidths[col.key] ?? col.width ?? DEFAULT_COL_WIDTH }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {SERVICIOS_COLUMNS.map((col) => {
                const options = uniqueColumnValues(col.key);
                return (
                  <th key={col.key} className="relative text-left px-3 py-2.5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between gap-2 pr-2">
                      <span onClick={() => toggleSort(col.key)} className="cursor-pointer select-none text-slate-400 uppercase text-[11px] font-semibold whitespace-nowrap truncate">
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
            {pageRows.map((row, i) => (
              <tr key={`${row.folio}-${row.categoria}-${start + i}`}>
                {SERVICIOS_COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 border-b border-slate-200 truncate ${col.align === 'right' ? 'text-right tabular-nums' : ''} ${col.key === 'codigo' ? 'font-semibold' : ''}`}
                  >
                    {displayValue(row, col.key) || '-'}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={SERVICIOS_COLUMNS.length} className="px-3 py-6 text-center text-slate-400">
                  Sin pagos de servicios para mostrar.
                </td>
              </tr>
            )}
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
          {getPageItems(currentPage, totalPages).map((item, i) =>
            item === '…' ? (
              <span key={`gap-${i}`} className="min-w-7 h-7 flex items-center justify-center text-slate-400">…</span>
            ) : (
              <button key={item} onClick={() => setPage(item)} className={`min-w-7 h-7 rounded-md border text-xs ${item === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200'}`}>{item}</button>
            )
          )}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="min-w-7 h-7 rounded-md border border-slate-200 disabled:opacity-40">›</button>
        </div>
      </div>
    </div>
  );
}

function IconServicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M22 12h-6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" />
    </svg>
  );
}

function formatMoney(value: number): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}
