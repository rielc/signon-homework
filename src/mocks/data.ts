import type { Train, RBC, RBCStatus, Relation } from '../types';

const STORAGE_VERSION = 3;

const STORAGE_KEYS = {
  trains: 'msw:trains',
  rbcs: 'msw:rbcs',
  relations: 'msw:relations',
  version: 'msw:version',
} as const;

const trainTypes = ['ICE', 'RE', 'RB', 'S-Bahn', 'EC', 'EN', 'TGV', 'IC'] as const;

const operators = ['DB', 'VVS', 'VBB', 'MVV', 'HVV', 'BVG', 'SBB', 'ÖBB'];

const trainNotes = [
  'Vorzugsweise auf Hauptstrecke',
  'Erweiterte Sicherheitsausstattung',
  'Wartung im nächsten Quartal geplant',
  'Sondertraining für neues ETCS-Modul',
  'Pilotbetrieb läuft',
];

const cities = [
  'Frankfurt', 'Berlin', 'München', 'Hamburg', 'Köln', 'Stuttgart', 'Düsseldorf',
  'Leipzig', 'Dortmund', 'Essen', 'Bremen', 'Dresden', 'Hannover', 'Nürnberg',
  'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster',
  'Mannheim', 'Augsburg', 'Wiesbaden', 'Braunschweig', 'Kiel',
  'Aachen', 'Halle', 'Magdeburg', 'Freiburg', 'Erfurt',
  'Rostock', 'Mainz', 'Kassel', 'Lübeck', 'Saarbrücken',
  'Potsdam', 'Ulm', 'Regensburg', 'Würzburg', 'Karlsruhe',
  'Ingolstadt', 'Heilbronn', 'Pforzheim', 'Darmstadt', 'Trier',
  'Heidelberg', 'Konstanz', 'Passau', 'Bamberg', 'Göttingen',
];

const rbcNames = [
  'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
  'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
  'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
];

const manufacturers = [
  'Siemens', 'Alstom', 'Thales', 'Hitachi Rail', 'Bombardier',
  'CAF Signalling', 'AZD Praha', 'Mermec',
];

const rbcNotes = [
  'Firmware-Update ausstehend',
  'Letzte Inspektion: Q1 2025',
  'Redundantes System vorhanden',
  'Anbindung an Nachbar-RBC geplant',
  'Testbetrieb abgeschlossen',
  'Hardware-Austausch im nächsten Wartungsfenster',
];


// determenistic random generator for consistent mock data across sessions

function getLPMRandomGenerator(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const rand = getLPMRandomGenerator(42);


function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(rand() * chars.length)];
  }
  return result;
}

function generateSeedTrains(): Train[] {
  return Array.from({ length: 100 }, (_, i) => {
    const trainType = trainTypes[Math.floor(rand() * trainTypes.length)];
    const number = Math.floor(rand() * 900) + 100;
    const operator = operators[Math.floor(rand() * operators.length)];
    const notes = rand() < 0.3 ? trainNotes[Math.floor(rand() * trainNotes.length)] : '';
    return {
      id: `t${i + 1}`,
      trainType,
      trainNumber: `${number}`,
      operator,
      notes,
    };
  });
}

function generateSeedRBCs(): RBC[] {
  return Array.from({ length: 100 }, (_, i) => {
    const namePrefix = rbcNames[i % rbcNames.length];
    const nameSuffix = i >= rbcNames.length ? ` ${Math.floor(i / rbcNames.length) + 1}` : '';
    const location = cities[i % cities.length];
    const manufacturer = manufacturers[Math.floor(rand() * manufacturers.length)];
    const statusRoll = rand();
    const status: RBCStatus = statusRoll < 0.7 ? 'operational' : statusRoll < 0.9 ? 'maintenance' : 'decommissioned';
    const notes = rand() < 0.3 ? rbcNotes[Math.floor(rand() * rbcNotes.length)] : '';
    return {
      id: `r${i + 1}`,
      name: `${namePrefix}${nameSuffix}`,
      location,
      manufacturer,
      status,
      notes,
    };
  });
}

function generateSeedRelations(trains: Train[], rbcs: RBC[]): Relation[] {
  const result: Relation[] = [];
  for (const train of trains) {
    const connectionCount = Math.floor(rand() * 5) + 1;
    const usedRbcs = new Set<string>();
    for (let j = 0; j < connectionCount; j++) {
      const rbcIndex = Math.floor(rand() * rbcs.length);
      const rbc = rbcs[rbcIndex];
      if (usedRbcs.has(rbc.id)) continue;
      usedRbcs.add(rbc.id);
      result.push({
        trainId: train.id,
        rbcId: rbc.id,
        key: `ak-${randomHex(8)}`,
      });
    }
  }
  return result;
}

// --- localStorage-backed store ---

function migrateIfNeeded(): void {
  const storedVersion = localStorage.getItem(STORAGE_KEYS.version);
  if (storedVersion !== String(STORAGE_VERSION)) {
    localStorage.removeItem(STORAGE_KEYS.trains);
    localStorage.removeItem(STORAGE_KEYS.rbcs);
    localStorage.removeItem(STORAGE_KEYS.relations);
    localStorage.setItem(STORAGE_KEYS.version, String(STORAGE_VERSION));
  }
}

migrateIfNeeded();

function load<T>(key: string, seedFn: () => T): T {
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored) as T;
  }
  const data = seedFn();
  localStorage.setItem(key, JSON.stringify(data));
  return data;
}

function save<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export let trains: Train[] = load(STORAGE_KEYS.trains, generateSeedTrains);
export let rbcs: RBC[] = load(STORAGE_KEYS.rbcs, generateSeedRBCs);
export let relations: Relation[] = load(STORAGE_KEYS.relations, () =>
  generateSeedRelations(trains, rbcs),
);

export function persistTrains(): void {
  save(STORAGE_KEYS.trains, trains);
}

export function persistRBCs(): void {
  save(STORAGE_KEYS.rbcs, rbcs);
}

export function persistRelations(): void {
  save(STORAGE_KEYS.relations, relations);
}

export function resetAll(): void {
  localStorage.removeItem(STORAGE_KEYS.trains);
  localStorage.removeItem(STORAGE_KEYS.rbcs);
  localStorage.removeItem(STORAGE_KEYS.relations);
  const seedTrains = generateSeedTrains();
  const seedRBCs = generateSeedRBCs();
  trains.length = 0;
  trains.push(...seedTrains);
  rbcs.length = 0;
  rbcs.push(...seedRBCs);
  relations.length = 0;
  relations.push(...generateSeedRelations(seedTrains, seedRBCs));
  persistTrains();
  persistRBCs();
  persistRelations();
}
