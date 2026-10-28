function apriFinestraCreaTabella() {
  var htmlOutput = HtmlService.createHtmlOutputFromFile('DialogoTabella')
      .setWidth(400)
      .setHeight(420);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Configura Nuova Sottotabella');
}

// Funzione migliorata per generare un colore schiarito rispetto alla selezione per il titolo 
function ottieniColoreTitolo(hex) {
  // Converte il codice esadecimale in valori RGB interi
  hex = hex.replace('#', '');
  var num = parseInt(hex, 16);
  
  var r = (num >> 16);
  var g = ((num >> 8) & 0x00ff);
  var b = (num & 0x0000ff);
  
  // Applicazione della formula per ciascun canale (corretto il troncamento della riga)
  r = Math.round(r + (255 - r) * 0.2);
  g = Math.round(g + (255 - g) * 0.2);
  b = Math.round(b + (255 - b) * 0.2);
  
  // Ricostruisce la stringa hex
  return '#' + (1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

function generaTabellaCustomDaDialogo(dati) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var activeCell = sheet.getActiveCell();
  
  var titoloTabella = dati.titolo;
  var intestazioniScelte = dati.intestazioni; 
  var coloreHex = dati.colore;
  
  var startRow = activeCell.getRow();
  var startCol = activeCell.getColumn();

  var tutteLeIntestazioni = intestazioniScelte.concat([" ", "Note"]);
  var numColonne = tutteLeIntestazioni.length;
  var numRigheDati = dati.numRighe;
  var totaleRigheTabella = 1 + numRigheDati; // 1 riga intestazione + righe dati

  // 1. Configurazione Titolo
  var titoloRange = sheet.getRange(startRow, startCol, 1, numColonne);
  titoloRange.merge();
  titoloRange.setValue(titoloTabella.toUpperCase());
  titoloRange.setFontWeight("bold");
  titoloRange.setFontSize(11);
  titoloRange.setHorizontalAlignment("center");
  titoloRange.setBackground(ottieniColoreTitolo(coloreHex));

  // 2. Scrittura delle intestazioni con il colore scelto
  var headerRange = sheet.getRange(startRow + 1, startCol, 1, numColonne);
  headerRange.setValues([tutteLeIntestazioni]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground(coloreHex); 
  
 // 3. Formattazione dati e gestione bordi pulita
  var tabellaCompletaRange = sheet.getRange(startRow + 1, startCol, totaleRigheTabella, numColonne);
  tabellaCompletaRange.setNumberFormat("0.00E+00");
  
  // A. Prima applica la griglia interna leggera (verticali e orizzontali)
  tabellaCompletaRange.setBorder(null, null, null, null, true, true, "#d3d3d3", SpreadsheetApp.BorderStyle.SOLID);
  
  // B. Poi applica il contorno esterno perimetrale medio/scuro attorno all'intera tabella
  tabellaCompletaRange.setBorder(true, true, true, true, null, null, "#202124", SpreadsheetApp.BorderStyle.MEDIUM);

  // C. Linea tratteggiata sotto l'intestazione (selezionando solo il range dell'header)
  var headerRange = sheet.getRange(startRow + 1, startCol, 1, numColonne);
  headerRange.setBorder(null, null, true, null, null, null, "#4A4A4A", SpreadsheetApp.BorderStyle.DASHED);

  // D. Separatore verticale punteggiato per la colonna "Note" (dal sotto-intestazione fino all'ultima riga)
  var colonnaNoteRange = sheet.getRange(startRow + 1, startCol + numColonne - 1, totaleRigheTabella, 1);
  colonnaNoteRange.setBorder(null, true, null, null, null, null, "#4A4A4A", SpreadsheetApp.BorderStyle.DOTTED);

  // E. Alternanza degli sfondi per colonna (stile zebra verticale)
  for (var c = 0; c < numColonne - 1; c++) { // Esclude l'ultima colonna ("Note") per mantenerla neutra
    // Se l'indice della colonna è dispari (colonna 1, 3, ecc. escludendo l'intestazione)
    if (c % 2 !== 0) {
      var colonnaDatiRange = sheet.getRange(startRow + 2, startCol + c, numRigheDati, 1);
      colonnaDatiRange.setBackground("#f8f9fa"); // Sfondo grigio chiaro pulito
    }
  }
  
  // Inserimento formule automatiche per il Gain H (dB) se presenti le colonne
  var idxVin = intestazioniScelte.indexOf("V_in (V)");
  var idxVout = intestazioniScelte.indexOf("V_out (V)");
  var idxDb = intestazioniScelte.indexOf("Gain H (dB)");

  if (idxVin !== -1 && idxVout !== -1 && idxDb !== -1) {
    var colVinLetter = columnIndexToLetter(startCol + idxVin);
    var colVoutLetter = columnIndexToLetter(startCol + idxVout);
    var colDbIndex = startCol + idxDb;
    
    for (var r = 0; r < numRigheDati; r++) {
      var currentRow = startRow + 2 + r;
      var formula = `=IF(OR(${colVinLetter}${currentRow}=0; ${colVoutLetter}${currentRow}=0); ""; 20*LOG10(${colVoutLetter}${currentRow} / ${colVinLetter}${currentRow}))`;
      sheet.getRange(currentRow, colDbIndex).setFormula(formula);
      sheet.getRange(currentRow, colDbIndex).setNumberFormat("0.00");
    }
  }
}

function columnIndexToLetter(index) {
  var letter = '';
  while (index > 0) {
    var rem = (index - 1) % 26; // Corretto il troncamento del -1
    letter = String.fromCharCode(65 + rem) + letter;
    index = Math.floor((index - 1) / 26); // Corretto il troncamento del -1
  }
  return letter;
}

function pulisciSelezioneCompleta(){
  var sheet=SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range=sheet.getActiveRange();
  var cellaFirst=range.getCell(1,1);
  
  range.clear();
  cellaFirst.activate();
}