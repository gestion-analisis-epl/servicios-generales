export const GASTO_CATEGORIAS = ['Limpieza', 'CFE', 'Agua', 'Garrafones'] as const;

export interface GastoServicio {
  folio: string;
  fecha: string;
  estatus: string;
  codigo: string;
  ciudad: string;
  categoria: string;
  monto: number;
  montoSolicitado: number;
  montoAprobado: number;
  montoComprobado: number;
  montoSaldo: number;
  fechaFinal: string;
  solicitante: string;
  autorizador: string;
  formaPago: string;
  observaciones: string;
  motivoRechazo: string;
}
