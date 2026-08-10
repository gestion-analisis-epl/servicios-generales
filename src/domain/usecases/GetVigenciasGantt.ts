import { Office } from '../entities/Office';

export interface VigenciaGanttRow {
  codigo: string;
  empresa: string;
  estado: string;
  inicioVigencia: string;
  finVigencia: string;
}

export function getVigenciasGantt(offices: Office[]): VigenciaGanttRow[] {
  return offices
    .filter((o) => o.inicioVigencia && o.finVigencia && !isNaN(new Date(o.inicioVigencia).getTime()) && !isNaN(new Date(o.finVigencia).getTime()))
    .map((o) => ({
      codigo: o.codigo,
      empresa: o.empresa,
      estado: o.estadoVigencia,
      inicioVigencia: o.inicioVigencia,
      finVigencia: o.finVigencia
    }))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
}
