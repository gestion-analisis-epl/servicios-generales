import { getSheetRows } from './sheetsClient';

const CATALOGOS_SHEET_NAME = 'Catalogos';
const CATEGORIAS_HEADER = 'Categorías';

export async function findCategoriaCatalog(): Promise<string[]> {
  const rows = await getSheetRows(CATALOGOS_SHEET_NAME);
  const categorias = rows
    .map((r) => String(r[CATEGORIAS_HEADER] ?? '').trim())
    .filter((c) => c.length > 0);

  return Array.from(new Set(categorias));
}
