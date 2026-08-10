'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface MultiSelectFilterProps {
  label: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  compact?: boolean;
}

export function MultiSelectFilter({ label, options, value, onChange, compact = false }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  function toggle(option: string) {
    if (value.includes(option)) onChange(value.filter((v) => v !== option));
    else onChange([...value, option]);
  }

  const summary = value.length === 0 ? 'Todas' : value.length === 1 ? value[0] : `${value.length} seleccionadas`;

  if (compact) {
    return <CompactFilter options={options} value={value} onChange={onChange} toggle={toggle} />;
  }

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <label className="text-[11px] uppercase text-slate-400 tracking-wide">{label}</label>
      <button
        onClick={() => setOpen((o) => !o)}
        className="border border-slate-200 rounded-md px-2 py-1.5 text-sm bg-white text-left min-w-[160px] flex items-center justify-between gap-2"
      >
        <span className="truncate">{summary}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 shrink-0 text-slate-400">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[200px] max-h-64 overflow-y-auto">
          <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100">
            <button onClick={() => onChange(options)} className="text-xs border border-slate-200 rounded-md px-2.5 py-1">Todas</button>
            <button onClick={() => onChange([])} className="text-xs border border-slate-200 rounded-md px-2.5 py-1">Ninguna</button>
          </div>
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 px-0.5 py-1 text-sm whitespace-nowrap cursor-pointer">
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function CompactFilter({
  options,
  value,
  onChange,
  toggle
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  toggle: (option: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const PANEL_MAX_HEIGHT = 280;
  const PANEL_MIN_WIDTH = 200;
  const VIEWPORT_MARGIN = 8;

  function updatePosition() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const fitsBelow = rect.bottom + VIEWPORT_MARGIN + PANEL_MAX_HEIGHT <= window.innerHeight;
    const top = fitsBelow
      ? rect.bottom + 4
      : Math.max(VIEWPORT_MARGIN, rect.top - PANEL_MAX_HEIGHT - 4);

    const right = Math.max(VIEWPORT_MARGIN, Math.min(window.innerWidth - rect.right, window.innerWidth - PANEL_MIN_WIDTH - VIEWPORT_MARGIN));

    setPos((prev) => (prev && prev.top === top && prev.right === right ? prev : { top, right }));
  }

  function openPanel() {
    updatePosition();
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    function onOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onReposition() {
      updatePosition();
    }

    document.addEventListener('mousedown', onOutsideClick);
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`p-1 rounded shrink-0 ${value.length ? 'text-indigo-600' : 'text-slate-400'} hover:text-indigo-600`}
        title="Filtrar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path d="M4 4h16l-6 8v6l-4 2v-8z" />
        </svg>
      </button>
      {open && pos && typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={panelRef}
            style={{ position: 'fixed', top: pos.top, right: pos.right }}
            className="z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[200px] max-h-64 overflow-y-auto normal-case font-normal text-slate-700"
          >
            <div className="flex gap-2 mb-2 pb-2 border-b border-slate-100">
              <button onClick={() => onChange(options)} className="text-xs border border-slate-200 rounded-md px-2.5 py-1">Todas</button>
              <button onClick={() => onChange([])} className="text-xs border border-slate-200 rounded-md px-2.5 py-1">Ninguna</button>
            </div>
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 px-0.5 py-1 text-sm whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
                {opt || '(vacío)'}
              </label>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
