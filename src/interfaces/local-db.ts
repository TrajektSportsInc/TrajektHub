export interface Machine {
  machineID: string;
  server: string;

  // will reset whenever server starts up
  queue: User[];
}

export interface User {
  email: string;
  machineID: string;
  server: string;
  session: string;
}
