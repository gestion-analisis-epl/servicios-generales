'use client';

import { useRef, useState } from 'react';
import type { TicketDetailRow } from '@/domain/usecases/GetTicketsDetail';

export const ESTATUS_BADGE_CLASSES: Record<string, string> = {
  FINALIZADO: 'bg-emerald-100 text-emerald-700',
  'EN SEGUIMIENTO': 'bg-amber-100 text-amber-700'
};

const CATEGORIA_BADGE_PALETTE = [
  'bg-indigo-100 text-indigo-700',
  'bg-sky-100 text-sky-700',
  'bg-teal-100 text-teal-700',
  'bg-violet-100 text-violet-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-orange-100 text-orange-700',
  'bg-lime-100 text-lime-700',
  'bg-cyan-100 text-cyan-700',
  'bg-rose-100 text-rose-700',
  'bg-slate-200 text-slate-700'
];

export function categoriaBadgeClass(categoria: string): string {
  let hash = 0;
  for (let i = 0; i < categoria.length; i++) hash = (hash * 31 + categoria.charCodeAt(i)) >>> 0;
  return CATEGORIA_BADGE_PALETTE[hash % CATEGORIA_BADGE_PALETTE.length];
}

export function Badge({ text, className }: { text: string; className: string }) {
  if (!text) return null;
  return <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${className}`}>{text}</span>;
}

const TICKET_DIALOG_COLUMNS: { key: keyof TicketDetailRow; label: string }[] = [
  { key: 'folio', label: 'Folio' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'estatus', label: 'Estatus' },
  { key: 'solicita', label: 'Solicita' },
  { key: 'plaza', label: 'Plaza' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'duracion', label: 'Duración' }
];

const DEFAULT_COL_WIDTH = 150;
const MIN_COL_WIDTH = 70;

export function TicketsDialog({ title, rows, onClose, onRowClick }: { title: string; rows: TicketDetailRow[]; onClose: () => void; onRowClick: (row: TicketDetailRow) => void }) {
  const [sortKey, setSortKey] = useState<keyof TicketDetailRow>('folio');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [colWidths, setColWidths] = useState<Partial<Record<keyof TicketDetailRow, number>>>({});
  const resizing = useRef<{ key: keyof TicketDetailRow; startX: number; startWidth: number } | null>(null);

  function toggleSort(key: keyof TicketDetailRow) {
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

  function onResizeStart(e: React.MouseEvent, key: keyof TicketDetailRow) {
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
      <div
        className="bg-white rounded-[10px] shadow-lg w-full max-w-5xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold">{title} <span className="text-slate-400 font-normal">({rows.length})</span></h2>
          <button onClick={onClose} className="text-slate-400 hover:text-indigo-600 p-1" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-auto p-5">
          <table
            className="text-[13px] border-collapse table-fixed"
            style={{ width: TICKET_DIALOG_COLUMNS.reduce((sum, col) => sum + (colWidths[col.key] ?? DEFAULT_COL_WIDTH), 0) }}
          >
            <colgroup>
              {TICKET_DIALOG_COLUMNS.map((col) => (
                <col key={col.key} style={{ width: colWidths[col.key] ?? DEFAULT_COL_WIDTH }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {TICKET_DIALOG_COLUMNS.map((col) => (
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
                <tr key={`${row.folio}-${i}`} onClick={() => onRowClick(row)} className="cursor-pointer hover:bg-indigo-50/60">
                  {TICKET_DIALOG_COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 border-b border-slate-200 truncate">
                      {col.key === 'estatus' ? (
                        <Badge text={row.estatus} className={ESTATUS_BADGE_CLASSES[row.estatus] || 'bg-slate-100 text-slate-600'} />
                      ) : col.key === 'categoria' ? (
                        <Badge text={row.categoriaEfectiva} className={categoriaBadgeClass(row.categoriaEfectiva)} />
                      ) : (
                        row[col.key]
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={TICKET_DIALOG_COLUMNS.length} className="px-3 py-6 text-center text-slate-400">
                    Sin tickets para mostrar.
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

const TICKET_DETAIL_FIELDS: { key: keyof TicketDetailRow; label: string }[] = [
  { key: 'folio', label: 'Folio' },
  { key: 'departamento', label: 'Departamento' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'solicita', label: 'Solicita' },
  { key: 'plaza', label: 'Plaza' },
  { key: 'ultimoCambio', label: 'Último Cambio' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'estatus', label: 'Estatus' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'duracion', label: 'Duración' }
];

export function TicketDetailDialog({ row, onClose }: { row: TicketDetailRow; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-[10px] shadow-lg w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold">Ticket {row.folio}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-indigo-600 p-1" title="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-auto p-5">
          <div className="grid grid-cols-2 gap-4">
            {TICKET_DETAIL_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1">
                <span className="text-[11px] uppercase text-slate-400 tracking-wide">{field.label}</span>
                {field.key === 'estatus' ? (
                  <Badge text={row.estatus} className={`self-start ${ESTATUS_BADGE_CLASSES[row.estatus] || 'bg-slate-100 text-slate-600'}`} />
                ) : field.key === 'categoria' ? (
                  <Badge text={row.categoriaEfectiva} className={`self-start ${categoriaBadgeClass(row.categoriaEfectiva)}`} />
                ) : (
                  <span className="text-sm">{row[field.key] || '-'}</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <span className="text-[11px] uppercase text-slate-400 tracking-wide">Solicitud</span>
            <textarea readOnly value={row.solicitud} rows={5} className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-slate-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
