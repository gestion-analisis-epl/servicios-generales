const CATEGORIA_OTRO = 'OTRO';

export function getDistinctCategorias(tickets: { categoria: string }[], catalog: string[] = []): string[] {
  const categorias = new Set(
    [...tickets.map((t) => t.categoria.trim()), ...catalog].filter((c) => c && c !== CATEGORIA_OTRO)
  );
  return Array.from(categorias).sort();
}
