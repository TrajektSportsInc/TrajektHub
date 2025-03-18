import { ArrayHelper } from '@classes/array.helper';
import AxiosHelper from '@classes/axios.helper';
import { ITrackmanBall } from '@interfaces/trackman/ball';
import { ITrackmanSession } from '@interfaces/trackman/session';
import { dbMachines } from '@root/local-db';
import { BaseService } from '@services/_base.service';
import { AxiosInstance } from 'axios';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const servers = process.env.SERVERS?.split(',') ?? [];

const TM_SUBJECT = 'PlayByPlayFeed';

const axiosClients: {
  url: string;
  client: AxiosInstance;
}[] = servers.map((url) => ({
  url: url,
  client: AxiosHelper.instance(url),
}));

class Service extends BaseService {
  constructor() {
    super();
  }

  postRapsodo = async function (req: Request, res: Response) {
    try {
      const payload = req.body as { DEBUG_SerialNumber: string };

      if (!payload.DEBUG_SerialNumber) {
        throw new Error(
          'No DEBUG_SerialNumber provided with Rapsodo POST request'
        );
      }

      const machine = dbMachines.find(
        (m) => m.rapsodo_serial === payload.DEBUG_SerialNumber
      );

      if (!machine) {
        throw new Error(
          `Failed to find machine with rapsodo_serial "${payload.DEBUG_SerialNumber}" for Rapsodo POST request`
        );
      }

      if (!machine.server) {
        throw new Error(
          `${machine.machineID} is not connected to any server for Rapsodo POST request`
        );
      }

      axiosClients
        .find((c) => c.url === machine.server)
        ?.client.post('state/rapsodo', req.body);

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postTrackmanBall = async function (req: Request, res: Response) {
    const payload = req.body as ITrackmanBall[];

    try {
      const ball = payload.find((b) => b.subject === TM_SUBJECT);

      if (!ball) {
        throw new Error(
          `Failed to find any ball with subject "${TM_SUBJECT}", found: ${ArrayHelper.unique(
            payload.map((b) => b.subject)
          ).join(', ')}`
        );
      }

      const machine = dbMachines.find(
        (m) => m.trackman_session === ball.data.SessionId
      );

      if (!machine) {
        throw new Error(
          `Failed to find machine with trackman_session "${ball.data.SessionId}" for Trackman POST ball request`
        );
      }

      if (!machine.server) {
        throw new Error(
          `${machine.machineID} is not connected to any server for Trackman POST ball request`
        );
      }

      axiosClients
        .find((c) => c.url === machine.server)
        ?.client.post('trackman/ball', req.body);

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e, payload);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postTrackmanSession = async function (req: Request, res: Response) {
    const payload = req.body as ITrackmanSession[];

    try {
      const session = payload.find((b) => b.subject === TM_SUBJECT);

      if (!session) {
        throw new Error(
          `Failed to find any Trackman session with subject "${TM_SUBJECT}", found: ${ArrayHelper.unique(
            payload.map((b) => b.subject)
          ).join(', ')}`
        );
      }

      const pitcherNames = session.data.Pitchers.map((p) => p.NameRef);

      const firstMachineID = pitcherNames
        .map((n) => {
          // * node server should also ignore idTail for TM requests relayed from the hub
          // * because the IDs if the same machine are not guaranteed to match between DBs (e.g. dev vs prod DB)
          const [idTail, machineID] = n.split(', ');
          return machineID;
        })
        .find((m) => m);

      if (!firstMachineID) {
        throw new Error(
          `Failed to find machineID from pitcher names for Trackman POST session request (${pitcherNames.join(', ')})`
        );
      }

      const machine = dbMachines.find((m) => m.machineID === firstMachineID);

      if (!machine) {
        throw new Error(
          `Failed to find machine with machineID "${firstMachineID}" for Trackman POST session request`
        );
      }

      if (!machine.server) {
        throw new Error(
          `${machine.machineID} is not connected to any server for Trackman POST session request`
        );
      }

      // for identifying this machine when subsequent ball requests arrive
      machine.trackman_session = session.data.SessionId;

      axiosClients
        .find((c) => c.url === machine.server)
        ?.client.post('trackman/session', req.body);

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e, payload);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postMSBS = async function (req: Request, res: Response) {
    const payload = req.body as { machineID: string };

    try {
      const machine = dbMachines.find((m) => m.machineID === payload.machineID);

      if (!machine) {
        throw new Error(
          `Failed to find machine with machineID "${payload.machineID}" for Vision POST request`
        );
      }

      if (!machine.server) {
        throw new Error(
          `${machine.machineID} is not connected to any server for Vision POST request`
        );
      }

      axiosClients
        .find((c) => c.url === machine.server)
        ?.client.post('state/msbs', req.body);

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e, payload);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };
}

export default new Service();
