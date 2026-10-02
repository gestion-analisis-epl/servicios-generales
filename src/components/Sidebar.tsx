'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV_ITEMS } from '@/lib/navItems';

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`shrink-0 bg-white border-r border-slate-200 py-4 transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
      <div className={`flex items-center px-5 pb-5 gap-2 ${collapsed ? 'flex-col px-0' : 'justify-between'}`}>
        <Image
          src="/grupo-epl.png"
          alt="Grupo EPL"
          width={606}
          height={367}
          priority
          className={collapsed ? 'w-10 h-auto' : 'w-28 h-auto'}
        />
        <button onClick={() => setCollapsed((c) => !c)} className="text-slate-400 hover:text-indigo-600 p-1 shrink-0" title="Contraer/expandir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={`w-[18px] h-[18px] transition-transform ${collapsed ? 'rotate-180' : ''}`}>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
      </div>
      {!collapsed && (
        <p className="px-5 pb-3 text-[10px] uppercase tracking-[0.18em] text-slate-400 font-medium">Oficinas &amp; Arrendamientos</p>
      )}
      <nav>
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              title={collapsed ? item.label : undefined}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm border-l-[3px] whitespace-nowrap ${
                collapsed ? 'justify-center px-0' : ''
              } ${active ? 'text-indigo-700 font-semibold border-indigo-600 bg-indigo-50' : 'text-slate-500 border-transparent hover:text-indigo-600 hover:bg-slate-50'}`}
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
