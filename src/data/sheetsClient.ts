import { google } from 'googleapis';

const SHEET_ROWS_CACHE_MS = 5 * 60_000;
const cache = new Map<string, { rows: Record<string, unknown>[]; expiresAt: number }>();

async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
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
    const record: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) record[header] = values[i][j];
    }
    rows.push(record);
  }

  cache.set(sheetName, { rows, expiresAt: Date.now() + SHEET_ROWS_CACHE_MS });
  return rows;
}
