export interface Ticket {
  folio: string;
  empresa: string;
  departamento: string;
  tipo: string;
  categoria: string;
  estatus: string;
  solicita: string;
  solicitud: string;
  asignadoA: string;
  plaza: string;
  plazaNombreArrendamientos: string;
  fechaYHora: string;
  ultimoCambio: string;
  duracion: string;
  tiempoEfectivoSegundos: string | number;
}

export function createTicket(fields: Partial<Ticket>): Ticket {
  return {
    folio: orEmpty(fields.folio),
    empresa: orEmpty(fields.empresa),
    departamento: orEmpty(fields.departamento),
    tipo: orEmpty(fields.tipo),
    categoria: orEmpty(fields.categoria),
    estatus: orEmpty(fields.estatus),
    solicita: orEmpty(fields.solicita),
    solicitud: orEmpty(fields.solicitud),
    asignadoA: orEmpty(fields.asignadoA),
    plaza: orEmpty(fields.plaza),
    plazaNombreArrendamientos: orEmpty(fields.plazaNombreArrendamientos),
    fechaYHora: orEmpty(fields.fechaYHora),
    ultimoCambio: orEmpty(fields.ultimoCambio),
    duracion: orEmpty(fields.duracion),
    tiempoEfectivoSegundos: fields.tiempoEfectivoSegundos ?? ''
  };
}

function orEmpty(value: string | undefined): string {
  return value === undefined ? '' : value;
}
