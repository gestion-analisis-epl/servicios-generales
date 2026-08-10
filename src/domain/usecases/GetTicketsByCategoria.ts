export interface CategoriaTotal {
  categoria: string;
  total: number;
}

export function getTicketsByCategoria(tickets: { categoria: string }[]): CategoriaTotal[] {
  const totals: Record<string, number> = {};

  tickets.forEach((t) => {
    const key = t.categoria || 'SIN CATEGORÍA';
    totals[key] = (totals[key] || 0) + 1;
  });

  return Object.entries(totals)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total);
}
