import AxiosHelper from '@classes/axios.helper';
import { Machine, User } from '@root/interfaces/local-db';
import { dbMachines, writeMachines } from '@root/local-db';
import { BaseService } from '@services/_base.service';
import { AxiosInstance } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const servers = process.env.SERVERS?.split(',') ?? [];

const axiosClients: {
  url: string;
  client: AxiosInstance;
}[] = servers.map((url) => ({
  url: url,
  client: AxiosHelper.instance(url),
}));

// notifies all servers about the current state of the machine and its queue
const broadcast = (machineID: string) => {
  const machine = dbMachines.find((m) => m.machineID === machineID);

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

  postMachineConnection = async function (req: Request, res: Response) {
    try {
      const payloadMachine = req.body as Machine;
      const existing = dbMachines.find(
        (m) => m.machineID === payloadMachine.machineID
      );

      if (existing) {
        // update the server of existing machine
        existing.server = payloadMachine.server;
        // e.g. if someone was already in the queue before the machine connected
        broadcast(payloadMachine.machineID);
      } else {
        // add a new machine
        dbMachines.push(payloadMachine);
      }

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

        // e.g. the user is the first/only user in queue
        broadcast(payloadUser.machineID);
      } else {
        // add a placeholder machine (e.g. for when the machine reconnects)
        dbMachines.push({
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

      dbMachines.forEach((m) => {
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
