/**
 * Calcola l'incertezza per i cursori DeltaT dell'oscilloscopio.
 * @param {number} deltaT Valore misurato di DeltaT (in secondi).
 * @param {number} larghezzaSchermo Larghezza totale dello schermo (in secondi).
 * @return L'ampiezza dell'errore totale.
 * @customfunction
 */
function CALCOLA_Aerr_DELTAT(deltaT, larghezzaSchermo) {
  if (!deltaT || isNaN(deltaT)) return "";
  
  const percDeltaT = 0.00005;   // 0.005%
  const parteFissa = 200E-12;     // 200 ps in secondi
  const percSchermo = 0.0016;     // 0,0016 × larghezza schermo (fattore, non percentuale)
  
  let termine1 = Math.abs(deltaT) * percDeltaT;
  let termine2 = parteFissa;
  let termine3 = (larghezzaSchermo || 0) * percSchermo;
  
  return termine1 + termine2 + termine3;
}

/**
 * Incertezza sui cursori ΔV (Keysight EDUX1002/DSOX1102): ±[guadagno DC + 0,5% FS].
 * @param {number} deltaV Valore misurato (serve solo come controllo di validità).
 * @param {number} fullScale Fondoscala FS = divisioni verticali × V/div (in V).
 * @param {number} voltPerDiv (opzionale) V/div, per applicare il 4% sotto 10 mV/div.
 * @return L'ampiezza dell'errore totale.
 * @customfunction
 */
function CALCOLA_Aerr_DELTAV(deltaV, fullScale, voltPerDiv) {
  if (!deltaV || isNaN(deltaV)) return "";

  const percDC = (voltPerDiv && voltPerDiv < 0.01) ? 0.04 : 0.03;
  const percCursori = 0.005;   // 0,5% del FS

  return (fullScale || 0) * (percDC + percCursori);
}