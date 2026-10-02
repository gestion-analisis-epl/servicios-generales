interface PageHeaderProps {
  title: string;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="h-16 -mx-6 -mt-6 mb-6 flex items-center justify-between px-6 border-b border-slate-200 bg-white">
      <div>
        {eyebrow}
        <h1 className="text-lg font-semibold text-indigo-900">{title}</h1>
      </div>
      {actions}
    </header>
  );
}
