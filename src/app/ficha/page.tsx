'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchJsonCached } from '@/lib/fetchCache';
import { TicketsDialog, TicketDetailDialog } from '@/components/TicketDialogs';
import type { Office } from '@/domain/entities/Office';
import type { TicketDetailRow } from '@/domain/usecases/GetTicketsDetail';
import type { CategoriaTotal } from '@/domain/usecases/GetTicketsByCategoria';
import type { GastoCategoriaTotal } from '@/domain/usecases/GetGastosServicios';
import { Card, ErrorAlert, LoadingBanner, PageHeader, Panel } from '@/components/ui';

interface FichaData {
  offices: Office[];
  ticketsByOffice: Record<string, TicketDetailRow[]>;
  ticketCategoriaTotalsByOffice: Record<string, CategoriaTotal[]>;
  gastosByOffice: Record<string, GastoCategoriaTotal[]>;
}

export default function FichaPage() {
  const [data, setData] = useState<FichaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Office | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchJsonCached<{ data: FichaData }>('/api/ficha', 60_000);
        if (cancelled) return;
        setData(result.data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6">
      <PageHeader title="Ficha de Oficina" />

      {error && <ErrorAlert message={error} />}
      {loading && <LoadingBanner />}

      <div className="bg-white rounded-lg shadow-sm px-4.5 py-3.5 mb-5 max-w-md">
        <label className="text-[11px] uppercase text-slate-400 tracking-wide block mb-1">Buscar por Código de Oficina</label>
        <OfficeSearchCombobox offices={data?.offices || []} onSelect={setSelected} />
      </div>

      {selected && data && (
        <OfficeFicha
          office={selected}
          tickets={data.ticketsByOffice[selected.codigo] || []}
          categorias={data.ticketCategoriaTotalsByOffice[selected.codigo] || []}
          gastos={data.gastosByOffice[selected.codigo.trim()] || []}
        />
      )}
    </div>
  );
}

function OfficeSearchCombobox({ offices, onSelect }: { offices: Office[]; onSelect: (office: Office) => void }) {
  const [query, setQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!typing || !q) return offices;
    return offices.filter((o) => o.codigo.toUpperCase().includes(q));
  }, [offices, query, typing]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect(office: Office) {
    onSelect(office);
    setQuery(office.codigo);
    setTyping(false);
    setOpen(false);
  }

  function openDropdown() {
    setOpen(true);
    setTyping(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setTyping(true); setOpen(true); }}
        onFocus={(e) => { openDropdown(); e.target.select(); }}
        onClick={openDropdown}
        placeholder="Ej. AGS-EPL"
        className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"
      />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg">
          {matches.length === 0 ? (
            <div className="px-3 py-2 text-sm text-slate-400">Sin resultados.</div>
          ) : (
            matches.map((o) => (
              <button
                key={o.codigo}
                onClick={() => handleSelect(o)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex items-center justify-between gap-2"
              >
                <span className="font-semibold">{o.codigo}</span>
                <span className="text-slate-400 text-xs truncate">{o.empresa}</span>
              </button>
            ))
          )}
        </div>
      )}
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase text-slate-400 tracking-wide">{label}</span>
      <span className="text-sm">{value || '-'}</span>
    </div>
  );
}

function OfficeFicha({ office, tickets, categorias, gastos }: {
  office: Office;
  tickets: TicketDetailRow[];
  categorias: CategoriaTotal[];
  gastos: GastoCategoriaTotal[];
}) {
  const [ticketsDialog, setTicketsDialog] = useState<{ title: string; categoria: string | null } | null>(null);
  const [ticketDetailRow, setTicketDetailRow] = useState<TicketDetailRow | null>(null);

  const tipoCodigo = getTipoCodigoLabel(office.codigo);

  return (
    <div>
      <div className="relative bg-white rounded-[10px] shadow-sm p-5 mb-4 flex items-center gap-4 flex-wrap">
        {tipoCodigo && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500">
            {tipoCodigo}
          </span>
        )}
        {office.urlImagen ? (
          <img src={office.urlImagen} alt={office.codigo} className="w-24 h-24 rounded-lg object-cover border border-slate-200" />
        ) : (
          <div className="w-24 h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sin imagen</div>
        )}
        <div className="flex-1 min-w-[220px]">
          <h2 className="text-xl font-bold">{office.codigo}</h2>
          <p className="text-sm text-slate-500">{office.empresa}</p>
        </div>
        <Badge text={office.estadoVigencia} className={ESTADO_BADGE_CLASSES[office.estadoVigencia] || 'bg-slate-100 text-slate-600'} />
      </div>

      <div className="flex gap-4 flex-wrap mb-4">
        <Panel minWidth={300} title="Ubicación">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ciudad" value={office.ciudad} />
            <Field label="Tipo de Oficina" value={office.tipoOficina} />
            <Field label="Clasificación" value={office.clasificacion} />
            <div className="col-span-2">
              <Field label="Domicilio" value={office.domicilio} />
            </div>
          </div>
        </Panel>

        <Panel minWidth={300} title="Vigencia">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inicio Vigencia" value={formatDate(office.inicioVigencia)} />
            <Field label="Fin Vigencia" value={formatDate(office.finVigencia)} />
            <Field label="Estado de Vigencia" value={<Badge text={office.estadoVigencia} className={ESTADO_BADGE_CLASSES[office.estadoVigencia] || 'bg-slate-100 text-slate-600'} />} />
            <Field label="Legal" value={<Badge text={office.legal ? 'Sí' : 'No'} className={office.legal ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} />} />
            <Field label="Renovado" value={office.renovado} />
            <Field label="Arrendador" value={office.arrendador} />
          </div>
        </Panel>
      </div>

      <div className="flex gap-4 flex-wrap mb-4">
        <Panel minWidth={300} title="Mapa">
          {office.domicilio ? (
            <iframe
              title={`Mapa — ${office.codigo}`}
              className="w-full h-72 rounded-lg border border-slate-200"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(office.domicilio)}&output=embed`}
            />
          ) : (
            <p className="text-sm text-slate-400">Sin dirección registrada para esta oficina.</p>
          )}
        </Panel>
      </div>

      <div className="flex gap-4 flex-wrap mb-4">
        <Panel minWidth={300} title="Pagos">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto Renta" value={formatMoney(office.montoRenta)} />
            <Field label="Total Mensual" value={formatMoney(office.totalMensual)} />
            <Field label="Total Factura" value={formatMoney(office.totalFactura)} />
            <Field label="Frecuencia de Pago" value={office.frecuenciaPago} />
            <Field label="Fecha Límite de Pago" value={formatDate(office.fechaLimitePago)} />
            <Field label="Fecha Último Pago" value={formatOrRaw(office.fechaUltimoPago)} />
          </div>
        </Panel>

        <Panel minWidth={300} title="Observaciones">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{office.observaciones || 'Sin observaciones.'}</p>
        </Panel>
      </div>

      <div className="flex gap-4 flex-wrap mb-4">
        <Panel minWidth={300} title="Gastos">
          {gastos.length === 0 ? (
            <p className="text-sm text-slate-400">Sin gastos depositados para esta oficina.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {gastos.map((g) => (
                <Field key={g.categoria} label={g.categoria} value={formatMoney(g.total)} />
              ))}
            </div>
          )}
        </Panel>
      </div>

      <h2 className="text-[15px] font-semibold mb-3">Tickets</h2>
      {tickets.length === 0 ? (
        <p className="text-sm text-slate-400">Sin tickets asociados a esta oficina.</p>
      ) : (
        <div className="flex gap-4 flex-wrap">
          <Card
            compact
            icon={<IconTicket />}
            accent="primary"
            label="Total"
            value={tickets.length}
            onClick={() => setTicketsDialog({ title: `Tickets — ${office.codigo} — Total`, categoria: null })}
          />
          {categorias.map((c) => (
            <Card
              compact
              icon={<IconTicket />}
              key={c.categoria}
              accent="muted"
              label={c.categoria}
              value={c.total}
              onClick={() => setTicketsDialog({ title: `Tickets — ${office.codigo} — ${c.categoria}`, categoria: c.categoria })}
            />
          ))}
        </div>
      )}

      {ticketsDialog && (
        <TicketsDialog
          title={ticketsDialog.title}
          rows={ticketsDialog.categoria ? tickets.filter((t) => t.categoriaEfectiva === ticketsDialog.categoria) : tickets}
          onClose={() => setTicketsDialog(null)}
          onRowClick={setTicketDetailRow}
        />
      )}

      {ticketDetailRow && (
        <TicketDetailDialog row={ticketDetailRow} onClose={() => setTicketDetailRow(null)} />
      )}
    </div>
  );
}

function IconTicket() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function getTipoCodigoLabel(codigo: string): string | null {
  if (codigo.includes('01-OFICINA')) return 'OFICINA';
  if (codigo.includes('02-MTTO')) return 'MANTENIMIENTO';
  return null;
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

function formatOrRaw(value: string): string {
  return formatDate(value);
}
