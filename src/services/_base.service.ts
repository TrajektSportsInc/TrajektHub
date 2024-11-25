import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export abstract class BaseService {
  constructor() {}

  static ping = async function (req: Request, res: Response) {
    res.status(StatusCodes.OK).send({
      message: `I'm alive!`,
      serverTime: new Date(),
    });
  };
}
