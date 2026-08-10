import { Office } from '../entities/Office';

export interface OfficeFilters {
  ciudades?: string[];
  oficinas?: string[];
  estados?: string[];
}

export function filterOffices(offices: Office[], filters: OfficeFilters = {}): Office[] {
  return offices.filter((o) => {
    if (filters.ciudades !== undefined && !filters.ciudades.includes(o.ciudad)) return false;
    if (filters.oficinas !== undefined && !filters.oficinas.includes(o.codigo)) return false;
    if (filters.estados !== undefined && !filters.estados.includes(o.estadoVigencia)) return false;
    return true;
  });
}
