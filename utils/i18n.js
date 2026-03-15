/**
 * i18n.js — Sipò 4 Lang: FR, CR (Kreyòl), ES, EN
 * Sistem traduksyon senp pou LA-PROBITE-BORLETTE
 */

export const LANGS = [
  { code:'CR', label:'Kreyòl', flag:'🇭🇹' },
  { code:'FR', label:'Français', flag:'🇫🇷' },
  { code:'ES', label:'Español', flag:'🇪🇸' },
  { code:'EN', label:'English', flag:'🇺🇸' },
];

export const T = {
  // Navigation
  dashboard:     { CR:'Tablo Bò',     FR:'Tableau de bord', ES:'Panel',       EN:'Dashboard' },
  agents:        { CR:'Ajan / POS',   FR:'Agents / POS',    ES:'Agentes',     EN:'Agents' },
  rapport:       { CR:'Rapò',         FR:'Rapport',         ES:'Reporte',     EN:'Report' },
  journalier:    { CR:'Jounalyè',     FR:'Journalier',      ES:'Diario',      EN:'Daily' },
  gagnant:       { CR:'Ganyan',       FR:'Gagnant',         ES:'Ganador',     EN:'Winner' },
  elimine:       { CR:'Elimine',      FR:'Éliminé',         ES:'Eliminado',   EN:'Voided' },
  defisi:        { CR:'Defisi',       FR:'Déficit',         ES:'Déficit',     EN:'Deficit' },
  kontabilite:   { CR:'Kontabilite',  FR:'Comptabilité',    ES:'Contabilidad',EN:'Accounting' },
  // Actions
  cherche:       { CR:'Chèche',       FR:'Rechercher',      ES:'Buscar',      EN:'Search' },
  imprimer:      { CR:'Enprime',      FR:'Imprimer',        ES:'Imprimir',    EN:'Print' },
  modifier:      { CR:'Modifye',      FR:'Modifier',        ES:'Modificar',   EN:'Edit' },
  sauvegarder:   { CR:'Sove',         FR:'Sauvegarder',     ES:'Guardar',     EN:'Save' },
  annuler:       { CR:'Anile',        FR:'Annuler',         ES:'Cancelar',    EN:'Cancel' },
  // Rapò
  totalVente:    { CR:'Total Vant',   FR:'Total Ventes',    ES:'Total Ventas',EN:'Total Sales' },
  totalGain:     { CR:'Total Gain',   FR:'Total Gains',     ES:'Total Ganan', EN:'Total Won' },
  bilan:         { CR:'Bilan',        FR:'Bilan',           ES:'Balance',     EN:'Balance' },
  debut:         { CR:'Debut',        FR:'Début',           ES:'Inicio',      EN:'Start' },
  fin:           { CR:'Fin',          FR:'Fin',             ES:'Fin',         EN:'End' },
  // Status
  connecte:      { CR:'Konekte',      FR:'Connecté',        ES:'Conectado',   EN:'Connected' },
  deconnecte:    { CR:'Dekonekte',    FR:'Déconnecté',      ES:'Desconectado',EN:'Disconnected' },
  actif:         { CR:'Aktif',        FR:'Actif',           ES:'Activo',      EN:'Active' },
  inactif:       { CR:'Inaktif',      FR:'Inactif',         ES:'Inactivo',    EN:'Inactive' },
};

export function tr(key, lang='CR') {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] || entry['CR'] || key;
}

// Hook pou detekte lang yo sove
export function getLang() {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('borlette_lang') || 'CR';
  }
  return 'CR';
}
export function setLang(code) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('borlette_lang', code);
    window.dispatchEvent(new Event('langchange'));
  }
}
