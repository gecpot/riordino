import * as pdfjsLib from 'pdfjs-dist';
import { PdfRow } from '../types';

// Configurazione Worker PDF.js da CDN ad altissima affidabilità e compatibilità browser
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

const PAROLE_ESCLUSIONE = [
  'DATA DI STAMPA', 'VENDITE DETTAGLIO', 'SELEZIONE:', 'MAGAZZINO',
  'FAMIGLIA', 'PERIODO', 'ARTICOLO', 'PAGINA', 'TOTALE PEZZI',
  'TOTALE VALORE', 'TOTALE IPOTETICO', 'PREZZO DA', 'PREZZO VENDITA',
  '*ERRORE', 'PREZZO', 'FATTURARE'
];

const TAGLIE_VALIDE = new Set([
  'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '2XL', '3XL', 'U', '*U', 'S/M', 'L/XL', 'M/L', 'XS'
]);

interface TextPiece {
  x: number;
  y: number;
  text: string;
}

export interface ParsedPdfResult {
  rows: PdfRow[];
  periodo: string;
  pages: number;
  fingerprint: string;
}

export async function parsePdfBatch(fileOrBuffer: File | ArrayBuffer): Promise<ParsedPdfResult> {
  const arrayBuffer = fileOrBuffer instanceof File 
    ? await fileOrBuffer.arrayBuffer() 
    : fileOrBuffer;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false
  });
  const pdfDoc = await loadingTask.promise;
  const righeEstratte: PdfRow[] = [];
  let periodoDetect = '';
  let dataStampaDetect = '';

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pieces: TextPiece[] = [];

    for (const item of textContent.items) {
      if ('str' in item && item.str.trim()) {
        const x = item.transform[4];
        const y = item.transform[5];
        pieces.push({ x, y, text: item.str.trim() });
      }
    }

    // Raggruppa per riga Y con tolleranza di 2.5 punti
    const lines: { y: number; pieces: TextPiece[] }[] = [];
    for (const piece of pieces) {
      let matchedLine = lines.find(l => Math.abs(l.y - piece.y) <= 2.5);
      if (!matchedLine) {
        matchedLine = { y: piece.y, pieces: [] };
        lines.push(matchedLine);
      }
      matchedLine.pieces.push(piece);
    }

    // Ordina le righe dall'alto al basso
    lines.sort((a, b) => b.y - a.y);

    for (const line of lines) {
      // Ordina i pezzi da sinistra a destra
      const parts = [...line.pieces].sort((a, b) => a.x - b.x);
      const fullText = parts.map(p => p.text).join(' ');
      const fullTextUpper = fullText.toUpperCase();

      // Estrazione automatica del periodo o data di stampa dalla prima pagina
      if (pageNum === 1) {
        if (!periodoDetect && fullTextUpper.includes('PERIODO')) {
          const m = fullText.match(/DAL\s+\S+\s+AL\s+\S+/i);
          if (m) periodoDetect = m[0].toUpperCase();
        }
        if (!dataStampaDetect && fullTextUpper.includes('DATA DI STAMPA')) {
          const m = fullText.match(/(\d{2}\/\d{2}\/\d{4})/);
          if (m) dataStampaDetect = m[1];
        }
      }

      if (PAROLE_ESCLUSIONE.some(h => fullTextUpper.includes(h))) continue;
      if (fullText.startsWith('*Errore')) continue;

      // Coordinate delle colonne nel PDF cassa Trend:
      const pColl = parts.filter(p => p.x < 100);
      const pCod = parts.filter(p => p.x >= 100 && p.x < 180);
      const pTit = parts.filter(p => p.x >= 180 && p.x < 450);
      const pCol = parts.filter(p => p.x >= 450 && p.x < 560);
      const pMis = parts.filter(p => p.x >= 560 && p.x < 630);
      const pVend = parts.filter(p => p.x >= 630 && p.x < 695);
      const pResi = parts.filter(p => p.x >= 695 && p.x < 740);
      const pPrVend = parts.filter(p => p.x >= 740 && p.x < 790);
      const pPrFatt = parts.filter(p => p.x >= 790);

      const codice = pCod.map(p => p.text).join(' ').trim();
      if (!codice) continue;

      let collana = pColl.map(p => p.text).join(' ').trim();
      let titolo = pTit.map(p => p.text).join(' ').trim();
      let colore = pCol.map(p => p.text).join(' ').trim();
      let misura = pMis.map(p => p.text).join(' ').trim();
      const vendStr = pVend.map(p => p.text).join('').replace(/,/g, '');
      const resiStr = pResi.map(p => p.text).join('').replace(/,/g, '');
      const vendite = parseInt(vendStr, 10) || 0;
      const resi = parseInt(resiStr, 10) || 0;
      const prezzoVend = pPrVend.map(p => p.text).join('').trim();
      const prezzoFatt = pPrFatt.map(p => p.text).join('').trim();

      if (!misura && colore) {
        const cParts = colore.split(/\s+/);
        const lastC = cParts[cParts.length - 1].toUpperCase();
        if (TAGLIE_VALIDE.has(lastC)) {
          misura = lastC;
          colore = cParts.slice(0, -1).join(' ').trim();
        }
      }

      const venditeNette = Math.max(0, vendite - resi);

      let isPanini = false;
      const collUpper = collana.toUpperCase();
      const titUpper = titolo.toUpperCase();
      if (collUpper.includes('PANINI') || titUpper.includes('PANINI')) {
        isPanini = true;
      }

      righeEstratte.push({
        collana,
        codice,
        colore,
        misura,
        titolo,
        vendite,
        resi,
        venditeNette,
        prezzoVendita: prezzoVend,
        prezzoFatturare: prezzoFatt,
        isPanini,
        rawLine: fullText,
        page: pageNum
      });
    }
  }

  const periodo = periodoDetect || (dataStampaDetect ? `Stampa ${dataStampaDetect}` : '');
  const totCopie = righeEstratte.reduce((s, r) => s + r.venditeNette, 0);
  const firstItem = righeEstratte[0] ? `${righeEstratte[0].collana}_${righeEstratte[0].codice}` : '';
  const lastItem = righeEstratte[righeEstratte.length - 1]
    ? `${righeEstratte[righeEstratte.length - 1].collana}_${righeEstratte[righeEstratte.length - 1].codice}`
    : '';
  const fingerprint = `${periodo}|${righeEstratte.length}|${totCopie}|${firstItem}|${lastItem}`;

  return {
    rows: righeEstratte,
    periodo,
    pages: pdfDoc.numPages,
    fingerprint
  };
}

export async function parsePdfVenduto(fileOrBuffer: File | ArrayBuffer): Promise<PdfRow[]> {
  const res = await parsePdfBatch(fileOrBuffer);
  return res.rows;
}
