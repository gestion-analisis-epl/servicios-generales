'use client';

import { useEffect, useState } from 'react';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { GastoDetailDialog, GastosDialog } from '@/components/ServiciosDialogs';
import { formatMoney, ServiciosTable } from '@/components/ServiciosTable';
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
  const [dialog, setDialog] = useState<{ title: string; categoria: string | null } | null>(null);
  const [detailRow, setDetailRow] = useState<GastoServicioRow | null>(null);

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
          onClick={() => setDialog({ title: 'Pagos de servicios — Total', categoria: null })}
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
            onClick={t.pagos ? () => setDialog({ title: `Pagos de servicios — ${t.categoria.toUpperCase()}`, categoria: t.categoria }) : undefined}
          />
        ))}
      </CardsRow>

      <div className="bg-white rounded-[10px] shadow-sm p-5">
        <ServiciosTable rows={data.rows} onRowClick={setDetailRow} />
      </div>

      {dialog && (
        <GastosDialog
          title={dialog.title}
          rows={dialog.categoria ? data.rows.filter((r) => r.categoria === dialog.categoria) : data.rows}
          onClose={() => setDialog(null)}
          onRowClick={setDetailRow}
        />
      )}

      {detailRow && <GastoDetailDialog row={detailRow} onClose={() => setDetailRow(null)} />}
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

function IconServicio() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M12 2v6M12 22v-6M4.9 4.9l4.2 4.2M14.9 14.9l4.2 4.2M2 12h6M22 12h-6M4.9 19.1l4.2-4.2M14.9 9.1l4.2-4.2" />
    </svg>
  );
}
