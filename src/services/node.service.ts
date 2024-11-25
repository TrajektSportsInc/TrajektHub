import AxiosHelper from '@classes/axios.helper';
import { Machine, User } from '@root/interfaces/local-db';
import { BaseService } from '@services/_base.service';
import { AxiosInstance } from 'axios';
import { Request, Response } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { StatusCodes } from 'http-status-codes';

const servers = process.env.SERVERS?.split(',') ?? [];

const axiosClients: {
  url: string;
  client: AxiosInstance;
}[] = servers.map((url) => ({
  url: url,
  client: AxiosHelper.instance(url),
}));

const dbPath = 'machines.json';

// setup machines.json file
const machines: Machine[] = existsSync(dbPath)
  ? JSON.parse(readFileSync(dbPath, 'utf-8'))
  : [];

// reset the queue to nothing on startup
machines.forEach((m) => (m.queue = []));

// only necessary when machines change
const writeMachines = () => {
  const data = machines.map((m) => {
    const o: Machine = {
      ...m,
      // always empty the queue
      queue: [],
    };

    return o;
  });

  writeFileSync(dbPath, JSON.stringify(data));
};

// notifies all servers about the current state of the machine and its queue
const broadcast = (machineID: string) => {
  const machine = machines.find((m) => m.machineID === machineID);

  if (!machine) {
    console.warn(
      'Skipped broadcasting to ${machineID}, not found in machines list'
    );
    return;
  }

  console.log(
    `Broadcasting ${machineID} status to ${axiosClients.length} servers!`
  );
  axiosClients.forEach((m) =>
    m.client.post('hub/broadcast', machine).catch((e) => console.error(e))
  );
};

class Service extends BaseService {
  constructor() {
    super();
  }

  postMachineConnection = async function (req: Request, res: Response) {
    try {
      const payloadMachine = req.body as Machine;
      const existing = machines.find(
        (m) => m.machineID === payloadMachine.machineID
      );

      if (existing) {
        // update the server of existing machine
        existing.server = payloadMachine.server;
        // e.g. if someone was already in the queue before the machine connected
        broadcast(payloadMachine.machineID);
      } else {
        // add a new machine
        machines.push(payloadMachine);
      }

      writeMachines();
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  /**
   * user connects to TW => add them to the queue for the relevant machine
   */
  postUserConnection = async function (req: Request, res: Response) {
    try {
      const payloadUser = req.body as User;
      const existing = machines.find(
        (m) => m.machineID === payloadUser.machineID
      );

      if (existing) {
        // add user to existing queue
        existing.queue.push(payloadUser);

        // e.g. the user is the first/only user in queue
        broadcast(payloadUser.machineID);
      } else {
        // add a placeholder machine (e.g. for when the machine reconnects)
        machines.push({
          machineID: payloadUser.machineID,
          server: '',
          queue: [payloadUser],
        });
        writeMachines();
        // no need to broadcast because the machine isn't connected anywhere (yet)
      }

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  /**
   * user disconnects from TW => remove them from all queues
   */
  postUserDisconnection = async function (req: Request, res: Response) {
    try {
      const user = req.body as User;

      machines.forEach((m) => {
        const index = m.queue.findIndex((u) => u.session === user.session);
        if (index === -1) {
          return;
        }

        // remove the user from the queue
        m.queue.splice(index, 1);
        broadcast(m.machineID);
      });

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };
}

export default new Service();
