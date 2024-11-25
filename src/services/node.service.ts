import { Machine, User } from '@root/interfaces/local-db';
import { BaseService } from '@services/_base.service';
import { Request, Response } from 'express';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { StatusCodes } from 'http-status-codes';

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

class Service extends BaseService {
  constructor() {
    super();
  }

  postMachineConnection = async function (req: Request, res: Response) {
    try {
      const machine = req.body as Machine;
      const existing = machines.find((m) => m.machineID === machine.machineID);

      // update the server of existing machine
      if (existing) {
        existing.server = machine.server;
        writeMachines();
        res.status(StatusCodes.OK).send();
        return;
      }

      // add a new machine
      machines.push(machine);
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
      const user = req.body as User;
      const machine = machines.find((m) => m.machineID === user.machineID);

      // add user to existing queue
      if (machine) {
        machine.queue.push(user);
        res.status(StatusCodes.OK).send();
        return;
      }

      // add a placeholder machine (e.g. for when the machine reconnects)
      machines.push({
        machineID: user.machineID,
        server: '',
        queue: [user],
      });
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

      machines.forEach((m) => {
        m.queue = m.queue.filter((u) => u.session !== user.session);
      });

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };
}

export default new Service();
