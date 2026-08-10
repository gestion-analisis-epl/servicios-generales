'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { NAV_ITEMS, NavItem } from '@/lib/navItems';

export function Navbar() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const matches = filterNavItems(query);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  function goTo(item: NavItem) {
    router.push(item.href);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, matches.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (matches[activeIndex]) goTo(matches[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="h-14 shrink-0 border-b border-slate-200 bg-white flex items-center px-6 sticky top-0 z-30">
      <div className="relative w-full max-w-md" ref={containerRef}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar sección o página…"
          className="w-full border border-slate-200 rounded-md pl-9 pr-3 py-1.5 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />

        {open && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-72 overflow-y-auto z-40">
            {matches.length === 0 ? (
              <div className="px-3 py-2.5 text-sm text-slate-400">Sin resultados.</div>
            ) : (
              matches.map((item, i) => (
                <button
                  key={item.href}
                  onClick={() => goTo(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left ${i === activeIndex ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-50'}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[16px] h-[16px] shrink-0">
                    {item.icon}
                  </svg>
                  {item.label}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function filterNavItems(query: string): NavItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return NAV_ITEMS;

  return NAV_ITEMS.filter(
    (item) => item.label.toLowerCase().includes(q) || item.keywords.some((k) => k.toLowerCase().includes(q))
  );
}
