import { PdfRow } from '../types';

export function generaReportNonTrovatiTxt(unmatchedList: PdfRow[]): string {
  const totAlbi = unmatchedList.length;
  const totPezzi = unmatchedList.reduce((acc, it) => acc + (it.vendite || 0), 0);
  const totNetto = unmatchedList.reduce((acc, it) => acc + (it.venditeNette || 0), 0);

  const now = new Date();
  const dateStr = now.toLocaleDateString('it-IT') + ' ' + now.toLocaleTimeString('it-IT');

  const lines: string[] = [];
  lines.push('='.repeat(80));
  lines.push('REPORT FUMETTI VENDUTI NON PRESENTI NEL CATALOGO SATO / BONELLI');
  lines.push(`Data generazione: ${dateStr}`);
  lines.push(`Totale titoli non trovati: ${totAlbi}`);
  lines.push(`Totale copie vendute: ${totPezzi} (Nette: ${totNetto})`);
  lines.push('Nota: Questi articoli risultano venduti nel PDF ma non sono presenti nel file');
  lines.push("      d'ordine Sato (potrebbero essere albi d'epoca, esauriti o collaterali RCS).");
  lines.push('='.repeat(80));
  lines.push('');

  const padEnd = (str: string, len: number) => (str || '').padEnd(len).substring(0, len);

  const header = `${padEnd('COLLANA', 24)} | ${padEnd('NUM/COD', 10)} | ${padEnd('TAGLIA', 8)} | ${padEnd('VAR/COL', 12)} | ${padEnd('VENDITE', 8)} | ${padEnd('PREZZO', 8)} | TITOLO`;
  lines.push(header);
  lines.push('-'.repeat(110));

  const ordinati = [...unmatchedList].sort((a, b) => {
    const compColl = (a.collana || '').localeCompare(b.collana || '');
    if (compColl !== 0) return compColl;
    return (a.codice || '').localeCompare(b.codice || '');
  });

  for (const item of ordinati) {
    const coll = padEnd(item.collana || 'SENZA COLLANA', 24);
    const cod = padEnd(item.codice || '', 10);
    const taglia = padEnd(item.misura || '-', 8);
    const colore = padEnd(item.colore || '-', 12);
    const vend = padEnd(String(item.venditeNette ?? item.vendite ?? 0), 8);
    const prezzo = padEnd(item.prezzoVendita || '', 8);
    const tit = item.titolo || '';

    lines.push(`${coll} | ${cod} | ${taglia} | ${colore} | ${vend} | ${prezzo} | ${tit}`);
  }

  lines.push('-'.repeat(110));
  lines.push(`FINE REPORT - ${totAlbi} articoli elencati.`);
  lines.push('');

  return lines.join('\r\n');
}
