function creaBloccoIncertezze() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var src = ss.getActiveSheet();
  if (src.getName() === "Incertezze") {
    ui.alert("Seleziona la tabella dati nel foglio delle misure, non in 'Incertezze'.");
    return;
  }

  var range = src.getActiveRange();
  var values = range.getValues();

  // Cerca la riga delle intestazioni nelle prime due righe della selezione
  var hdrOff = -1, iF = -1, iVin = -1, iVout = -1, iVdIn = -1, iVdOut = -1;
  for (var h = 0; h < Math.min(2, values.length); h++) {
    var vi = values[h].indexOf("V_in (V)");
    var vo = values[h].indexOf("V_out (V)");
    if (vi !== -1 && vo !== -1) {
      hdrOff = h; iVin = vi; iVout = vo;
      iF = values[h].indexOf("Frequenza (Hz)");
      iVdIn = values[h].indexOf("V/div in (V)");
      iVdOut = values[h].indexOf("V/div out (V)");
      break;
    }
  }
  if (hdrOff === -1) {
    ui.alert("Non trovo le colonne 'V_in (V)' e 'V_out (V)' nella selezione.");
    return;
  }

  var headerRow = range.getRow() + hdrOff;
  var firstData = headerRow + 1;
  var nRows = range.getLastRow() - headerRow;
  if (nRows < 1) { ui.alert("La selezione non contiene righe dati."); return; }

  var titolo = headerRow > 1
    ? src.getRange(headerRow - 1, range.getColumn()).getDisplayValue() : "";
  if (!titolo) titolo = "Tabella";

  var dst = ss.getSheetByName("Incertezze") || ss.insertSheet("Incertezze");
  var c0 = dst.getLastColumn() === 0 ? 1 : dst.getLastColumn() + 2;

  var nCols = 9;
  var L = function (k) { return columnIndexToLetter(c0 + k); };
  var srcName = "'" + src.getName().replace(/'/g, "''") + "'!";
  var srcRef = function (iCol, r) {
    return srcName + columnIndexToLetter(range.getColumn() + iCol) + r;
  };

  // --- Titolo ---
  var t = dst.getRange(1, c0, 1, nCols);
  t.merge().setValue("INCERTEZZE - " + titolo.toUpperCase())
   .setFontWeight("bold").setHorizontalAlignment("center").setBackground("#e8f0fe");

  // --- Parametri (righe 2-7) ---
  // Specifiche Keysight EDUX1002/DSOX1102, cursori doppi: ±[guadagno DC + 0,5% FS]
  var params = [
    ["Divisioni verticali", 8, "0"],
    ["% FS guadagno DC", 0.03, "0.00%"],
    ["% FS guadagno DC (V/div < soglia)", 0.04, "0.00%"],
    ["Soglia V/div (V)", 0.01, "0.000"],
    ["% FS cursori ΔV", 0.005, "0.00%"],
    ["Metodo (quadratura/somma)", "quadratura", "@"]
  ];
  for (var p = 0; p < params.length; p++) {
    dst.getRange(2 + p, c0, 1, 2).merge().setValue(params[p][0]).setFontWeight("bold");
    dst.getRange(2 + p, c0 + 2).setValue(params[p][1]).setNumberFormat(params[p][2])
       .setBackground("#fff8e1").setHorizontalAlignment("center");
  }
  dst.getRange(7, c0 + 2).setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(["quadratura", "somma"], true).build());

  var pDiv = "$" + L(2) + "$2", pG = "$" + L(2) + "$3", pG4 = "$" + L(2) + "$4",
      pSoglia = "$" + L(2) + "$5", pCurs = "$" + L(2) + "$6", pMet = "$" + L(2) + "$7";

  // --- Intestazioni (riga 9) ---
  var HR = 9, DR = 10;
  var headers = ["Frequenza (Hz)", "V_in (V)", "V/div in (V)", "σ V_in (V)",
                 "V_out (V)", "V/div out (V)", "σ V_out (V)", "Gain H (dB)", "σ Gain H (dB)"];
  dst.getRange(HR, c0, 1, nCols).setValues([headers])
     .setFontWeight("bold").setBackground("#e8f0fe")
     .setBorder(null, null, true, null, null, null, "#4A4A4A", SpreadsheetApp.BorderStyle.DASHED);

  // --- Formule dei dati ---
  var F = [];
  for (var r = 0; r < nRows; r++) {
    var row = DR + r, sr = firstData + r;
    var vin = L(1) + row, vdIn = L(2) + row, sIn = L(3) + row;
    var vout = L(4) + row, vdOut = L(5) + row, sOut = L(6) + row;

    var link = function (iCol) {
      var ref = srcRef(iCol, sr);
      return '=IF(' + ref + '="";"";' + ref + ')';
    };
    // V/div: legge dalla tabella dati; se la cella è vuota eredita dalla riga sopra
    var vdLink = function (iCol, selfCol) {
      if (iCol === -1) return "";  // colonna assente nella tabella: compilazione manuale
      var ref = srcRef(iCol, sr);
      var sopra = (r === 0) ? '""' : selfCol + (row - 1);
      return '=IF(' + ref + '<>"";' + ref + ';' + sopra + ')';
    };
    // σ = (%guadagno [3% o 4%] + %cursori) * FS, con FS = divisioni * V/div
    var sigma = function (v, vd) {
      return '=IF(OR(NOT(ISNUMBER(' + v + '));NOT(ISNUMBER(' + vd + ')));"";' +
             '(IF(' + vd + '<' + pSoglia + ';' + pG4 + ';' + pG + ')+' + pCurs + ')*' + pDiv + '*' + vd + ')';
    };
    var gain = '=IF(AND(ISNUMBER(' + vin + ');ISNUMBER(' + vout + '));' +
               'IF(AND(' + vin + '>0;' + vout + '>0);20*LOG10(' + vout + '/' + vin + ');"");"")';
    var rIn = sIn + '/' + vin, rOut = sOut + '/' + vout;
    var sGain = '=IF(AND(ISNUMBER(' + vin + ');ISNUMBER(' + vout + ');ISNUMBER(' + sIn + ');ISNUMBER(' + sOut + '));' +
                'IF(AND(' + vin + '>0;' + vout + '>0);(20/LN(10))*IF(' + pMet + '="somma";' +
                'ABS(' + rIn + ')+ABS(' + rOut + ');SQRT((' + rIn + ')^2+(' + rOut + ')^2));"");"")';

    F.push([
      iF !== -1 ? link(iF) : "",
      link(iVin), vdLink(iVdIn, L(2)), sigma(vin, vdIn),
      link(iVout), vdLink(iVdOut, L(5)), sigma(vout, vdOut),
      gain, sGain
    ]);
  }

  var data = dst.getRange(DR, c0, nRows, nCols);
  data.setFormulas(F);
  data.setNumberFormat("0.00E+00");
  dst.getRange(DR, c0 + 7, nRows, 2).setNumberFormat("0.00");

  // V/div: grigio se collegato alla tabella, giallo se da compilare a mano
  dst.getRange(DR, c0 + 2, nRows, 1)
     .setBackground(iVdIn !== -1 ? "#f1f3f4" : "#fff8e1");
  dst.getRange(DR, c0 + 5, nRows, 1)
     .setBackground(iVdOut !== -1 ? "#f1f3f4" : "#fff8e1");

  // Bordi: griglia leggera + contorno
  var tab = dst.getRange(HR, c0, nRows + 1, nCols);
  tab.setBorder(null, null, null, null, true, true, "#d3d3d3", SpreadsheetApp.BorderStyle.SOLID);
  tab.setBorder(true, true, true, true, null, null, "#202124", SpreadsheetApp.BorderStyle.MEDIUM);

  dst.activate();
}