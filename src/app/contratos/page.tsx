'use client';

import { useEffect, useRef, useState } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { fetchJsonCached } from '@/lib/fetchCache';
import type { ContratoRow } from '@/domain/usecases/GetContratosTableRows';

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

export default function ContratosPage() {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ ciudades: [], oficinas: [], estados: [] });
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [contratos, setContratos] = useState<ContratoRow[]>([]);
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
        const result = await fetchJsonCached<{ filterOptions: FilterOptions; data: { contratos: ContratoRow[] } }>(
          `/api/contratos?${params.toString()}`,
          60_000
        );
        if (cancelled) return;
        setFilterOptions(result.filterOptions);
        setContratos(result.data.contratos);
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
        <h1 className="text-lg font-bold">Contratos</h1>
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
        <MultiSelectFilter label="Estado" options={filterOptions.estados} value={filters.estados ?? filterOptions.estados} onChange={(v) => setFilters((f) => ({ ...f, estados: v }))} />
        <button onClick={() => setFilters(EMPTY_FILTERS)} className="rounded-md px-4 py-1.5 text-sm bg-white border border-slate-200">Limpiar</button>
      </div>

      <div className="bg-white rounded-[10px] shadow-sm p-5">
        <ContratosTable rows={contratos} />
      </div>
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

function Badge({ text, className }: { text: string; className: string }) {
  if (!text) return null;
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>{text}</span>;
}

const CONTRATOS_COLUMNS: { key: keyof ContratoRow; label: string }[] = [
  { key: 'codigo', label: 'Código' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'clasificacion', label: 'Clasificación' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'arrendador', label: 'Arrendador' },
  { key: 'inicio', label: 'Inicio' },
  { key: 'fin', label: 'Fin' },
  { key: 'vigencia', label: 'Vigencia' },
  { key: 'renta', label: 'Renta' },
  { key: 'totalFactura', label: 'Total Factura' },
  { key: 'fechaUltimoPago', label: 'Fecha Último Pago' },
  { key: 'renovado', label: 'Renovado' },
  { key: 'legal', label: 'Legal' }
];

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 80;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function displayValue(row: ContratoRow, key: keyof ContratoRow): string {
  switch (key) {
    case 'renta':
    case 'totalFactura':
      return formatMoney(row[key]);
    case 'inicio':
    case 'fin':
      return formatDisplayDate(row[key]);
    case 'fechaUltimoPago':
      return formatUltimoPago(row.fechaUltimoPago);
    default:
      return String(row[key] ?? '');
  }
}

function formatMoney(value: number): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

function formatDisplayDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

function formatUltimoPago(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  return formatDisplayDate(value);
}

function ContratosTable({ rows }: { rows: ContratoRow[] }) {
  const [sortKey, setSortKey] = useState<keyof ContratoRow>('codigo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [columnFilters, setColumnFilters] = useState<Partial<Record<keyof ContratoRow, string[]>>>({});
  const [colWidths, setColWidths] = useState<Partial<Record<keyof ContratoRow, number>>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const resizing = useRef<{ key: keyof ContratoRow; startX: number; startWidth: number } | null>(null);

  const filtered = rows.filter((row) =>
    CONTRATOS_COLUMNS.every((col) => {
      const active = columnFilters[col.key];
      return !active || active.includes(displayValue(row, col.key));
    })
  );

  const sorted = [...filtered].sort((a, b) => {
    let va: string | number = a[sortKey];
    let vb: string | number = b[sortKey];
    if (sortKey === 'vigencia') { va = ESTADO_PRIORITY.indexOf(va as string); vb = ESTADO_PRIORITY.indexOf(vb as string); }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageRows = sorted.slice(start, start + pageSize);

  function toggleSort(key: keyof ContratoRow) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  function uniqueColumnValues(key: keyof ContratoRow): string[] {
    return Array.from(new Set(rows.map((r) => displayValue(r, key)))).sort();
  }

  function onResizeStart(e: React.MouseEvent, key: keyof ContratoRow) {
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
    <div>
      <div className="overflow-auto">
        <table
          className="text-[13px] border-collapse table-fixed"
          style={{ width: CONTRATOS_COLUMNS.reduce((sum, col) => sum + (colWidths[col.key] ?? DEFAULT_COL_WIDTH), 0) }}
        >
          <colgroup>
            {CONTRATOS_COLUMNS.map((col) => (
              <col key={col.key} style={{ width: colWidths[col.key] ?? DEFAULT_COL_WIDTH }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {CONTRATOS_COLUMNS.map((col) => {
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
              <tr key={`${row.codigo}-${i}`}>
                {CONTRATOS_COLUMNS.map((col) => (
                  <td key={col.key} className="px-3 py-2.5 border-b border-slate-200 truncate">
                    {col.key === 'vigencia' ? (
                      <Badge text={row.vigencia} className={ESTADO_BADGE_CLASSES[row.vigencia] || 'bg-slate-100 text-slate-600'} />
                    ) : col.key === 'legal' ? (
                      <Badge text={row.legal} className={LEGAL_BADGE_CLASSES[row.legal] || 'bg-slate-100 text-slate-600'} />
                    ) : (
                      displayValue(row, col.key)
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={CONTRATOS_COLUMNS.length} className="px-3 py-6 text-center text-slate-400">
                  Sin contratos para mostrar.
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`min-w-7 h-7 rounded-md border text-xs ${p === currentPage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200'}`}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="min-w-7 h-7 rounded-md border border-slate-200 disabled:opacity-40">›</button>
        </div>
      </div>
    </div>
  );
}
