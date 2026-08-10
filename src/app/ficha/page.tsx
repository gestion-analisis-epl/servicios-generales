'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchJsonCached } from '@/lib/fetchCache';
import { TicketsDialog, TicketDetailDialog } from '@/components/TicketDialogs';
import type { Office } from '@/domain/entities/Office';
import type { TicketDetailRow } from '@/domain/usecases/GetTicketsDetail';
import type { CategoriaTotal } from '@/domain/usecases/GetTicketsByCategoria';

interface FichaData {
  offices: Office[];
  ticketsByOffice: Record<string, TicketDetailRow[]>;
  ticketCategoriaTotalsByOffice: Record<string, CategoriaTotal[]>;
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
      <header className="h-16 -mx-6 -mt-6 mb-6 flex items-center px-6 border-b border-slate-200 bg-white">
        <h1 className="text-lg font-bold">Ficha de Oficina</h1>
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

      <div className="bg-white rounded-lg shadow-sm px-4.5 py-3.5 mb-5 max-w-md">
        <label className="text-[11px] uppercase text-slate-400 tracking-wide block mb-1">Buscar por Código de Oficina</label>
        <OfficeSearchCombobox offices={data?.offices || []} onSelect={setSelected} />
      </div>

      {selected && data && (
        <OfficeFicha
          office={selected}
          tickets={data.ticketsByOffice[selected.codigo] || []}
          categorias={data.ticketCategoriaTotalsByOffice[selected.codigo] || []}
        />
      )}
    </div>
  );
}

function OfficeSearchCombobox({ offices, onSelect }: { offices: Office[]; onSelect: (office: Office) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return offices;
    return offices.filter((o) => o.codigo.toUpperCase().includes(q));
  }, [offices, query]);

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
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
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
  '🔴 CRÍTICO': 'bg-rose-50 text-rose-600',
  '🟡 PRÓXIMO': 'bg-amber-100 text-amber-700',
  '🟢 A TIEMPO': 'bg-emerald-100 text-emerald-700',
  '🟠 INDETERMINADO': 'bg-slate-100 text-slate-600'
};

function Badge({ text, className }: { text: string; className: string }) {
  if (!text) return null;
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>{text}</span>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[10px] shadow-sm p-5 flex-1 min-w-[300px]">
      <h2 className="text-sm font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase text-slate-400 tracking-wide">{label}</span>
      <span className="text-sm">{value || '-'}</span>
    </div>
  );
}

function OfficeFicha({ office, tickets, categorias }: { office: Office; tickets: TicketDetailRow[]; categorias: CategoriaTotal[] }) {
  const [ticketsDialog, setTicketsDialog] = useState<{ title: string; categoria: string | null } | null>(null);
  const [ticketDetailRow, setTicketDetailRow] = useState<TicketDetailRow | null>(null);

  return (
    <div>
      <div className="bg-white rounded-[10px] shadow-sm p-5 mb-4 flex items-center gap-4 flex-wrap">
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
        <Panel title="Ubicación">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ciudad" value={office.ciudad} />
            <Field label="Plaza" value={office.plaza} />
            <Field label="Tipo de Oficina" value={office.tipoOficina} />
            <Field label="Metros Cuadrados" value={office.metrosCuadrados} />
            <div className="col-span-2">
              <Field label="Domicilio" value={office.domicilio} />
            </div>
          </div>
        </Panel>

        <Panel title="Vigencia">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Inicio Vigencia" value={formatDate(office.inicioVigencia)} />
            <Field label="Fin Vigencia" value={formatDate(office.finVigencia)} />
            <Field label="Estado de Vigencia" value={<Badge text={office.estadoVigencia} className={ESTADO_BADGE_CLASSES[office.estadoVigencia] || 'bg-slate-100 text-slate-600'} />} />
            <Field label="Renovado" value={office.renovado} />
            <Field label="Arrendador" value={office.arrendador} />
          </div>
        </Panel>
      </div>

      <div className="flex gap-4 flex-wrap mb-4">
        <Panel title="Pagos">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monto Renta" value={formatMoney(office.montoRenta)} />
            <Field label="Total Mensual" value={formatMoney(office.totalMensual)} />
            <Field label="Total Factura" value={formatMoney(office.totalFactura)} />
            <Field label="Frecuencia de Pago" value={office.frecuenciaPago} />
            <Field label="Fecha Límite de Pago" value={formatDate(office.fechaLimitePago)} />
            <Field label="Fecha Último Pago" value={formatOrRaw(office.fechaUltimoPago)} />
          </div>
        </Panel>

        <Panel title="Observaciones">
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{office.observaciones || 'Sin observaciones.'}</p>
        </Panel>
      </div>

      <h2 className="text-[15px] font-semibold mb-3">Tickets</h2>
      {tickets.length === 0 ? (
        <p className="text-sm text-slate-400">Sin tickets asociados a esta oficina.</p>
      ) : (
        <div className="flex gap-4 flex-wrap">
          <TicketCard
            accent="primary"
            label="Total"
            value={tickets.length}
            onClick={() => setTicketsDialog({ title: `Tickets — ${office.codigo} — Total`, categoria: null })}
          />
          {categorias.map((c) => (
            <TicketCard
              key={c.categoria}
              accent="neutral"
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
          rows={ticketsDialog.categoria ? tickets.filter((t) => t.categoria === ticketsDialog.categoria) : tickets}
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

const TICKET_CARD_ACCENT_CLASSES: Record<string, string> = {
  primary: 'bg-indigo-500',
  neutral: 'bg-slate-400'
};

function TicketCard({ accent, label, value, onClick }: { accent: keyof typeof TICKET_CARD_ACCENT_CLASSES; label: string; value: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-[10px] shadow-sm px-5 py-4.5 flex-1 min-w-[160px] text-left cursor-pointer transition-shadow hover:shadow-md"
    >
      <div className={`w-8 h-8 rounded-lg mb-3 flex items-center justify-center text-white ${TICKET_CARD_ACCENT_CLASSES[accent]}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 className="text-xs uppercase text-slate-400 tracking-wide mb-1.5 truncate">{label}</h3>
      <p className="text-[18px] font-bold">{value}</p>
    </button>
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

function formatOrRaw(value: string): string {
  return formatDate(value);
}
