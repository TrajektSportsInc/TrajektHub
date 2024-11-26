import AxiosHelper from '@classes/axios.helper';
import { Machine, User } from '@root/interfaces/local-db';
import { dbMachines, writeMachines } from '@root/local-db';
import { BaseService } from '@services/_base.service';
import { AxiosInstance } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const servers = process.env.SERVERS?.split(',') ?? [];

const axiosClients: {
  server: string;
  client: AxiosInstance;
}[] = servers.map((m) => ({
  server: m,
  client: AxiosHelper.instance(m),
}));

// notifies all servers about the current state of the machine and its queue (first entry is the active user)
const broadcast = (machineID: string) => {
  const machine = dbMachines.find((m) => m.machineID === machineID);

  if (!machine) {
    console.warn(
      `Skipped broadcasting re: ${machineID}, not found in machines list`
    );
    return;
  }

  if (machine.queue.length === 0) {
    console.warn(`Skipped broadcasting re: ${machineID}, queue is empty`);
    return;
  }

  const targetServer = axiosClients.find((c) => c.server === machine.server);

  if (targetServer) {
    console.log(
      `Narrowly broadcasting ${machineID} status to ${machine.server}`
    );

    targetServer.client.post('hub/broadcast', machine).catch((e) => {
      if (e.status === StatusCodes.NOT_FOUND) {
        return;
      }

      console.error(e);
    });
    return;
  }

  // hub doesn't know where the machine is, just try them all
  console.log(
    `Widely broadcasting ${machineID} status to all ${axiosClients.length} servers`
  );

  axiosClients.forEach((m) =>
    m.client.post('hub/broadcast', machine).catch((e) => {
      if (e.status === StatusCodes.NOT_FOUND) {
        return;
      }

      console.error(e);
    })
  );
};

class Service extends BaseService {
  constructor() {
    super();
  }

  // server just (re)connected => flush previously queued users for this server
  postServerConnection = async function (req: Request, res: Response) {
    try {
      const payloadServer = req.body as { server: string };

      if (!servers.includes(payloadServer.server)) {
        // provided server URL is not listed in the env configuration
        res.status(StatusCodes.SERVICE_UNAVAILABLE).send();
        return;
      }

      dbMachines.forEach((machine) => {
        const nextQueue = machine.queue.filter(
          (user) => user.server !== payloadServer.server
        );

        if (machine.queue.length === nextQueue.length) {
          // no change
          return;
        }

        machine.queue = nextQueue;
        broadcast(machine.machineID);
      });

      writeMachines();
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  // also used by the update endpoint since it's the same thing
  postMachineConnection = async function (req: Request, res: Response) {
    try {
      const payloadMachine = req.body as Machine;
      const existing = dbMachines.find(
        (m) => m.machineID === payloadMachine.machineID
      );

      if (existing) {
        // update an existing machine
        existing.server = payloadMachine.server;
        existing.rapsodo_serial = payloadMachine.rapsodo_serial;
      } else {
        // add a new machine
        dbMachines.push(payloadMachine);
      }

      // e.g. if someone was already in the queue before the machine connected
      broadcast(payloadMachine.machineID);
      writeMachines();
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postMachineDisconnection = async function (req: Request, res: Response) {
    try {
      const payloadMachine = req.body as Machine;

      const existing = dbMachines.find(
        (m) => m.machineID === payloadMachine.machineID
      );

      if (existing) {
        // mark the server as d/c until it reconnects so tracking requests don't need to be forwarded
        existing.server = '';
        writeMachines();
      }

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
      const existing = dbMachines.find(
        (m) => m.machineID === payloadUser.machineID
      );

      if (existing) {
        // add user to existing queue
        existing.queue.push(payloadUser);
      } else {
        // add a placeholder machine (e.g. for when the machine reconnects)
        dbMachines.push({
          machineID: payloadUser.machineID,
          server: '',
          rapsodo_serial: '',
          queue: [payloadUser],
        });
      }

      // e.g. the user is the first/only user in queue
      broadcast(payloadUser.machineID);
      writeMachines();
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

      dbMachines.forEach((m) => {
        const index = m.queue.findIndex((u) => u.session === user.session);
        if (index === -1) {
          return;
        }

        // remove the user from the queue
        m.queue.splice(index, 1);
        broadcast(m.machineID);
      });

      writeMachines();
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };
}

export default new Service();
