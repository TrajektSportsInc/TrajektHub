export interface Machine {
  machineID: string;
  server: string;

  // for rerouting rapsodo POST requests
  rapsodo_serial: string | undefined;

  // will reset whenever server starts up
  queue: User[];
}

export interface User {
  email: string;
  machineID: string;
  server: string;
  session: string;
}
