/**
 * @OnlyCurrentDoc
 */

function onOpen() {
var ui = SpreadsheetApp.getUi();
  
  // Primo menu: Gestione Tabelle
  ui.createMenu('Smart Table')
      .addItem('Crea Nuova Sottotabella Dinamica', 'apriFinestraCreaTabella')
      .addSeparator()
      .addItem('Pulisci Selezione', 'pulisciSelezioneCompleta')
      .addToUi();

  // Secondo menu: Tool di Laboratorio
  ui.createMenu('Tool Laboratorio')
      .addItem('Crea Blocco Incertezze', 'creaBloccoIncertezze')
      .addItem('Genera Diagramma di Bode', 'creaDiagrammaBodeDinamico')
      .addToUi();
}