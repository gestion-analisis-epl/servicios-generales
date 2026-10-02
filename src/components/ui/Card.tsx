export type CardAccent = 'primary' | 'success' | 'warning' | 'danger' | 'orange' | 'muted';

const ACCENT_CLASSES: Record<CardAccent, string> = {
  primary: 'bg-indigo-600',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  orange: 'bg-orange-500',
  muted: 'bg-slate-400'
};

export function formatShare(part: number, total: number): string {
  if (!total) return '0% del total';
  return `${((part / total) * 100).toFixed(1)}% del total`;
}

export function ShareBar({ part, total, accent }: { part: number; total: number; accent: CardAccent }) {
  const pct = total ? Math.min((part / total) * 100, 100) : 0;
  return (
    <div className="h-1.5 mx-1 rounded-full bg-slate-100 overflow-hidden">
      <div className={`h-full rounded-full opacity-70 ${ACCENT_CLASSES[accent]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

interface CardProps {
  accent: CardAccent;
  icon: React.ReactNode;
  label: string;
  value: string | number;
  onClick?: () => void;
  chart?: React.ReactNode;
  subtitle?: string;
  compact?: boolean;
  index?: number;
}

export function Card({ accent, icon, label, value, onClick, chart, subtitle, compact = false, index = 0 }: CardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      style={{ '--i': index } as React.CSSProperties}
      className={`rise-in relative overflow-hidden bg-white rounded-[10px] border border-slate-200 shadow-sm px-5 py-4.5 flex-1 text-left flex flex-col transition hover:shadow-md hover:-translate-y-0.5 ${
        compact ? 'min-w-[160px]' : 'min-w-[180px]'
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <span className={`absolute inset-x-0 top-0 h-[3px] ${ACCENT_CLASSES[accent]}`} />
      <div className={`${compact ? 'w-8 h-8' : 'w-9 h-9'} rounded-lg mb-3 flex items-center justify-center text-white ${ACCENT_CLASSES[accent]}`}>{icon}</div>
      <h3 className="text-[11px] uppercase text-slate-400 mb-1.5 font-medium truncate">{label}</h3>
      <p className={`font-display font-semibold text-indigo-900 ${compact ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      {chart && <div className="mt-auto pt-2 -mx-1">{chart}</div>}
    </Tag>
  );
}

export function CardsRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-4 flex-wrap mb-6">{children}</div>;
}
