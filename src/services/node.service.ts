import { BaseService } from "@services/_base.service";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

class Service extends BaseService {
  constructor() {
    super();
  }

  postMachineConnection = async function (req: Request, res: Response) {
    try {
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };

  postUserConnection = async function (req: Request, res: Response) {
    try {
      res.status(StatusCodes.OK).send();
    } catch (e) {
      console.error(e);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send();
    }
  };
}

export default new Service();
