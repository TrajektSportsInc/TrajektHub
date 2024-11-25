import AxiosHelper from '@classes/axios.helper';
import { dbMachines } from '@root/local-db';
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
    try {
      const { machineID } = req.params;

      const machine = dbMachines.find((m) => m.machineID === machineID);

      if (!machine) {
        throw new Error(
          `Failed to find machine with machineID "${machineID}" for Trackman POST ball request`
        );
      }

      if (!machine.server) {
        throw new Error(
          `${machine.machineID} is not connected to any server for Trackman POST ball request`
        );
      }

      axiosClients
        .find((c) => c.url === machine.server)
        ?.client.post(`trackman/ball/${machineID}`, req.body);

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postTrackmanSession = async function (req: Request, res: Response) {
    try {
      const { machineID } = req.params;

      const machine = dbMachines.find((m) => m.machineID === machineID);

      if (!machine) {
        throw new Error(
          `Failed to find machine with machineID "${machineID}" for Trackman POST session request`
        );
      }

      if (!machine.server) {
        throw new Error(
          `${machine.machineID} is not connected to any server for Trackman POST session request`
        );
      }

      axiosClients
        .find((c) => c.url === machine.server)
        ?.client.post(`trackman/session/${machineID}`, req.body);

      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postMSBS = async function (req: Request, res: Response) {
    try {
      const payload = req.body as { machineID: string };

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
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };
}

export default new Service();
