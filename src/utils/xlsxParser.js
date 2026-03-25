/**
 * Browser-safe Excel parsing utility using ExcelJS.
 * Replaces the vulnerable SheetJS/xlsx package (ReDoS + Prototype Pollution).
 *
 * Provides a minimal API surface that mirrors the xlsx functions used in this
 * project so that consuming code changes are minimal:
 *   - readFromBase64(base64Xls)  → { SheetNames, Sheets }
 *   - sheetToJson(worksheet, options)  → array of rows/objects
 */

import ExcelJS from 'exceljs';

/**
 * Convert a base64-encoded data-URL or raw base64 string to a Uint8Array.
 * Handles the optional "data:<mime>;base64," prefix produced by FileReader.
 *
 * @param {string} base64Xls
 * @returns {Uint8Array}
 */
function base64ToUint8Array(base64Xls) {
  const base64Data = base64Xls.includes(',')
    ? base64Xls.slice(base64Xls.indexOf(',') + 1)
    : base64Xls;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Read an Excel workbook from a base64 string.
 * Returns a lightweight object that mirrors the xlsx workbook shape
 * ({ SheetNames, Sheets }) so consuming code needs minimal changes.
 *
 * @param {string} base64Xls  base64 data-URL or raw base64 of an .xlsx file
 * @returns {Promise<{ SheetNames: string[], Sheets: Record<string, ExcelJS.Worksheet> }>}
 */
export async function readFromBase64(base64Xls) {
  const bytes = base64ToUint8Array(base64Xls);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  return {
    SheetNames: workbook.worksheets.map((ws) => ws.name),
    Sheets: Object.fromEntries(workbook.worksheets.map((ws) => [ws.name, ws])),
  };
}

/**
 * Parse a row's cell values, unwrapping ExcelJS formula results and
 * normalising null/undefined to null.
 *
 * @param {ExcelJS.Row} row
 * @returns {Array}
 */
function rowValues(row) {
  // ExcelJS row.values is 1-based (index 0 is always undefined)
  return row.values.slice(1).map((v) => {
    if (v === null || v === undefined) return null;
    // Formula cell: { formula, result }
    if (typeof v === 'object' && 'result' in v) return v.result;
    return v;
  });
}

/**
 * Convert an ExcelJS worksheet to an array of row arrays or objects,
 * mirroring xlsx's utils.sheet_to_json behaviour.
 *
 * Supported options (subset used by this project):
 *   - header: 1   → return raw arrays; without it return objects keyed by
 *                   the first row values (same default as xlsx)
 *   - range: <n>  → skip the first n rows (0-based, same as xlsx)
 *
 * @param {ExcelJS.Worksheet} worksheet
 * @param {{ header?: number, range?: number }} [options]
 * @returns {Array}
 */
export function sheetToJson(worksheet, options = {}) {
  const skipRows = typeof options.range === 'number' ? options.range : 0;

  const allRows = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // xlsx range is 0-based row offset, ExcelJS rowNumber is 1-based
    if (rowNumber <= skipRows) return;
    allRows.push(rowValues(row));
  });

  if (options.header === 1) {
    return allRows;
  }

  // Default: use first row as object keys
  if (allRows.length === 0) return [];
  // Use `__EMPTY_N` for blank header cells — matches the xlsx library convention
  // so existing workflow data structures relying on this key name are unaffected.
  const headers = allRows[0].map((h, i) =>
    h !== null && h !== undefined ? String(h) : `__EMPTY_${i}`
  );
  return allRows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, i) => {
      const val = row[i];
      if (val !== undefined && val !== null) obj[header] = val;
    });
    return obj;
  });
}
