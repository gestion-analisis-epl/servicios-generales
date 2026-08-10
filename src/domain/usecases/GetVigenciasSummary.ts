import { Office, ESTADO_A_TIEMPO, ESTADO_PROXIMO, ESTADO_CRITICO, ESTADO_INDETERMINADO } from '../entities/Office';

export interface VigenciasSummary {
  vigentes: number;
  proximos: number;
  criticos: number;
  indeterminados: number;
}

export function getVigenciasSummary(offices: Office[]): VigenciasSummary {
  return {
    vigentes: offices.filter((o) => o.estadoVigencia === ESTADO_A_TIEMPO).length,
    proximos: offices.filter((o) => o.estadoVigencia === ESTADO_PROXIMO).length,
    criticos: offices.filter((o) => o.estadoVigencia === ESTADO_CRITICO).length,
    indeterminados: offices.filter((o) => o.estadoVigencia === ESTADO_INDETERMINADO).length
  };
}
