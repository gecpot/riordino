export interface PdfRow {
  collana: string;
  codice: string;
  colore: string;
  misura: string;
  titolo: string;
  vendite: number;
  resi: number;
  venditeNette: number;
  prezzoVendita: string;
  prezzoFatturare: string;
  isPanini: boolean;
  rawLine: string;
  page: number;
}

export interface SatoRow {
  rowIndex: number;
  barcode: string;
  uscita: string;
  articolo: string;
  modello: string;
  colore: string;
  taglia: string;
  prezzo: string;
  qta: string;
  rawRecord: Record<string, string>;
}

export interface MatchedItem {
  id: string;
  csvIndex: number;
  barcode: string;
  uscita: string;
  articolo: string;
  modello: string;
  colore: string;
  taglia: string;
  prezzo: string;
  qtaVenduta: number;
  qtaOrdine: number;
  escluso: boolean; // Se true, non viene ordinato (QTA = 0 nel CSV)
  collanaPdf: string;
  titoloPdf: string;
  codicePdf: string;
  righePdf: PdfRow[];
}

export interface MatchResult {
  matched: MatchedItem[];
  unmatched: PdfRow[];
  panini: PdfRow[];
  totalVenduto: number;
  totalDaOrdinare: number;
  totalRighePdf: number;
}
