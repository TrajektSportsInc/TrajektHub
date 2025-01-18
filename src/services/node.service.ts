import { ignoreNotFound } from '@classes/axios.helper';
import { HubMachine, HubUser } from '@interfaces/hub';
import { dbMachines } from '@root/local-db';
import { SERVER_CLIENTS, SERVERS } from '@server/connections';
import { BaseService } from '@services/_base.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

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

  const targetServer = SERVER_CLIENTS.find((c) => c.server === machine.server);

  if (targetServer) {
    console.log(
      `Narrowly broadcasting ${machineID} status to ${machine.server}`
    );

    targetServer.client.post('hub/broadcast', machine).catch(ignoreNotFound);
    return;
  }

  // hub doesn't know where the machine is, just try them all
  console.log(
    `Widely broadcasting ${machineID} status to all ${SERVER_CLIENTS.length} servers`
  );

  SERVER_CLIENTS.forEach((s) =>
    s.client.post('hub/broadcast', machine).catch(ignoreNotFound)
  );
};

class Service extends BaseService {
  constructor() {
    super();
  }

  // server just (re)connected => flush previously queued users for this server
  postServerConnection = async function (req: Request, res: Response) {
    try {
      const payload = req.body as { server: string };

      if (!SERVERS.includes(payload.server)) {
        // provided server URL is not listed in the env configuration
        res.status(StatusCodes.SERVICE_UNAVAILABLE).send();
        return;
      }

      dbMachines.forEach((machine) => {
        const nextQueue = machine.queue.filter(
          (user) => user.server !== payload.server
        );

        if (machine.queue.length === nextQueue.length) {
          // no change
          return;
        }

        machine.queue = nextQueue;
        broadcast(machine.machineID);
      });

      // writeMachines();
      console.log({
        event: 'server connected',
        payload,
      });
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  // also used by the update endpoint since it's the same thing
  postMachineConnection = async function (req: Request, res: Response) {
    try {
      const payload = req.body as HubMachine;
      const existing = dbMachines.find(
        (m) => m.machineID === payload.machineID
      );

      if (existing) {
        // update an existing machine
        existing.server = payload.server;
        existing.rapsodo_serial = payload.rapsodo_serial;
      } else {
        // add a new machine
        dbMachines.push(payload);
      }

      // e.g. if someone was already in the queue before the machine connected
      broadcast(payload.machineID);
      // writeMachines();
      console.log(
        'machine connected',
        dbMachines.map((m) => ({
          ...m,
          queue: m.queue.map((q) => `${q.server} - ${q.session} - ${q.email}`),
        }))
      );
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postMachineDisconnection = async function (req: Request, res: Response) {
    try {
      const payload = req.body as HubMachine;

      const existing = dbMachines.find(
        (m) => m.machineID === payload.machineID
      );

      if (existing) {
        // mark the server as d/c until it reconnects so tracking requests don't need to be forwarded
        existing.server = undefined;
        // writeMachines();
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
      const payload = req.body as HubUser;
      const existing = dbMachines.find(
        (m) => m.machineID === payload.machineID
      );

      if (existing) {
        // add user to existing queue
        existing.queue.push(payload);
      } else {
        // add a placeholder machine (e.g. for when the machine reconnects)
        dbMachines.push({
          machineID: payload.machineID,
          server: undefined,
          rapsodo_serial: undefined,
          queue: [payload],
        });
      }

      // e.g. the user is the first/only user in queue
      broadcast(payload.machineID);
      // writeMachines();
      console.log(
        'user connected',
        dbMachines.map((m) => ({
          ...m,
          queue: m.queue.map((q) => `${q.server} - ${q.session} - ${q.email}`),
        }))
      );
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
      const user = req.body as HubUser;

      dbMachines.forEach((m) => {
        const index = m.queue.findIndex((u) => u.session === user.session);
        if (index === -1) {
          return;
        }

        // remove the user from the queue
        m.queue.splice(index, 1);
        broadcast(m.machineID);
      });

      // writeMachines();
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  /**
   * user asks for control => notify currently active user
   */
  postControlRequest = async function (req: Request, res: Response) {
    try {
      const requester = req.body as HubUser;

      const machine = dbMachines.find(
        (m) =>
          m.machineID === requester.machineID &&
          m.queue.map((u) => u.session).includes(requester.session)
      );

      if (!machine) {
        throw new Error(
          `Failed to find machine with machineID "${requester.machineID}" with queue containing "${requester.session}" for control request`
        );
      }

      if (!machine.server) {
        throw new Error(
          `"${requester.machineID}" is not connected to any server for control request`
        );
      }

      const firstQueue = machine.queue[0];

      if (firstQueue?.session === requester.session) {
        // user is the first one in queue but somehow not active, which shouldn't trigger
        // broadcasting should cause the server to activate the user, fixing the situaton
        broadcast(requester.machineID);
        res.status(StatusCodes.OK).send();
        return;
      }

      const server = SERVER_CLIENTS.find((m) => m.server === machine.server);

      if (!server) {
        throw new Error(
          `Failed to find server with URL "${machine.server}" for control request`
        );
      }

      server.client
        .post('hub/control/request', requester)
        .then(() => {
          // OK => requesting server will wait
          res.status(StatusCodes.OK).send();
        })
        .catch((error) => {
          console.error(error);
          // NOT_FOUND => requesting server will attempt to handle things itself
          res.status(StatusCodes.NOT_FOUND).send();
        });
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  // forward the active user's response to the server that the requester is connected to
  postControlResponse = async function (req: Request, res: Response) {
    try {
      // accept | reject
      const { action } = req.params;
      const requester = req.body as HubUser;

      const server = SERVER_CLIENTS.find((m) => m.server === requester.server);

      if (!server) {
        throw new Error(
          `Failed to find server with URL "${requester.server}" for control response`
        );
      }

      server.client
        .post(`hub/control/response/${action}`, requester)
        .then(() => {
          if (action === 'accept') {
            const machine = dbMachines.find(
              (m) => m.machineID === requester.machineID
            );

            if (!machine) {
              return;
            }

            // move the requester to the front of the queue
            machine.queue.sort((a, b) =>
              a.session === requester.session
                ? -1
                : a.queueDate < b.queueDate
                  ? -1
                  : 1
            );

            broadcast(machine.machineID);
          }
        })
        .catch(ignoreNotFound);

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  // active user failed to respond to the requester, requester will forcefully take control
  postControlForce = async function (req: Request, res: Response) {
    try {
      const requester = req.body as HubUser;

      const machine = dbMachines.find(
        (m) =>
          m.machineID === requester.machineID &&
          m.queue.map((u) => u.session).includes(requester.session)
      );

      if (!machine) {
        throw new Error(
          `Failed to find machine with machineID "${requester.machineID}" with queue containing "${requester.session}" for control force`
        );
      }

      // move the requester to the front of the queue
      machine.queue.sort((a, b) =>
        a.session === requester.session
          ? -1
          : a.queueDate < b.queueDate
            ? -1
            : 1
      );

      broadcast(machine.machineID);
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postQueueChange = async function (req: Request, res: Response) {
    try {
      const payload = req.body as HubMachine;
      const existing = dbMachines.find(
        (m) => m.machineID === payload.machineID
      );

      if (existing) {
        // update an existing machine
        existing.queue = payload.queue;
      } else {
        // add a new machine
        dbMachines.push(payload);
      }

      // e.g. if someone was already in the queue before the machine connected
      broadcast(payload.machineID);
      // writeMachines();
      console.log({
        event: 'queue changed',
        payload,
        existing,
      });
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };
}

export default new Service();
