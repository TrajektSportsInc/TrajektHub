import { HubMachine } from '@interfaces/local-db';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const DB_PATH = 'machines.json';

const readMachines = (): HubMachine[] => {
  if (!existsSync(DB_PATH)) {
    return [];
  }

  const data: HubMachine[] = JSON.parse(readFileSync(DB_PATH, 'utf-8'));

  // reset the queue to nothing on startup
  data.forEach((m) => (m.queue = []));

  return data;
};

// export const dbMachines = readMachines();

// start from scratch since scan on startup should reliably rebuild this
export const dbMachines: HubMachine[] = [];

// only necessary when machines change
export const writeMachines = () => {
  writeFileSync(DB_PATH, JSON.stringify(dbMachines, null, 2));
};
