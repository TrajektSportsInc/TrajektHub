import { Request, Response } from 'express';

export abstract class BaseService {
  constructor() {
  }

  static ping = async function(req: Request, res: Response) {
    res.status(200).send({
      message: `I'm alive!`,
      serverTime: new Date(),
    });
  }
}
