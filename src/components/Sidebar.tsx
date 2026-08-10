'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV_ITEMS } from '@/lib/navItems';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`shrink-0 bg-white border-r border-slate-200 py-4 transition-all ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`flex items-center px-5 pb-5 gap-2 ${collapsed ? 'justify-center px-0' : 'justify-between'}`}>
        {!collapsed && <span className="font-bold text-base leading-tight min-w-0">Oficinas &amp; Arrendamientos</span>}
        <button onClick={() => setCollapsed((c) => !c)} className="text-slate-400 hover:text-indigo-600 p-1 shrink-0" title="Contraer/expandir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-[18px] h-[18px] transition-transform ${collapsed ? 'rotate-180' : ''}`}>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
      <nav>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm border-l-[3px] whitespace-nowrap ${
                collapsed ? 'justify-center px-0' : ''
              } ${active ? 'text-indigo-600 border-indigo-600 bg-indigo-50' : 'text-slate-500 border-transparent hover:text-indigo-600'}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-[18px] h-[18px] shrink-0">
                {item.icon}
              </svg>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
