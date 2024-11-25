import { BaseService } from '@services/_base.service';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

class Service extends BaseService {
  constructor() {
    super();
  }

  sampleGET = async function (req: Request, res: Response) {
    res.status(StatusCodes.OK).send({
      message: `Sample GET request`,
    });
  };

  samplePOST = async function (req: Request, res: Response) {
    res.status(StatusCodes.OK).send({
      message: `Sample POST request`,
      body: req.body,
    });
  };

  samplePUT = async function (req: Request, res: Response) {
    res.status(StatusCodes.OK).send({
      message: `Sample PUT request`,
      body: req.body,
    });
  };

  samplePATCH = async function (req: Request, res: Response) {
    res.status(StatusCodes.OK).send({
      message: `Sample PATCH request`,
      body: req.body,
    });
  };

  sampleDELETE = async function (req: Request, res: Response) {
    res.status(StatusCodes.OK).send({
      message: `Sample DELETE request`,
    });
  };
}

export default new Service();
