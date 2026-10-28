// Generatore del Diagramma di Bode 
function creaDiagrammaBodeDinamico() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var range = sheet.getActiveRange();
  
  var startRow = range.getRow();
  var startCol = range.getColumn();
  var numRows = range.getNumRows();
  var numCols = range.getNumColumns();
  
  if (numCols < 3 || numRows < 2) {
    SpreadsheetApp.getUi().alert('Seleziona almeno tre colonne (Frequenza, V_in, V_out) incluse le intestazioni.');
    return;
  }
  
  var values = range.getValues();
  var intestazioniSelezionate = values[0]; // Prima riga della selezione
  
  // CERCA SE LA COLONNA "Gain H (dB)" ESISTE GIÀ NELLA SELEZIONE
  var idxDb = -1;
  for (var c = 0; c < intestazioniSelezionate.length; c++) {
    if (intestazioniSelezionate[c] === "Gain H (dB)") {
      idxDb = c;
      break;
    }
  }
  
  var targetColOffset = 3; // Di default la mette come quarta colonna
  
  if (idxDb !== -1) {
    // Se la colonna esiste già nella selezione, usa la sua posizione esatta
    targetColOffset = idxDb;
  } else {
    // Altrimenti la scrive/imposta nella quarta colonna
    var headerCol4 = sheet.getRange(startRow, startCol + 3);
    if (headerCol4.getValue() !== "") {
      SpreadsheetApp.getUi().alert('La quarta colonna contiene già "' + headerCol4.getValue() +
        '". Includi nella selezione la colonna "Gain H (dB)" oppure svuota la quarta colonna.');
      return;
    }
    headerCol4.setValue("Gain H (dB)");
    headerCol4.setFontWeight("bold");
    
    // Calcola e inserisce i valori se non erano presenti
    var dbValues = [];
    for (var i = 1; i < values.length; i++) {
      var vIn = parseFloat(values[i][1]);
      var vOut = parseFloat(values[i][2]);
      
      if (vIn > 0 && vOut > 0) {
        var db = 20 * Math.log10(vOut / vIn);
        dbValues.push([db]);
      } else {
        dbValues.push([""]);
      }
    }
    var dbRange = sheet.getRange(startRow + 1, startCol + 3, dbValues.length, 1);
    dbRange.setValues(dbValues);
    dbRange.setNumberFormat("0.00");
  }
  
  // Riferimenti per il grafico basati sulla posizione corretta della colonna Guadagno
  var freqColRange = sheet.getRange(startRow, startCol, numRows, 1);
  var targetDbRange = sheet.getRange(startRow, startCol + targetColOffset, numRows, 1);
  
  var chart = sheet.newChart()
     .asScatterChart()
     .addRange(freqColRange)
     .addRange(targetDbRange)
     .setPosition(startRow, startCol + numCols + 2, 0, 0)
     .setTitle('Diagramma di Bode - Modulo (dB)')
     .setOption('hAxis.logScale', true)
     .setOption('vAxis.title', 'Gain H (dB)')
     .build();
     
  sheet.insertChart(chart);
}