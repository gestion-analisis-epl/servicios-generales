import { Office, ESTADO_CRITICO, ESTADO_PROXIMO } from '../entities/Office';

export interface GanttRow {
  codigo: string;
  empresa: string;
  estado: string;
  inicioVigencia: string;
  finVigencia: string;
}

const GANTT_ESTADO_PRIORITY = [ESTADO_CRITICO, ESTADO_PROXIMO];

export function getUpcomingExpirationsGantt(offices: Office[]): GanttRow[] {
  return offices
    .filter((o) => GANTT_ESTADO_PRIORITY.includes(o.estadoVigencia))
    .map((o) => ({
      codigo: o.codigo,
      empresa: o.empresa,
      estado: o.estadoVigencia,
      inicioVigencia: o.inicioVigencia,
      finVigencia: o.finVigencia
    }))
    .sort((a, b) => {
      const priorityDiff = GANTT_ESTADO_PRIORITY.indexOf(a.estado) - GANTT_ESTADO_PRIORITY.indexOf(b.estado);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.finVigencia).getTime() - new Date(b.finVigencia).getTime();
    });
}
