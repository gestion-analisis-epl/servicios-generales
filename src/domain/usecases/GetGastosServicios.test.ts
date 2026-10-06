import { describe, expect, it } from 'vitest';
import { createOffice } from '../entities/Office';
import type { GastoServicio } from '../entities/GastoServicio';
import {
  buildGastosRows,
  FICHA_ESTATUSES,
  filterGastosRows,
  getGastosCategorias,
  getGastosTotalsByCategoria,
  getGastosTotalsByOffice
} from './GetGastosServicios';

function gasto(fields: Partial<GastoServicio>): GastoServicio {
  return { folio: 'REC1', fecha: '', estatus: 'DEPOSITADO', codigo: '', ciudad: '', categoria: 'Limpieza', monto: 0, montoSolicitado: 0, ...fields };
}

const offices = [createOffice({ codigo: 'AGS-EPL', ciudad: 'AGUASCALIENTES', empresa: 'EPL' })];

describe('buildGastosRows', () => {
  it('links the expense to its office by code', () => {
    const [row] = buildGastosRows([gasto({ codigo: 'AGS-EPL', ciudad: 'AGUASCALIENTES', monto: 100 })], offices);
    expect(row.empresa).toBe('EPL');
  });

  it('keeps rows without office code, with empty empresa', () => {
    const [row] = buildGastosRows([gasto({ ciudad: 'TAMPICO', monto: 100 })], offices);
    expect(row).toMatchObject({ codigo: '', empresa: '', ciudad: 'TAMPICO', monto: 100 });
  });

  it('excludes the "Otros" category in any casing', () => {
    const rows = buildGastosRows([gasto({ categoria: 'Otros' }), gasto({ categoria: 'OTROS ' }), gasto({ categoria: 'CFE' })], offices);
    expect(rows.map((r) => r.categoria)).toEqual(['CFE']);
  });

  describe('Queretaro garrafones', () => {
    it('keeps 528 as garrafones and the remainder as limpieza', () => {
      const rows = buildGastosRows([gasto({ ciudad: 'QUERETARO', categoria: 'Garrafones', monto: 1528 })], offices);
      expect(rows.find((r) => r.categoria === 'Garrafones')?.monto).toBe(528);
      expect(rows.find((r) => r.categoria === 'Limpieza')?.monto).toBe(1000);
    });

    it('uses 660 for folio REC01000001658', () => {
      const rows = buildGastosRows([gasto({ folio: 'REC01000001658', ciudad: 'QUERETARO', categoria: 'Garrafones', monto: 1660 })], offices);
      expect(rows.find((r) => r.categoria === 'Garrafones')?.monto).toBe(660);
      expect(rows.find((r) => r.categoria === 'Limpieza')?.monto).toBe(1000);
    });

    it.each(['REC01000001496', 'REC01000001527'])('uses 520 for folio %s', (folio) => {
      const rows = buildGastosRows([gasto({ folio, ciudad: 'Querétaro', categoria: 'Garrafones', monto: 1520 })], offices);
      expect(rows.find((r) => r.categoria === 'Garrafones')?.monto).toBe(520);
      expect(rows.find((r) => r.categoria === 'Limpieza')?.monto).toBe(1000);
    });

    it('keeps everything as garrafones when the deposit is not above the garrafones amount', () => {
      const rows = buildGastosRows([gasto({ ciudad: 'QUERETARO', categoria: 'Garrafones', monto: 528 })], offices);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ categoria: 'Garrafones', monto: 528 });
    });

    it('splits the requested amount with the same rule, even when nothing is deposited yet', () => {
      const rows = buildGastosRows([gasto({ ciudad: 'QUERETARO', categoria: 'Garrafones', estatus: 'AUTORIZADA', monto: 0, montoSolicitado: 2128 })], offices);
      expect(rows.find((r) => r.categoria === 'Garrafones')).toMatchObject({ monto: 0, montoSolicitado: 528 });
      expect(rows.find((r) => r.categoria === 'Limpieza')).toMatchObject({ monto: 0, montoSolicitado: 1600 });
    });

    it('does not split garrafones of other cities', () => {
      const rows = buildGastosRows([gasto({ ciudad: 'TAMPICO', categoria: 'Garrafones', monto: 1528 })], offices);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ categoria: 'Garrafones', monto: 1528 });
    });

    it('does not touch limpieza rows in Queretaro', () => {
      const rows = buildGastosRows([gasto({ ciudad: 'QUERETARO', categoria: 'Limpieza', monto: 1528 })], offices);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ categoria: 'Limpieza', monto: 1528 });
    });
  });
});

describe('filterGastosRows / totals', () => {
  const rows = buildGastosRows(
    [
      gasto({ ciudad: 'TAMPICO', categoria: 'CFE', monto: 200, estatus: 'DEPOSITADO' }),
      gasto({ ciudad: 'LEÓN', categoria: 'Agua', monto: 50, estatus: 'Finalizada' }),
      gasto({ ciudad: 'LEÓN', categoria: 'Agua', monto: 70, estatus: 'RECHAZADA' })
    ],
    offices
  );

  it('filters by ciudad and categoria; undefined means no filter', () => {
    expect(filterGastosRows(rows, {})).toHaveLength(3);
    expect(filterGastosRows(rows, { ciudades: ['TAMPICO'] })).toHaveLength(1);
    expect(filterGastosRows(rows, { categorias: [] })).toHaveLength(0);
  });

  it('filters by estatus ignoring case', () => {
    expect(filterGastosRows(rows, { estatuses: ['RECHAZADA'] })).toHaveLength(1);
    expect(filterGastosRows(rows, { estatuses: FICHA_ESTATUSES })).toHaveLength(2);
    expect(filterGastosRows(rows, { estatuses: [] })).toHaveLength(0);
  });

  it('filters by date range on the ISO day, inclusive, and drops rows without a valid date when a range is set', () => {
    const dated = buildGastosRows(
      [
        gasto({ folio: 'A', fecha: '2026-10-01' }),
        gasto({ folio: 'B', fecha: '2026-10-05T10:00:00' }),
        gasto({ folio: 'C', fecha: '2026-11-01' }),
        gasto({ folio: 'D', fecha: '' })
      ],
      offices
    );
    const folios = (f: Parameters<typeof filterGastosRows>[1]) => filterGastosRows(dated, f).map((r) => r.folio).sort();
    expect(folios({ desde: '2026-10-01', hasta: '2026-10-05' })).toEqual(['A', 'B']);
    expect(folios({ desde: '2026-10-02' })).toEqual(['B', 'C']);
    expect(folios({ hasta: '2026-10-01' })).toEqual(['A']);
    expect(folios({})).toEqual(['A', 'B', 'C', 'D']);
  });

  it('lists known categories first and then any extra found in data', () => {
    const extra = buildGastosRows([gasto({ categoria: 'Vigilancia' })], offices);
    expect(getGastosCategorias(extra)).toEqual(['Limpieza', 'CFE', 'Agua', 'Garrafones', 'Vigilancia']);
  });

  it('totals per category, with zero for categories without data', () => {
    const totals = getGastosTotalsByCategoria(rows, getGastosCategorias(rows));
    expect(totals.find((t) => t.categoria === 'CFE')).toEqual({ categoria: 'CFE', total: 200, pagos: 1 });
    expect(totals.find((t) => t.categoria === 'Garrafones')).toEqual({ categoria: 'Garrafones', total: 0, pagos: 0 });
  });
});

describe('getGastosTotalsByOffice (ficha)', () => {
  it('groups by office code, only paid statuses, only categories with payments', () => {
    const rows = buildGastosRows(
      [
        gasto({ codigo: 'AGS-EPL', categoria: 'CFE', monto: 100, estatus: 'DEPOSITADO' }),
        gasto({ codigo: 'AGS-EPL', categoria: 'CFE', monto: 50, estatus: 'FINALIZADA' }),
        gasto({ codigo: 'AGS-EPL', categoria: 'Agua', monto: 999, estatus: 'RECHAZADA' }),
        gasto({ categoria: 'CFE', monto: 5, estatus: 'DEPOSITADO' })
      ],
      offices
    );
    const byOffice = getGastosTotalsByOffice(filterGastosRows(rows, { estatuses: FICHA_ESTATUSES }));
    expect(byOffice).toEqual({ 'AGS-EPL': [{ categoria: 'CFE', total: 150, pagos: 2 }] });
  });
});
