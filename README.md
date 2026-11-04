# Riordino Fumetti & Gadget 📚✨

Web App per l'elaborazione automatica e la generazione dell'ordine **Sato / Sergio Bonelli Editore** a partire dal report delle vendite di cassa **Trend** (formato PDF).

## 🚀 Caratteristiche Principali

- **Drag & Drop Diretto:** Trascina direttamente nel browser il PDF delle vendite (`vendneg.pdf`) e il catalogo d'ordine (`Sato.csv`).
- **100% Client-Side:** I tuoi dati commerciali non lasciano mai il tuo dispositivo. Nessun caricamento su server esterni, zero latenza e massima privacy.
- **Algoritmo di Match Rigoroso:** 0 falsi positivi garantiti. Abbina fedelmente per prefisso collana Bonelli (`TEX` -> `TE01`, ecc.), numero albo, titolo normalizzato, variante colore e taglia.
- **Gestione Taglie Magliette:** Gestione dedicata delle taglie di abbigliamento (`S`, `M`, `L`, `XL`, `XXL`, ecc.) con barcode Sato dedicati.
- **Esclusione e Spunta Titoli:** Possibilità di escludere titoli dall'ordine con un click (`ORDINA` / `ESCLUSO`) o di modificare la quantità desiderata prima di esportare.
- **Filtro Panini Automatico:** Separazione automatica degli articoli Panini Comics / Disney / Marvel per non inquinare l'ordine Bonelli.
- **Pulsante Azzera Vista:** Possibilità di ripulire la schermata e ripartire da zero per una nuova sessione.
- **Esportazione Standard:**
  - `Sato_ordine_AGGIORNATO.csv`: codificato in Windows-1252 / ISO-8859-1 con delimitatore `;` e tutti i campi racchiusi tra virgolette, pronto per l'invio al fornitore.
  - `albi_non_trovati.txt`: report testuale dettagliato di tutti gli albi vintage o esauriti venduti in negozio ma non presenti nel listino attivo.

## 🛠️ Tecnologie

- **React 18** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Lucide Icons**
- **PDF.js** (estrazione testo tramite coordinate spaziali)
- **PapaParse** (parsing e serializzazione CSV)
