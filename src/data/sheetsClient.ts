import { google } from 'googleapis';

const SHEET_ROWS_CACHE_MS = 5 * 60_000;
const cache = new Map<string, { rows: Record<string, unknown>[]; expiresAt: number }>();

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  return google.sheets({ version: 'v4', auth });
}

export async function getSheetRows(sheetName: string): Promise<Record<string, unknown>[]> {
  const cached = cache.get(sheetName);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: sheetName
  });

  const values = response.data.values || [];
  const headers = values[0] || [];
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < values.length; i++) {
    const record: Record<string, unknown> = { __row: i + 1 };
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) record[header] = values[i][j];
    }
    rows.push(record);
  }

  cache.set(sheetName, { rows, expiresAt: Date.now() + SHEET_ROWS_CACHE_MS });
  return rows;
}

export function invalidateSheetCache(sheetName: string): void {
  cache.delete(sheetName);
}

function columnLetter(index: number): string {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

export async function updateSheetCell(sheetName: string, rowNumber: number, headerName: string, value: string): Promise<void> {
  const sheets = await getSheetsClient();
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `${sheetName}!1:1`
  });

  const headers = headerResponse.data.values?.[0] || [];
  const columnIndex = headers.indexOf(headerName);
  if (columnIndex === -1) {
    throw new Error(`La columna "${headerName}" no existe en la hoja "${sheetName}". Agrégala antes de guardar.`);
  }

  const range = `${sheetName}!${columnLetter(columnIndex)}${rowNumber}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
    valueInputOption: 'RAW',
    requestBody: { values: [[value]] }
  });

  invalidateSheetCache(sheetName);
}
