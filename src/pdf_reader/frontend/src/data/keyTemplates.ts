// Key templates for different product types
// Based on keys_to_extract.txt specification

export interface KeyWithCategory {
  name: string
  category: string
}

// Keys common to all product types
const COMMON_KEYS: KeyWithCategory[] = [
  { name: 'Dateiname', category: 'OTHER' },
  { name: 'Titel (iiRDS)', category: 'OTHER' },
  { name: 'Sprache (iiRDS)', category: 'OTHER' },
  { name: 'hat Dokumentart', category: 'OTHER' },
  { name: 'hat VDI-2770-Dokumentkategorie', category: 'OTHER' },
  { name: 'Aufstellhöhe', category: 'AMBIENT INFORMATION' },
  { name: 'Umgebungstemp. Max', category: 'AMBIENT INFORMATION' },
  { name: 'Umgebungstemp. Min', category: 'AMBIENT INFORMATION' },
  { name: 'Abgeschnittener Blitzstoß', category: 'MAIN DATA' },
  { name: 'Spez. Kriechweg', category: 'INSULATOR PARAMETERS' },
  { name: 'Biegefestigkeit', category: 'INSULATOR PARAMETERS' },
  { name: 'Isolatorauswahl Hersteller', category: 'INSULATOR PARAMETERS' },
  { name: 'Blitzstoßspannung BIL', category: 'MAIN DATA' },
  { name: 'Max. Betriebsspannung Um', category: 'MAIN DATA' },
  { name: 'Min. Kriechweg', category: 'INSULATOR PARAMETERS' },
  { name: 'Verschmutzungsklasse', category: 'INSULATOR PARAMETERS' },
  { name: 'Prüfwechselspannung X', category: 'MAIN DATA' },
  { name: 'Prüfwechselspannung sekundär', category: 'MAIN DATA' },
  { name: 'Nennfrequenz fR', category: 'MAIN DATA' },
  { name: 'Schaltstoßspannung SIL', category: 'MAIN DATA' },
  { name: 'Stehwechselspannung trocken', category: 'MAIN DATA' },
  { name: 'Haltespannung bei 1 bar abs.', category: 'TESTING' },
  { name: 'bezieht sich auf Typenprüfung nach o.g. Norm', category: 'TESTING' },
  { name: 'Externer Beobachter', category: 'TESTING' },
  { name: 'Erweiterte Typenprüfung', category: 'TESTING' },
  { name: 'SIL gefordert', category: 'TESTING' },
  { name: 'Magnetisierungskennlinie U', category: 'TESTING' },
  { name: 'Magnetisierungskennlinie I', category: 'TESTING' },
  { name: 'Taupunktmessung', category: 'TESTING' },
  { name: 'Isolationswiderstandsmessung', category: 'TESTING' },
  { name: 'Erweiterte Routinetests & Sonderprüfungen', category: 'TESTING' },
  { name: 'BIL gefordert', category: 'TESTING' },
  { name: 'Dichtewächtertyp', category: 'GAS INFORMATION' },
  { name: 'Schutzschlauch DW-Kabel', category: 'GAS INFORMATION' },
  { name: 'DW-Hersteller', category: 'GAS INFORMATION' },
  { name: 'Anzahl DW Schaltkontakte', category: 'GAS INFORMATION' },
  { name: 'DW zum Boden geneigt', category: 'GAS INFORMATION' },
  { name: 'bezieht sich auf DW - Schaltkontaktebei fallendem Druck', category: 'GAS INFORMATION' },
  { name: 'DW-Prüfeinrichtung', category: 'GAS INFORMATION' },
  { name: 'DW im KK verdrahtet', category: 'GAS INFORMATION' },
  { name: 'Erdkontakte seperat geerdet', category: 'GAS INFORMATION' },
  { name: 'Druckfüllventil', category: 'GAS INFORMATION' },
  { name: 'Hybrid Densimeter', category: 'GAS INFORMATION' },
  { name: 'Zulässige Leckrate', category: 'GAS INFORMATION' },
  { name: 'Druckangabe am Dichtewächter', category: 'GAS INFORMATION' },
  { name: 'Sensgear-Box gefordert', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Doku im KK', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Primäranschluss', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Wandlerpass', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Erdungsanschluss', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Material Erdungsanschluss', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Beistellteile TG seitig', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Hilfsschalterart', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Barcode auf LS', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Hersteller ID-Nr. auf LS', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Material Leistungsschild', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Sollbruchstellen', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Abdeckung Kundenklemmen', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Kabelverschraubungen', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Sprache Leistungsschild', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Klemmenkastenheizung', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Detail der Sicherungen', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Sicherungen', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Funkenstrecke', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Klemmentype', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Erdungsschiene', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Klemmenkastenart', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Klemmentype DW', category: 'CONSTRUCTION INFORMATION' },
  { name: 'PT100 gefordert', category: 'CONSTRUCTION INFORMATION' },
  { name: 'Wandlerbezeichnung auf LS', category: 'CONSTRUCTION INFORMATION' },
]

// Keys specific to Spannungswandler (Voltage Transformer)
const SPANNUNGSWANDLER_KEYS: KeyWithCategory[] = [
  { name: 'Genauigkeitsklasse Wicklung 1', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Genauigkeitsklasse Wicklung 2', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Genauigkeitsklasse Wicklung 3', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Genauigkeitsklasse Wicklung 4', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Genauigkeitsklasse Wicklung 5', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Leistung Wicklung 1', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Leistung Wicklung 2', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Leistung Wicklung 3', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Leistung Wicklung 4', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Leistung Wicklung 5', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Leistung Erdschluss', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung primär (V) Wicklung 1', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung primär (V) Wicklung 2', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung primär (V) Wicklung 3', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung primär (V) Wicklung 4', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung primär (V) Wicklung 5', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung primär (V) Erdschluss', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung sekundär (V) Wicklung 1', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung sekundär (V) Wicklung 2', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung sekundär (V) Wicklung 3', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung sekundär (V) Wicklung 4', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung sekundär (V) Wicklung 5', category: 'VOLTAGE TRANSFORMER RATING' },
  { name: 'Nennspannung sekundär (V) Erdschluss', category: 'VOLTAGE TRANSFORMER RATING' },
]

// Keys specific to Stromwandler (Current Transformer)
// Generated programmatically to avoid repetition
const STROMWANDLER_KEYS: KeyWithCategory[] = (() => {
  const keys: KeyWithCategory[] = []
  const category = 'CURRENT TRANSFORMER RATING'

  const keyPatterns = [
    'Genauigkeitsklasse Kern',
    '1. Stromfluß t´ [ms] Kern',
    '2. Stromfluß t´´ [ms] Kern',
    '1. Stromfluß tal´ [ms] Kern',
    '2. Stromfluß tal´´ [ms] Kern',
    'Totzeit ttfr [ms] Kern',
    'Dimensionierungsfaktor Kern',
    'Erweiterter Messbereich (%) Kern',
    'Kniepunkt Ek (V) Kern',
    'Magnetisierungsstrom (mA) Kern',
    'Leistung Kern',
    'Nennstrom primär (A) Kern',
    'Nennstrom sekundär (A) Kern',
    'Sekundärwiderstand (ohm) Kern',
    'Kurzschlußstromfaktor Kern',
    'Bemessungszeitkonstante primär Tp (ms) Kern',
  ]

  for (const pattern of keyPatterns) {
    for (let i = 1; i <= 7; i++) {
      keys.push({ name: `${pattern} ${i}`, category })
    }
  }

  return keys
})()

// Product type to keys mapping
export const KEY_TEMPLATES: Record<string, KeyWithCategory[]> = {
  'Stromwandler': [...COMMON_KEYS, ...STROMWANDLER_KEYS],
  'Spannungswandler': [...COMMON_KEYS, ...SPANNUNGSWANDLER_KEYS],
  'Kombiwandler': [...COMMON_KEYS, ...STROMWANDLER_KEYS, ...SPANNUNGSWANDLER_KEYS],
}

// Helper function to get keys for a product type
export function getKeysForProductType(productType: string): KeyWithCategory[] {
  return KEY_TEMPLATES[productType] || []
}

// Helper function to get key count for a product type
export function getKeyCountForProductType(productType: string): number {
  return getKeysForProductType(productType).length
}

// Helper function to filter keys based on detected core/winding counts
export function filterKeysByCount(
  keys: KeyWithCategory[],
  maxCoreNumber: number,
  maxWindingNumber: number
): KeyWithCategory[] {
  return keys.filter((key) => {
    // Check if key contains "Kern X" pattern
    const coreMatch = key.name.match(/Kern (\d+)/)
    if (coreMatch) {
      const coreNum = parseInt(coreMatch[1], 10)
      return coreNum <= maxCoreNumber
    }

    // Check if key contains "Wicklung X" pattern
    const windingMatch = key.name.match(/Wicklung (\d+)/)
    if (windingMatch) {
      const windingNum = parseInt(windingMatch[1], 10)
      return windingNum <= maxWindingNumber
    }

    // Keep all other keys (common keys, etc.)
    return true
  })
}
