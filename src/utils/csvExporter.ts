import { MatchedItem, SatoRow } from '../types';

export function generaCsvAggiornato(
  rawCsvRows: SatoRow[],
  headers: string[],
  matchedList: MatchedItem[]
): Uint8Array {
  // Crea mappa di aggiornamento { rowIndex -> qta }
  const qtaMap = new Map<number, number>();
  for (const item of matchedList) {
    if (!item.escluso) {
      qtaMap.set(item.csvIndex, item.qtaOrdine);
    } else {
      qtaMap.set(item.csvIndex, 0);
    }
  }

  // Verifica o aggiungi header QTA
  let finalHeaders = [...headers];
  const qtaIndex = finalHeaders.findIndex(h => h.toUpperCase() === 'QTA');
  if (qtaIndex === -1) {
    finalHeaders.push('QTA');
  }

  const lines: string[] = [];

  // Intestazione con tutte le celle virgolettate
  lines.push(finalHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(';'));

  // Righe
  for (const row of rawCsvRows) {
    const qtaVal = qtaMap.has(row.rowIndex) 
      ? String(qtaMap.get(row.rowIndex)) 
      : (row.rawRecord['QTA'] || '0');

    const rowCells = finalHeaders.map(col => {
      if (col.toUpperCase() === 'QTA') {
        return `"${qtaVal.replace(/"/g, '""')}"`;
      }
      const val = row.rawRecord[col] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });

    lines.push(rowCells.join(';'));
  }

  const csvContent = lines.join('\r\n') + '\r\n';

  // Codifica in Windows-1252 / ISO-8859-1
  const bytes = new Uint8Array(csvContent.length);
  for (let i = 0; i < csvContent.length; i++) {
    const code = csvContent.charCodeAt(i);
    // Se è un carattere ASCII o esteso Latin-1
    if (code <= 255) {
      bytes[i] = code;
    } else {
      // Sostituzioni comuni per caratteri fuori latin1
      if (code === 8364) bytes[i] = 128; // €
      else if (code === 8216 || code === 8217) bytes[i] = 39; // '
      else if (code === 8220 || code === 8221) bytes[i] = 34; // "
      else bytes[i] = 63; // '?'
    }
  }

  return bytes;
}

export function downloadBlob(data: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
