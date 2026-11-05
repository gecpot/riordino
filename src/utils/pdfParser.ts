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

export async function parsePdfVenduto(fileOrBuffer: File | ArrayBuffer): Promise<PdfRow[]> {
  const arrayBuffer = fileOrBuffer instanceof File 
    ? await fileOrBuffer.arrayBuffer() 
    : fileOrBuffer;

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    isEvalSupported: false
  });
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

    // Ordina le righe dall'alto al basso
    lines.sort((a, b) => b.y - a.y);

    for (const line of lines) {
      // Ordina i pezzi da sinistra a destra
      const parts = [...line.pieces].sort((a, b) => a.x - b.x);
      const fullText = parts.map(p => p.text).join(' ');
      const fullTextUpper = fullText.toUpperCase();

      if (PAROLE_ESCLUSIONE.some(h => fullTextUpper.includes(h))) continue;
      if (fullText.startsWith('*Errore')) continue;

      // Coordinate delle colonne nel PDF cassa Trend:
      // 1. Collana: x < 100
      const pColl = parts.filter(p => p.x < 100);
      // 2. Codice: 100 <= x < 180
      const pCod = parts.filter(p => p.x >= 100 && p.x < 180);
      // 3. Titolo: 180 <= x < 450
      const pTit = parts.filter(p => p.x >= 180 && p.x < 450);
      // 4. Colore/Variante: 450 <= x < 560
      const pCol = parts.filter(p => p.x >= 450 && p.x < 560);
      // 5. Misura/Taglia: 560 <= x < 630
      const pMis = parts.filter(p => p.x >= 560 && p.x < 630);
      // 6. Vendite: 630 <= x < 695
      const pVend = parts.filter(p => p.x >= 630 && p.x < 695);
      // 7. Resi: 695 <= x < 740
      const pResi = parts.filter(p => p.x >= 695 && p.x < 740);
      // 8. Prezzo Vendita: 740 <= x < 790
      const pPrVend = parts.filter(p => p.x >= 740 && p.x < 790);
      // 9. Prezzo Fatturare: x >= 790
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

      // Normalizzazione taglia se contenuta nel campo colore
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

  return righeEstratte;
}
