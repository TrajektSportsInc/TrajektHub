export interface HubMachine {
  machineID: string;
  server: string | undefined;

  // for rerouting rapsodo POST requests
  rapsodo_serial: string | undefined;

  // for rerouting trackman POST requests
  trackman_session: string | undefined;

  // will reset whenever server starts up
  queue: HubUser[];
}

export interface HubUser {
  queueDate: number;
  email: string;
  machineID: string;
  server: string;
  session: string;
}
