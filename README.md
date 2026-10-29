# GoogleSheets_toolbox

Codice Apps Script del foglio template **LabSS_template** per il laboratorio di Segnali e Sistemi: crea le tabelle di misura e calcola le incertezze degli strumenti.

Il foglio fa parte di un flusso in due parti. Questa repo contiene la parte nel foglio; la parte in Python (lettura dei dati e grafici) è in [physics_toolbox](https://github.com/luzifrancesco12-design/physics-toolbox).

---

## Per chi usa il template

1. **Copia il template:** [crea la tua copia](https://docs.google.com/spreadsheets/d/1KYYguIiGcqxfJHHOVRqoH2j71D1UHrsn6BBLPU0dIuY/copy).
2. **Autorizza lo script** (una volta per copia): apri il menu *Smart Table*, clicca una voce e scegli il tuo account. Google mostra l'avviso "app non verificata", perché lo script non è passato dalla verifica di Google: clicca *Avanzate* → *Vai a ... (non sicuro)* → *Consenti*. Lo script lavora solo sul foglio in cui si trova (`@OnlyCurrentDoc`) e non accede ad altri file del tuo Drive.
3. **Usa i menu** descritti qui sotto.
4. **Per leggere i dati in Python**, condividi il foglio: Condividi → Accesso generale → *Chiunque abbia il link* → **Visualizzatore**. Poi apri il notebook Colab della repo `physics_toolbox`.

Il foglio contiene una scheda *Istruzioni* con gli stessi passaggi.

---

## Cosa fa

### Menu *Smart Table*

| Voce | Funzione |
|---|---|
| Crea Nuova Sottotabella Dinamica | Apre un dialogo per scegliere titolo, grandezze, colore e numero di righe (10, 15, 20, 30). Genera la tabella a partire dalla cella selezionata, con colonna `Note` finale. Se ci sono `V_in (V)`, `V_out (V)` e `Gain H (dB)`, il guadagno viene calcolato con una formula. |
| Pulisci Selezione | Cancella contenuto e formattazione dell'intervallo selezionato. |

### Menu *Tool Laboratorio*

| Voce | Funzione |
|---|---|
| Crea Blocco Incertezze | Dalla tabella selezionata (intestazioni incluse, con `V_in (V)` e `V_out (V)`) crea nel foglio **Incertezze** un blocco di 9 colonne con le incertezze di tensione e quella sul guadagno in dB. Ogni nuovo blocco viene affiancato al precedente. |
| Genera Diagramma di Bode | Grafico rapido del modulo nel foglio, a partire da Frequenza, `V_in` e `V_out`. Il grafico completo, con le barre d'errore, si fa in Python. |

### Funzioni utilizzabili nelle celle

| Funzione | Calcola |
|---|---|
| `=CALCOLA_Aerr_DELTAT(Δt; larghezza_schermo)` | Incertezza dei cursori Δt: 0,005 % · Δt + 200 ps + 0,0016 · larghezza schermo. Valori in secondi. |
| `=CALCOLA_Aerr_DELTAV(ΔV; fondoscala; V/div)` | Incertezza dei cursori ΔV: (3 % del fondoscala, 4 % se V/div < 10 mV, + 0,5 %) · fondoscala. Il terzo argomento, in volt, è facoltativo. Fondoscala = divisioni verticali · V/div. |

Entrambe restituiscono la **semi-ampiezza** dell'errore secondo le specifiche del costruttore (Keysight EDUX1002/DSOX1102), senza divisione per √3.

---

## Il blocco Incertezze

Parametri modificabili (celle gialle, in cima al blocco): divisioni verticali (8), % FS guadagno DC (3 %), % FS sotto soglia (4 %), soglia V/div (10 mV), % FS cursori ΔV (0,5 %), metodo (`quadratura` o `somma`).

Colonne, nell'ordine:

`Frequenza (Hz)` · `V_in (V)` · `V/div in (V)` · `σ V_in (V)` · `V_out (V)` · `V/div out (V)` · `σ V_out (V)` · `Gain H (dB)` · `σ Gain H (dB)`

- Per ogni tensione: σ = (guadagno DC + 0,5 %) · divisioni · V/div.
- Sul guadagno: σ = (20 / ln 10) · √((σ_in / V_in)² + (σ_out / V_out)²) per il metodo `quadratura`, oppure la somma dei due termini per `somma`.
- Se la tabella ha le colonne `V/div in (V)` e `V/div out (V)`, le scale vengono collegate da sole; una cella vuota eredita il valore della riga sopra. Altrimenti le celle V/div restano gialle, da compilare a mano.
- I blocchi occupano le colonne A–I, K–S, U–AC, e così via (passo di 10 colonne).

---

## Convenzioni sui nomi delle colonne

I nomi delle intestazioni sono un contratto con lo script e con il pacchetto Python: se li cambi, qualcosa smette di funzionare.

| Intestazione | Usata da |
|---|---|
| `Frequenza (Hz)`, `V_in (V)`, `V_out (V)` | Blocco Incertezze, Bode, notebook Python |
| `V/div in (V)`, `V/div out (V)` | Collegamento automatico delle scale nel blocco Incertezze |
| `Gain H (dB)` | Formula del guadagno nelle tabelle, Bode |
| `Note` | Aggiunta automaticamente a ogni tabella |

Gli altri nomi presenti nel dialogo (Fase, Δt/div, Tensione DC, Corrente, Tempo) sono liberi.

---

## Struttura del progetto

```
.
├── .clasp.json            (non versionato: contiene lo scriptId)
├── .claspignore
├── .gitignore
├── README.md
└── GoogleSheets_toolbox/
    ├── appsscript.json    manifest (fuso orario, runtime V8)
    ├── PersonalUi.js      menu del foglio (onOpen) e annotazione @OnlyCurrentDoc
    ├── SmartTable.js      dialogo, generazione tabelle, pulizia selezione
    ├── DialogoTabella.html  interfaccia del dialogo
    ├── Incertezze.js      blocco Incertezze
    ├── LabTools.js        Diagramma di Bode nel foglio
    └── SmartFunctions.js  funzioni CALCOLA_Aerr_*
```

I file `.js` condividono lo stesso ambito globale: per esempio `columnIndexToLetter`, definita in `SmartTable.js`, è usata anche da `Incertezze.js`.

---

## Sviluppo con clasp

Il codice si modifica in locale (VS Code) e si invia al foglio con [clasp](https://github.com/google/clasp).

**Una tantum**
1. Installa Node.js, poi `npm install -g @google/clasp`.
2. Attiva l'API di Apps Script su <https://script.google.com/home/usersettings>.
3. `clasp login`.
4. Crea `.clasp.json` nella radice del progetto:

```json
{
  "scriptId": "<ID dello script del template>",
  "rootDir": "GoogleSheets_toolbox"
}
```

`rootDir` serve perché i file stanno in una sottocartella: senza, i nomi online avrebbero il prefisso `GoogleSheets_toolbox/` e il dialogo non verrebbe trovato (`No HTML file named DialogoTabella`).

L'ID dello script si trova nell'editor Apps Script, sotto *Impostazioni progetto*. È diverso per ogni copia del foglio.

**Di solito**
```
clasp push      # invia i file locali ad Apps Script (sovrascrive la versione online)
clasp open      # apre l'editor dello script
```

Fai `clasp pull` solo dopo aver fatto commit: scarica la versione online e sovrascrive i file locali.

**Cose da sapere**
- `clasp push` aggiorna solo lo script a cui punta lo `scriptId`. Le **copie già fatte dagli utenti non si aggiornano**: hanno il loro script, copiato nel momento in cui hanno cliccato "Crea una copia". Un'ottimizzazione o una correzione vale solo per le copie future.
- Dopo un push sul template, prova sempre il risultato su una **nuova copia**, preferibilmente con un secondo account Google.
- Il file `.clasp.json` non è versionato (è in `.gitignore`): chi clona la repo se lo crea come sopra.

---

## Controlli prima di distribuire

Non ci sono test automatici: lo script si prova a mano su una copia del template.

- [ ] Il menu compare e l'autorizzazione va a buon fine.
- [ ] *Crea Nuova Sottotabella Dinamica* apre il dialogo e genera la tabella, con bordi e formule giusti.
- [ ] Una grandezza custom con apici o virgolette nel nome non rompe il dialogo, e un nome duplicato viene segnalato.
- [ ] *Crea Blocco Incertezze* funziona con e senza le colonne V/div.
- [ ] `=CALCOLA_Aerr_DELTAV(1; 8)` restituisce `0,28`.
- [ ] Il foglio letto da `SheetConnector` (Python) restituisce le colonne giuste.

---

## Limiti noti

- Una nuova tabella **sovrascrive** le celle che trova sotto, senza chiedere conferma.
- *Genera Diagramma di Bode* scrive "Gain H (dB)" nella quarta colonna della selezione; se è già occupata, si ferma con un avviso.
- Le formule sono scritte con il punto e virgola come separatore, e sono testate con impostazioni regionali italiane. In un'altra lingua del foglio, un errore di formula è il primo sospetto.
- Lo script non è verificato da Google: l'avviso "app non verificata" compare per ogni utente alla prima autorizzazione.