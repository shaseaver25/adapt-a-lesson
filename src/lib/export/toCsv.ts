/**
 * CSV Export Utility
 * 
 * Generic CSV generator with proper escaping for special characters.
 */

/** Escape a value for CSV (handles quotes, commas, newlines) */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  
  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/** Convert an array of objects to CSV string */
export function toCSV<T>(
  data: T[],
  columns: { key: keyof T; header: string; transform?: (value: T[keyof T], row: T) => string }[]
): string {
  // Build header row
  const headerRow = columns.map(col => escapeCSVValue(col.header)).join(',');
  
  // Build data rows
  const dataRows = data.map(row => {
    return columns.map(col => {
      const rawValue = row[col.key];
      const value = col.transform ? col.transform(rawValue, row) : rawValue;
      return escapeCSVValue(value);
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\n');
}

/** Trigger a CSV download in the browser */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
