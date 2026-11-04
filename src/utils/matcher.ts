import { PdfRow, SatoRow, MatchedItem, MatchResult } from '../types';

export function normalizzaTesto(testo: string | null | undefined): string {
  if (!testo) return '';
  return String(testo)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function estraiNumeroAlbo(codiceOUscita: string | null | undefined): string {
  if (!codiceOUscita) return '';
  const m = String(codiceOUscita).trim().match(/(\d+)$/);
  if (m) {
    return m[1].replace(/^0+/, '') || '0';
  }
  return '';
}

export function normalizzaPrezzo(pStr: string | null | undefined): number | null {
  if (!pStr) return null;
  const cleaned = String(pStr).replace(',', '.').trim();
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

function padZero(numStr: string, length: number): string {
  const digits = numStr.replace(/\D/g, '');
  if (!digits) return numStr;
  return digits.padStart(length, '0');
}

export interface PreparedSatoRow extends SatoRow {
  normArticolo: string;
  numUscita: string;
  normColore: string;
  normTaglia: string;
  numPrezzo: number | null;
}

export function prepareSatoRows(rawRows: SatoRow[]): PreparedSatoRow[] {
  return rawRows.map(row => ({
    ...row,
    normArticolo: normalizzaTesto(row.articolo),
    numUscita: estraiNumeroAlbo(row.uscita),
    normColore: normalizzaTesto(row.colore),
    normTaglia: normalizzaTesto(row.taglia),
    numPrezzo: normalizzaPrezzo(row.prezzo)
  }));
}

export function abbinaArticoli(
  articoliPdf: PdfRow[],
  satoRows: PreparedSatoRow[],
  mappaCollane: Record<string, string>
): MatchResult {
  const matchedMap = new Map<number, MatchedItem>();
  const unmatchedList: PdfRow[] = [];
  const paniniList: PdfRow[] = [];

  for (const item of articoliPdf) {
    if (item.isPanini) {
      paniniList.push(item);
      continue;
    }

    const titoloPdf = item.titolo;
    const codicePdf = item.codice;
    const collanaPdf = item.collana.trim();
    const colorePdf = item.colore;
    const misuraPdf = item.misura;
    const qtaVenduta = item.venditeNette;
    const prezzoPdf = normalizzaPrezzo(item.prezzoVendita);

    const normTit = normalizzaTesto(titoloPdf);
    const numCod = estraiNumeroAlbo(codicePdf);
    const normCol = normalizzaTesto(colorePdf);
    const normMis = normalizzaTesto(misuraPdf);

    let bestIdx: number | null = null;
    const prefissoSato = mappaCollane[collanaPdf.toUpperCase()] || null;

    // =========================================================================
    // PASSO 1: Match con Prefisso Collana Mappato + Numero Albo + Verifica Titolo
    // =========================================================================
    if (prefissoSato && codicePdf) {
      const padOptions = [
        codicePdf,
        padZero(codicePdf, 3),
        padZero(codicePdf, 4),
        padZero(numCod, 3),
        numCod
      ];
      const uniquePads = Array.from(new Set(padOptions));

      for (const pad of uniquePads) {
        const candidatoUscita = `${prefissoSato}-${pad}`;
        const subUscita = satoRows.filter(r => r.uscita === candidatoUscita);

        if (subUscita.length === 1) {
          const row = subUscita[0];
          if (!normTit || normTit.includes(row.normArticolo) || row.normArticolo.includes(normTit)) {
            bestIdx = row.rowIndex;
            break;
          }
        } else if (subUscita.length > 1) {
          let subVal = subUscita.filter(
            r => !normTit || normTit.includes(r.normArticolo) || r.normArticolo.includes(normTit)
          );
          if (subVal.length === 0) {
            subVal = subUscita;
          }

          if (normMis) {
            const subT = subVal.filter(r => r.normTaglia === normMis);
            if (subT.length === 1) {
              bestIdx = subT[0].rowIndex;
            } else if (subT.length > 1) {
              subVal = subT;
            }
          }

          if (bestIdx === null && normCol) {
            const subC = subVal.filter(r => r.normColore === normCol);
            if (subC.length === 1) {
              bestIdx = subC[0].rowIndex;
            } else if (subC.length > 1) {
              subVal = subC;
            }
          }

          if (bestIdx === null && subVal.length > 0) {
            bestIdx = subVal[0].rowIndex;
          }

          if (bestIdx !== null) {
            break;
          }
        }
      }
    }

    // =========================================================================
    // PASSO 2: Match per Titolo Normalizzato Esatto (con filtri di spareggio)
    // =========================================================================
    if (bestIdx === null && normTit) {
      let candidati = satoRows.filter(r => r.normArticolo === normTit);

      if (candidati.length === 1) {
        bestIdx = candidati[0].rowIndex;
      } else if (candidati.length > 1) {
        // Spareggio per prefisso collana se noto
        if (prefissoSato) {
          const subP = candidati.filter(r => r.uscita.startsWith(prefissoSato));
          if (subP.length === 1) {
            bestIdx = subP[0].rowIndex;
          } else if (subP.length > 1) {
            candidati = subP;
          }
        }

        // Spareggio per numero albo
        if (bestIdx === null && numCod) {
          const subN = candidati.filter(r => r.numUscita === numCod);
          if (subN.length === 1) {
            bestIdx = subN[0].rowIndex;
          } else if (subN.length > 1) {
            candidati = subN;
          }
        }

        // Spareggio per colore/variante
        if (bestIdx === null && normCol) {
          const subC = candidati.filter(r => r.normColore === normCol);
          if (subC.length === 1) {
            bestIdx = subC[0].rowIndex;
          } else if (subC.length > 1) {
            candidati = subC;
          }
        }

        // Spareggio per taglia (T-Shirt)
        if (bestIdx === null && normMis) {
          const subT = candidati.filter(r => r.normTaglia === normMis);
          if (subT.length === 1) {
            bestIdx = subT[0].rowIndex;
          } else if (subT.length > 1) {
            candidati = subT;
          }
        }

        // Spareggio per prezzo
        if (bestIdx === null && prezzoPdf !== null) {
          const subPr = candidati.filter(r => r.numPrezzo === prezzoPdf);
          if (subPr.length === 1) {
            bestIdx = subPr[0].rowIndex;
          } else if (subPr.length > 1) {
            candidati = subPr;
          }
        }

        if (bestIdx === null && candidati.length === 1) {
          bestIdx = candidati[0].rowIndex;
        } else if (bestIdx === null && candidati.length > 1 && prefissoSato) {
          const subFinal = candidati.filter(r => r.uscita.startsWith(prefissoSato));
          if (subFinal.length > 0) {
            bestIdx = subFinal[0].rowIndex;
          }
        }
      }
    }

    // =========================================================================
    // PASSO 3: Match per Merchandising / Codice Uscita DIRETTO
    // =========================================================================
    if (bestIdx === null && codicePdf) {
      const subCod = satoRows.filter(
        r => r.uscita === codicePdf || r.uscita.endsWith('-' + codicePdf)
      );

      for (const row of subCod) {
        if (normTit && (normTit.includes(row.normArticolo) || row.normArticolo.includes(normTit))) {
          if (normMis && row.normTaglia && normMis !== row.normTaglia) {
            continue;
          }
          bestIdx = row.rowIndex;
          break;
        }
      }
    }

    // Esito
    if (bestIdx !== null) {
      if (matchedMap.has(bestIdx)) {
        const existing = matchedMap.get(bestIdx)!;
        existing.qtaVenduta += qtaVenduta;
        existing.qtaOrdine += qtaVenduta;
        existing.righePdf.push(item);
      } else {
        const rowCsv = satoRows.find(r => r.rowIndex === bestIdx)!;
        matchedMap.set(bestIdx, {
          id: `match_${bestIdx}`,
          csvIndex: bestIdx,
          barcode: rowCsv.barcode,
          uscita: rowCsv.uscita,
          articolo: rowCsv.articolo,
          modello: rowCsv.modello,
          colore: (rowCsv.colore || '').trim(),
          taglia: (rowCsv.taglia || '').trim(),
          prezzo: rowCsv.prezzo,
          qtaVenduta: qtaVenduta,
          qtaOrdine: qtaVenduta,
          escluso: false,
          collanaPdf: collanaPdf,
          titoloPdf: titoloPdf,
          codicePdf: codicePdf,
          righePdf: [item]
        });
      }
    } else {
      unmatchedList.push(item);
    }
  }

  const matched = Array.from(matchedMap.values()).sort((a, b) => {
    if (a.uscita < b.uscita) return -1;
    if (a.uscita > b.uscita) return 1;
    return a.articolo.localeCompare(b.articolo);
  });

  const totalVenduto = articoliPdf.reduce((acc, it) => acc + it.venditeNette, 0);
  const totalDaOrdinare = matched
    .filter(m => !m.escluso)
    .reduce((acc, m) => acc + m.qtaOrdine, 0);

  return {
    matched,
    unmatched: unmatchedList,
    panini: paniniList,
    totalVenduto,
    totalDaOrdinare,
    totalRighePdf: articoliPdf.length
  };
}
