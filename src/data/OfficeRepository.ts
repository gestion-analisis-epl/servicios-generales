import { getSheetRows } from './sheetsClient';
import { createOffice, Office } from '../domain/entities/Office';
import { parseBoolean, parseMoney, parseSheetDate } from './parsers';

const OFFICE_SHEET_NAME = 'Data';

export async function findAllOffices(): Promise<Office[]> {
  const rows = await getSheetRows(OFFICE_SHEET_NAME);
  return rows.map(mapRowToOffice);
}

function mapRowToOffice(row: Record<string, unknown>): Office {
  return createOffice({
    codigo: str(row['CÓDIGO']),
    ciudad: str(row['CIUDAD']),
    tipoOficina: str(row['TIPO DE OFICINA']),
    domicilio: str(row['DOMICILIO']),
    empresa: str(row['EMPRESA NOMBRE CORTO']),
    clasificacion: str(row['CLASIFICACION']),
    arrendador: str(row['SUB ARRENDADOR']),
    inicioVigencia: parseSheetDate(row['INICIO VIGENCIA']),
    finVigencia: parseSheetDate(row['FIN VIGENCIA']),
    estadoVigencia: str(row['ESTADO DE VIGENCIA']),
    montoRenta: parseMoney(row['MONTO DE RENTA CONTRATO']),
    totalMensual: parseMoney(row['TOTAL MENSUAL']),
    totalFactura: parseMoney(row['TOTAL FACTURA']),
    frecuenciaPago: str(row['FRECUENCIA DE PAGO']),
    fechaLimitePago: parseSheetDate(row['FECHA LÍMITE DE PAGO']),
    fechaUltimoPago: parseSheetDate(row['FECHA ULTIMO PAGO']),
    renovado: str(row['RENOVADO']),
    urlImagen: str(row['URL IMAGEN']),
    observaciones: str(row['OBSERVACIONES ESPECIFICAS/HISTORIAL DE INCIDENCIAS']),
    legal: parseBoolean(row['LEGAL'])
  });
}

function str(value: unknown): string {
  return value === undefined || value === null ? '' : String(value);
}
