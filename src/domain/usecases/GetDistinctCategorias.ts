const CATEGORIA_OTRO = 'OTRO';

export function getDistinctCategorias(tickets: { categoria: string }[]): string[] {
  const categorias = new Set(
    tickets.map((t) => t.categoria).filter((c) => c && c !== CATEGORIA_OTRO)
  );
  return Array.from(categorias).sort();
}
