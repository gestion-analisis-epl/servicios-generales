interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  minWidth?: number;
  fill?: boolean;
}

export function Panel({ title, children, className = '', minWidth = 320, fill = false }: PanelProps) {
  return (
    <div
      style={{ minWidth }}
      className={`rise-in bg-white rounded-[10px] border border-slate-200 shadow-sm p-5 flex-1 flex flex-col ${className}`}
    >
      <h2 className="text-sm font-semibold text-indigo-900 mb-4 pb-3 border-b border-slate-100">{title}</h2>
      <div className={fill ? 'flex-1 flex flex-col min-h-0' : 'flex-1'}>{children}</div>
    </div>
  );
}
