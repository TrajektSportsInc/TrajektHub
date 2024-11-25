import { Machine } from '@interfaces/local-db';
import { existsSync, readFileSync, writeFileSync } from 'fs';

const DB_PATH = 'machines.json';

const readMachines = (): Machine[] => {
  if (!existsSync(DB_PATH)) {
    return [];
  }

  const data: Machine[] = JSON.parse(readFileSync(DB_PATH, 'utf-8'));

  // reset the queue to nothing on startup
  data.forEach((m) => (m.queue = []));

  return data;
};

export const dbMachines = readMachines();

// only necessary when machines change
export const writeMachines = () => {
  writeFileSync(DB_PATH, JSON.stringify(dbMachines, null, 2));
};
