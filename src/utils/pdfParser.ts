import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PdfRow } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

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

export async function parsePdfVenduto(fileOrBuffer: File | ArrayBuffer): Promise<PdfRow[]> {
  const arrayBuffer = fileOrBuffer instanceof File 
    ? await fileOrBuffer.arrayBuffer() 
    : fileOrBuffer;

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const righeEstratte: PdfRow[] = [];

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

    // Ordina le righe dall'alto al basso (in PDF Y scende verso il basso della pagina)
    lines.sort((a, b) => b.y - a.y);

    for (const line of lines) {
      // Ordina i pezzi da sinistra a destra
      const parts = [...line.pieces].sort((a, b) => a.x - b.x);
      const fullText = parts.map(p => p.text).join(' ');
      const fullTextUpper = fullText.toUpperCase();

      if (PAROLE_ESCLUSIONE.some(h => fullTextUpper.includes(h))) continue;
      if (fullText.startsWith('*Errore')) continue;

      // Colonna sinistra (x < 100): Collana/Testata
      const pLeft = parts.filter(p => p.x < 100);
      let collana = pLeft.map(p => p.text).join(' ').trim();

      // Colonna centrale (100 <= x < 180): Codice, varianti, vendite, resi, prezzo
      const pMid = parts.filter(p => p.x >= 100 && p.x < 180);

      // Colonna titolo (180 <= x < 600)
      const pTit = parts.filter(p => p.x >= 180 && p.x < 600);
      const titolo = pTit.map(p => p.text).join(' ').trim();

      // Colonna prezzi a destra (x >= 600)
      const pRight = parts.filter(p => p.x >= 600);
      let prezzoFatt = '';
      for (const pr of pRight) {
        if (/^[\d,]+$/.test(pr.text)) {
          if (!prezzoFatt) prezzoFatt = pr.text;
        }
      }

      if (pMid.length === 0) continue;

      const midText = pMid.map(p => p.text).join(' ').trim();

      // Pattern: <codice> [variante/colore] <vendite> <resi> <prezzo_vendita> [collana_accodata]
      const match = midText.match(/^(\S+)(?:\s+(.*?))?\s+(\d+)\s+(\d+)\s+([\d,]+)\s*(.*)$/);
      if (!match) continue;

      const codice = match[1].trim();
      const optExtra = (match[2] || '').trim();
      const vendite = parseInt(match[3], 10);
      const resi = parseInt(match[4], 10);
      const prezzoVend = match[5].trim();
      const trailColl = (match[6] || '').trim();

      if (trailColl) {
        collana = trailColl;
      }

      let colore = '';
      let misura = '';

      if (optExtra) {
        const partsExtra = optExtra.split(/\s+/);
        const lastPart = partsExtra[partsExtra.length - 1].toUpperCase();
        if (partsExtra.length >= 2 && TAGLIE_VALIDE.has(lastPart)) {
          colore = partsExtra.slice(0, -1).join(' ');
          misura = lastPart;
        } else if (partsExtra.length === 1 && TAGLIE_VALIDE.has(partsExtra[0].toUpperCase())) {
          misura = partsExtra[0].toUpperCase();
          colore = '';
        } else {
          colore = optExtra;
        }
      }

      if (!misura && colore) {
        const cParts = colore.split(/\s+/);
        const lastC = cParts[cParts.length - 1].toUpperCase();
        if (cParts.length >= 2 && TAGLIE_VALIDE.has(lastC)) {
          misura = lastC;
          colore = cParts.slice(0, -1).join(' ');
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

  return righeEstratte;
}
