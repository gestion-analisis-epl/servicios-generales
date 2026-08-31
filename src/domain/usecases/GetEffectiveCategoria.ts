export function getEffectiveCategoria(categoria: string, categoriaCorregida: string): string {
  return (categoriaCorregida || categoria).trim();
}
