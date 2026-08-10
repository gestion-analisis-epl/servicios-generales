export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  keywords: string[];
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: '/resumen',
    label: 'Resumen',
    icon: <path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z" />,
    keywords: ['dashboard', 'oficinas', 'general', 'renta mensual', 'próximos a vencer']
  },
  {
    href: '/tickets',
    label: 'Tickets',
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    keywords: ['soporte', 'categoría', 'estatus', 'plaza', 'finalizados', 'en seguimiento']
  },
  {
    href: '/pagos',
    label: 'Pagos',
    icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
    keywords: ['calendario', 'factura', 'vencimiento', 'fecha límite', 'total mensual']
  },
  {
    href: '/vigencias',
    label: 'Vigencias',
    icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>,
    keywords: ['gantt', 'vencido', 'crítico', 'próximo', 'a tiempo', 'indeterminado']
  },
  {
    href: '/contratos',
    label: 'Contratos',
    icon: <><path d="M7 3h8l4 4v14H7z" /><path d="M14 3v5h5" /></>,
    keywords: ['tabla', 'arrendador', 'renta', 'renovado', 'observaciones']
  },
  {
    href: '/ficha',
    label: 'Ficha de Oficina',
    icon: <><path d="M3 7l9-4 9 4-9 4-9-4z" /><path d="M3 7v10l9 4 9-4V7" /></>,
    keywords: ['buscar oficina', 'código', 'domicilio', 'ubicación']
  }
];
