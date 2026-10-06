'use client';

import { useState } from 'react';
import { Badge } from '@/components/TicketDialogs';
import { formatDate, formatMoney, ServiciosTable } from '@/components/ServiciosTable';
import type { GastoServicioRow } from '@/domain/usecases/GetGastosServicios';

const ESTATUS_BADGE_CLASSES: Record<string, string> = {
  FINALIZADA: 'bg-emerald-100 text-emerald-700',
  DEPOSITADO: 'bg-emerald-100 text-emerald-700',
  AUTORIZADA: 'bg-sky-100 text-sky-700',
  'POR AUTORIZAR': 'bg-amber-100 text-amber-700',
  CAPTURADA: 'bg-slate-200 text-slate-700',
  RECHAZADA: 'bg-rose-100 text-rose-700',
  CANCELADO: 'bg-rose-100 text-rose-700'
};

const SEARCHABLE_FIELDS: (keyof GastoServicioRow)[] = [
  'folio', 'estatus', 'codigo', 'empresa', 'ciudad', 'categoria', 'solicitante', 'autorizador', 'observaciones'
];

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose} className="text-slate-400 hover:text-indigo-600 p-1 shrink-0" title="Cerrar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

export function GastosDialog({ title, rows, onClose, onRowClick }: {
  title: string;
  rows: GastoServicioRow[];
  onClose: () => void;
  onRowClick: (row: GastoServicioRow) => void;
}) {
  const [search, setSearch] = useState('');

  const term = search.trim().toUpperCase();
  const visible = term
    ? rows.filter((row) => SEARCHABLE_FIELDS.some((key) => String(row[key] ?? '').toUpperCase().includes(term)))
    : rows;

  const totalDepositado = visible.reduce((sum, r) => sum + r.monto, 0);
  const totalSolicitado = visible.reduce((sum, r) => sum + r.montoSolicitado, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900/55 backdrop-blur-[2px] dialog-overlay p-4" onClick={onClose}>
      <div
        className="bg-white rounded-[10px] shadow-2xl border border-slate-200 dialog-panel w-full max-w-[95vw] xl:max-w-[1400px] h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 rounded-t-[10px] gap-4">
          <div className="whitespace-nowrap">
            <h2 className="text-sm font-semibold">
              {title} <span className="text-slate-400 font-normal">({visible.length}{visible.length !== rows.length ? ` de ${rows.length}` : ''})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Depositado {formatMoney(totalDepositado)} · Solicitado {formatMoney(totalSolicitado)}
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por folio, código, ciudad, solicitante…"
            className="border border-slate-200 rounded-md px-3 py-1.5 text-sm w-full max-w-sm"
          />
          <CloseButton onClose={onClose} />
        </div>
        <div className="overflow-auto p-5 flex-1">
          <ServiciosTable rows={visible} onRowClick={onRowClick} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] uppercase text-slate-400 tracking-wide">{label}</span>
      <span className="text-sm">{children || '-'}</span>
    </div>
  );
}

export function GastoDetailDialog({ row, onClose }: { row: GastoServicioRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-900/55 backdrop-blur-[2px] dialog-overlay p-4" onClick={onClose}>
      <div className="bg-white rounded-[10px] shadow-2xl border border-slate-200 dialog-panel w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50 rounded-t-[10px]">
          <h2 className="text-sm font-semibold">Solicitud {row.folio}</h2>
          <CloseButton onClose={onClose} />
        </div>
        <div className="overflow-auto p-5">
          {row.dividido && (
            <p className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Pago de Querétaro repartido entre Garrafones y Limpieza. Los importes solicitado y depositado son la parte de {row.categoria.toUpperCase()}; aprobado, comprobado y saldo corresponden a la solicitud completa.
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Folio">{row.folio}</Field>
            <Field label="Estatus">
              <Badge text={row.estatus} className={ESTATUS_BADGE_CLASSES[row.estatus.toUpperCase()] || 'bg-slate-100 text-slate-600'} />
            </Field>
            <Field label="Fecha inicial">{formatDate(row.fecha)}</Field>
            <Field label="Fecha final">{formatDate(row.fechaFinal)}</Field>
            <Field label="Código">{row.codigo}</Field>
            <Field label="Empresa">{row.empresa}</Field>
            <Field label="Ciudad">{row.ciudad}</Field>
            <Field label="Categoría">{row.categoria.toUpperCase()}</Field>
            <Field label="Solicitante">{row.solicitante}</Field>
            <Field label="Autorizador">{row.autorizador}</Field>
            <Field label="Forma de pago">{row.formaPago}</Field>
          </div>

          <h3 className="text-[11px] uppercase text-slate-400 tracking-wide mt-5 mb-3">Importes</h3>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Solicitado">{formatMoney(row.montoSolicitado)}</Field>
            <Field label="Depositado">{formatMoney(row.monto)}</Field>
            <Field label="Aprobado">{formatMoney(row.montoAprobado)}</Field>
            <Field label="Comprobado">{formatMoney(row.montoComprobado)}</Field>
            <Field label="Saldo">{formatMoney(row.montoSaldo)}</Field>
          </div>

          {row.motivoRechazo && (
            <div className="flex flex-col gap-1 mt-4">
              <span className="text-[11px] uppercase text-slate-400 tracking-wide">Motivo de rechazo</span>
              <span className="text-sm">{row.motivoRechazo}</span>
            </div>
          )}

          <div className="flex flex-col gap-1 mt-4">
            <span className="text-[11px] uppercase text-slate-400 tracking-wide">Observaciones</span>
            <textarea readOnly value={row.observaciones} rows={5} className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-slate-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
