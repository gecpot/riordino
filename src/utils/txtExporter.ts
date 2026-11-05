import { UnmatchedOrderItem } from '../types';

export function generaReportNonTrovatiTxt(unmatchedList: UnmatchedOrderItem[]): string {
  // Prende solo gli articoli spuntati come "ORDINA" con quantità > 0
  const attivi = unmatchedList.filter(it => !it.escluso && it.qtaOrdine > 0);
  const totAlbi = attivi.length;
  const totCopieOrdine = attivi.reduce((acc, it) => acc + it.qtaOrdine, 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT') + ' ' + now.toLocaleTimeString('it-IT');

  const lines: string[] = [];
  lines.push('='.repeat(95));
  lines.push('ORDINE ARTICOLI EXTRA / ARRETRATI (NON PRESENTI NEL CSV SATO)');
  lines.push(`Data generazione: ${dateStr}`);
  lines.push(`Totale titoli da ordinare: ${totAlbi}`);
  lines.push(`Totale copie da ordinare:  ${totCopieOrdine}`);
  lines.push('='.repeat(95));
  lines.push('');

  const padEnd = (str: string, len: number) => (str || '').padEnd(len).substring(0, len);

  const header = `${padEnd('CODICE', 14)} | ${padEnd('Q.TA ORD', 8)} | ${padEnd('TAGLIA', 7)} | ${padEnd('VAR/COL', 11)} | ${padEnd('PREZZO', 8)} | ${padEnd('COLLANA', 22)} | TITOLO`;
  lines.push(header);
  lines.push('-'.repeat(115));

  const ordinati = [...attivi].sort((a, b) => {
    const compCod = (a.codiceBonelli || '').localeCompare(b.codiceBonelli || '');
    if (compCod !== 0) return compCod;
    return (a.titolo || '').localeCompare(b.titolo || '');
  });

  for (const item of ordinati) {
    const codBonelli = padEnd(item.codiceBonelli || item.codice || '', 14);
    const qta = padEnd(String(item.qtaOrdine), 8);
    const taglia = padEnd(item.misura || '-', 7);
    const colore = padEnd(item.colore || '-', 11);
    const prezzo = padEnd(item.prezzoVendita ? `${item.prezzoVendita}` : '-', 8);
    const coll = padEnd(item.collana || 'SENZA COLLANA', 22);
    const tit = item.titolo || '';

    lines.push(`${codBonelli} | ${qta} | ${taglia} | ${colore} | ${prezzo} | ${coll} | ${tit}`);
  }

  lines.push('-'.repeat(115));
  lines.push(`TOTALE ARTICOLI: ${totAlbi}  -  TOTALE COPIE DA ORDINARE: ${totCopieOrdine}`);
  lines.push('');

  return lines.join('\r\n');
}

export function generaTestoCorpoMail(unmatchedList: UnmatchedOrderItem[]): string {
  const attivi = unmatchedList.filter(it => !it.escluso && it.qtaOrdine > 0);
  if (attivi.length === 0) return 'Nessun articolo selezionato per l\'ordine mail.';

  const totCopie = attivi.reduce((acc, it) => acc + it.qtaOrdine, 0);
  const lines: string[] = [];
  lines.push(`ORDINE FUMETTI / ARRETRATI (${attivi.length} titoli - ${totCopie} copie totali):`);
  lines.push('');

  const ordinati = [...attivi].sort((a, b) => (a.codiceBonelli || '').localeCompare(b.codiceBonelli || ''));

  for (const item of ordinati) {
    const extraInfo: string[] = [];
    if (item.misura && item.misura !== '-') extraInfo.push(`Taglia: ${item.misura}`);
    if (item.colore && item.colore !== '-') extraInfo.push(`Var: ${item.colore}`);
    const extraStr = extraInfo.length > 0 ? ` [${extraInfo.join(', ')}]` : '';

    lines.push(`- ${item.codiceBonelli.padEnd(10)} | Q.TA': ${String(item.qtaOrdine).padEnd(3)} | ${item.titolo}${extraStr} (${item.collana})`);
  }

  return lines.join('\r\n');
}

export function generaCsvOrdineMail(unmatchedList: UnmatchedOrderItem[]): Uint8Array {
  const attivi = unmatchedList.filter(it => !it.escluso && it.qtaOrdine > 0);
  const headers = ['CODICE', 'QTA_ORDINE', 'COLLANA', 'NUMERO', 'TITOLO', 'TAGLIA', 'COLORE', 'PREZZO', 'VENDUTI_SETTIMANA'];

  const lines: string[] = [];
  lines.push(headers.map(h => `"${h}"`).join(';'));

  const ordinati = [...attivi].sort((a, b) => (a.codiceBonelli || '').localeCompare(b.codiceBonelli || ''));

  for (const item of ordinati) {
    const row = [
      item.codiceBonelli || '',
      String(item.qtaOrdine),
      item.collana || '',
      item.codice || '',
      item.titolo || '',
      item.misura || '',
      item.colore || '',
      item.prezzoVendita || '',
      String(item.qtaVenduta)
    ];
    lines.push(row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'));
  }

  const csvContent = lines.join('\r\n') + '\r\n';
  const bytes = new Uint8Array(csvContent.length);
  for (let i = 0; i < csvContent.length; i++) {
    const code = csvContent.charCodeAt(i);
    if (code <= 255) bytes[i] = code;
    else if (code === 8364) bytes[i] = 128;
    else bytes[i] = 63;
  }
  return bytes;
}
