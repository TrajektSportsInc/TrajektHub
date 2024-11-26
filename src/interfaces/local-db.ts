export interface HubMachine {
  machineID: string;
  server: string;

  // for rerouting rapsodo POST requests
  rapsodo_serial: string | undefined;

  // will reset whenever server starts up
  queue: HubUser[];
}

export interface HubUser {
  created: number;
  email: string;
  machineID: string;
  server: string;
  session: string;
}
