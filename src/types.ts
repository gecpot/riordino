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

export interface PdfBatch {
  id: string;
  fileName: string;
  uploadedAt: string;
  periodo: string;
  pages: number;
  rows: PdfRow[];
  fingerprint: string;
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

export interface SavedCsvData {
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  headers: string[];
  rows: SatoRow[];
}

export interface ItemOverride {
  escluso?: boolean;
  qtaDelta?: number; // differenza manuale rispetto a qtaVenduta (es. +2 o -1)
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

export interface UnmatchedOrderItem {
  id: string;
  codiceBonelli: string; // es. "DD01-039" o "TE01-512"
  prefissoSato: string;  // es. "DD01"
  collana: string;
  codice: string;
  colore: string;
  misura: string;
  titolo: string;
  prezzoVendita: string;
  qtaVenduta: number;
  qtaOrdine: number;
  escluso: boolean; // Se true, non viene ordinato via mail (QTA = 0)
  page: number;
}

export interface NonOrdinabileItem {
  key: string;
  codiceBonelli: string;
  prefissoSato: string;
  collana: string;
  codice: string;
  colore: string;
  misura: string;
  titolo: string;
  prezzoVendita: string;
  addedAt: string;
  qtaVendutaSettimana?: number;
}

export type ActiveTab = 'matched' | 'unmatched' | 'panini' | 'blocked';

export interface MatchResult {
  matched: MatchedItem[];
  unmatched: UnmatchedOrderItem[];
  blockedInWeek: Record<string, number>; // mappa key -> copie vendute nei PDF della settimana corrente
  panini: PdfRow[];
  totalVenduto: number;
  totalDaOrdinare: number;     // Totale copie ordine CSV Sato
  totalDaOrdinareMail: number; // Totale copie ordine Mail (non a catalogo CSV)
  totalRighePdf: number;
}
