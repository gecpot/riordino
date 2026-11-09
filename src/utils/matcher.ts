import { PdfRow, SatoRow, MatchedItem, UnmatchedOrderItem, MatchResult, ItemOverride, NonOrdinabileItem } from '../types';

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

export function ricavaPrefissoBonelli(collanaPdf: string, mappaCollane: Record<string, string>): string {
  const upper = (collanaPdf || '').trim().toUpperCase();
  if (!upper) return '';
  if (mappaCollane[upper]) return mappaCollane[upper];

  // Cerca solo corrispondenza esatta del nome collana (ignorando differenze di spazi o trattini),
  // SENZA tirare a indovinare per parola chiave (così non assegna mai un codice sbagliato!)
  const normUpper = normalizzaTesto(upper);
  if (normUpper) {
    for (const [k, v] of Object.entries(mappaCollane)) {
      if (normalizzaTesto(k) === normUpper && v) {
        return v;
      }
    }
  }

  return '';
}

const COLLANE_CONTENITORE_GENERICO = new Set([
  'VARIE',
  'PANINI',
  'LIBRI VARI',
  'VARIANT'
]);

/**
 * Analizza i PDF e il file Sato.csv per recuperare in automatico SOLO i prefissi
 * di cui c'è certezza matematica al 100% (corrispondenza univoca su titolo + numero + unanimità).
 */
export function scopriPrefissiCertiDaCsv(
  articoliPdf: PdfRow[],
  satoRows: PreparedSatoRow[]
): Record<string, string> {
  if (satoRows.length === 0 || articoliPdf.length === 0) return {};

  const prefixesByCollana = new Map<string, Set<string>>();

  for (const item of articoliPdf) {
    if (item.isPanini) continue;
    const coll = (item.collana || '').trim().toUpperCase();
    if (!coll || COLLANE_CONTENITORE_GENERICO.has(coll)) continue;

    const normTit = normalizzaTesto(item.titolo);
    const numCod = estraiNumeroAlbo(item.codice);
    const prezzoPdf = normalizzaPrezzo(item.prezzoVendita);
    if (!normTit) continue;

    // 1. Match rigoroso: stesso identico titolo normalizzato E stesso identico numero albo
    let cands = satoRows.filter(
      r =>
        r.normArticolo === normTit &&
        r.numUscita === numCod &&
        r.uscita.includes('-') &&
        (prezzoPdf === null || r.numPrezzo === null || r.numPrezzo === prezzoPdf)
    );

    // 2. Per i libri/volumi (dove il codice PDF è un codice interno a 4-5 cifre):
    // richiede titolo lungo (>= 12 caratteri) che compaia UNA SOLA VOLTA in tutto Sato.csv
    if (cands.length === 0 && normTit.length >= 12) {
      const exactTitleRows = satoRows.filter(
        r =>
          r.normArticolo === normTit &&
          r.uscita.includes('-') &&
          (prezzoPdf === null || r.numPrezzo === null || r.numPrezzo === prezzoPdf)
      );
      const uniquePrefixes = new Set(exactTitleRows.map(r => r.uscita.split('-')[0].trim()));
      if (uniquePrefixes.size === 1) {
        cands = exactTitleRows;
      }
    }

    if (cands.length > 0) {
      if (!prefixesByCollana.has(coll)) {
        prefixesByCollana.set(coll, new Set());
      }
      const set = prefixesByCollana.get(coll)!;
      for (const c of cands) {
        const pref = c.uscita.split('-')[0].trim();
        if (pref) set.add(pref);
      }
    }
  }

  // Accetta il prefisso SOLO se c'è unanimità totale (1 solo prefisso trovato senza alcuna ambiguità)
  const certi: Record<string, string> = {};
  for (const [coll, prefSet] of prefixesByCollana.entries()) {
    if (prefSet.size === 1) {
      certi[coll] = Array.from(prefSet)[0];
    }
  }
  return certi;
}

export function generaCodiceBonelli(
  collanaPdf: string,
  codicePdf: string,
  mappaCollane: Record<string, string>
): { codiceBonelli: string; prefissoSato: string } {
  const prefisso = ricavaPrefissoBonelli(collanaPdf, mappaCollane);
  const codClean = (codicePdf || '').trim();
  const paddedCod = /^\d+$/.test(codClean) && codClean.length < 3 ? codClean.padStart(3, '0') : codClean;

  if (prefisso) {
    return {
      codiceBonelli: codClean ? `${prefisso}-${paddedCod}` : prefisso,
      prefissoSato: prefisso
    };
  }

  // Se non ha un prefisso codificato, usa abbreviazione collana + codice
  const collShort = (collanaPdf || 'EXTRA').trim().toUpperCase();
  return {
    codiceBonelli: codClean ? `${collShort} #${paddedCod}` : collShort,
    prefissoSato: ''
  };
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
  mappaCollane: Record<string, string>,
  overrides: Record<string, ItemOverride> = {},
  nonOrdinabili: Record<string, NonOrdinabileItem> = {}
): MatchResult {
  const matchedMap = new Map<number, MatchedItem>();
  const unmatchedMap = new Map<string, UnmatchedOrderItem>();
  const blockedInWeek: Record<string, number> = {};
  const paniniMap = new Map<string, PdfRow>();

  for (const item of articoliPdf) {
    if (item.isPanini) {
      const pKey = `${normalizzaTesto(item.collana)}_${normalizzaTesto(item.codice)}_${normalizzaTesto(item.titolo)}`;
      if (paniniMap.has(pKey)) {
        const ex = paniniMap.get(pKey)!;
        ex.vendite += item.vendite;
        ex.resi += item.resi;
        ex.venditeNette += item.venditeNette;
      } else {
        paniniMap.set(pKey, { ...item });
      }
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
    const prefissoSato = ricavaPrefissoBonelli(collanaPdf, mappaCollane) || null;

    if (satoRows.length > 0) {
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
          if (prefissoSato) {
            const subP = candidati.filter(r => r.uscita.startsWith(prefissoSato));
            if (subP.length === 1) {
              bestIdx = subP[0].rowIndex;
            } else if (subP.length > 1) {
              candidati = subP;
            }
          }

          if (bestIdx === null && numCod) {
            const subN = candidati.filter(r => r.numUscita === numCod);
            if (subN.length === 1) {
              bestIdx = subN[0].rowIndex;
            } else if (subN.length > 1) {
              candidati = subN;
            }
          }

          if (bestIdx === null && normCol) {
            const subC = candidati.filter(r => r.normColore === normCol);
            if (subC.length === 1) {
              bestIdx = subC[0].rowIndex;
            } else if (subC.length > 1) {
              candidati = subC;
            }
          }

          if (bestIdx === null && normMis) {
            const subT = candidati.filter(r => r.normTaglia === normMis);
            if (subT.length === 1) {
              bestIdx = subT[0].rowIndex;
            } else if (subT.length > 1) {
              candidati = subT;
            }
          }

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
    }

    // Esito
    if (bestIdx !== null) {
      if (matchedMap.has(bestIdx)) {
        const existing = matchedMap.get(bestIdx)!;
        existing.qtaVenduta += qtaVenduta;
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
      // Articolo Non a Catalogo CSV -> Verifica prima se è nel database permanente dei Non Ordinabili
      const { codiceBonelli, prefissoSato: pref } = generaCodiceBonelli(collanaPdf, codicePdf, mappaCollane);
      const uKey = `unmatch_${normalizzaTesto(collanaPdf)}_${normalizzaTesto(codicePdf)}_${normMis}_${normCol}_${normTit}`;

      if (nonOrdinabili[uKey]) {
        blockedInWeek[uKey] = (blockedInWeek[uKey] || 0) + qtaVenduta;
        continue;
      }

      if (unmatchedMap.has(uKey)) {
        const ex = unmatchedMap.get(uKey)!;
        ex.qtaVenduta += qtaVenduta;
      } else {
        unmatchedMap.set(uKey, {
          id: uKey,
          codiceBonelli,
          prefissoSato: pref,
          collana: collanaPdf || 'SENZA COLLANA',
          codice: codicePdf,
          colore: colorePdf,
          misura: misuraPdf,
          titolo: titoloPdf,
          prezzoVendita: item.prezzoVendita,
          qtaVenduta: qtaVenduta,
          qtaOrdine: qtaVenduta,
          escluso: false,
          page: item.page
        });
      }
    }
  }

  // Applica gli overrides (escluso e qtaDelta) agli articoli Matched (CSV)
  const matched = Array.from(matchedMap.values())
    .map(m => {
      const ov = overrides[m.id];
      const escluso = ov?.escluso ?? false;
      const delta = ov?.qtaDelta ?? 0;
      const qtaOrdine = Math.max(0, m.qtaVenduta + delta);
      return { ...m, escluso, qtaOrdine };
    })
    .sort((a, b) => {
      if (a.uscita < b.uscita) return -1;
      if (a.uscita > b.uscita) return 1;
      return a.articolo.localeCompare(b.articolo);
    });

  // Applica gli overrides (escluso e qtaDelta) agli articoli Unmatched (Ordine Mail)
  // Mettendo SEMPRE in cima gli eventuali articoli senza prefisso (così saltano subito all'occhio)
  const unmatched = Array.from(unmatchedMap.values())
    .map(u => {
      const ov = overrides[u.id];
      const escluso = ov?.escluso ?? false;
      const delta = ov?.qtaDelta ?? 0;
      const qtaOrdine = Math.max(0, u.qtaVenduta + delta);
      return { ...u, escluso, qtaOrdine };
    })
    .sort((a, b) => {
      const aMissing = !a.prefissoSato ? 0 : 1;
      const bMissing = !b.prefissoSato ? 0 : 1;
      if (aMissing !== bMissing) return aMissing - bMissing;
      if (a.codiceBonelli < b.codiceBonelli) return -1;
      if (a.codiceBonelli > b.codiceBonelli) return 1;
      return a.titolo.localeCompare(b.titolo);
    });

  const paniniList = Array.from(paniniMap.values());

  const totalVenduto = articoliPdf.reduce((acc, it) => acc + it.venditeNette, 0);
  const totalDaOrdinare = matched
    .filter(m => !m.escluso)
    .reduce((acc, m) => acc + m.qtaOrdine, 0);
  const totalDaOrdinareMail = unmatched
    .filter(u => !u.escluso)
    .reduce((acc, u) => acc + u.qtaOrdine, 0);

  return {
    matched,
    unmatched,
    blockedInWeek,
    panini: paniniList,
    totalVenduto,
    totalDaOrdinare,
    totalDaOrdinareMail,
    totalRighePdf: articoliPdf.length
  };
}
