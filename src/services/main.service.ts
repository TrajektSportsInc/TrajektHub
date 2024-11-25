import { BaseService } from '@services/_base.service';
import { Request, Response } from 'express';

class MainService extends BaseService {
  constructor() {
    super();
  }

  sampleGET = async function(req: Request, res: Response) {
    res.status(200).send({
      message: `Sample GET request`,
    });
  }

  samplePOST = async function(req: Request, res: Response) {
    res.status(200).send({
      message: `Sample POST request`,
      body: req.body,
    });
  }

  samplePUT = async function(req: Request, res: Response) {
    res.status(200).send({
      message: `Sample PUT request`,
      body: req.body,
    });
  }

  samplePATCH = async function(req: Request, res: Response) {
    res.status(200).send({
      message: `Sample PATCH request`,
      body: req.body,
    });
  }

  sampleDELETE = async function(req: Request, res: Response) {
    res.status(200).send({
      message: `Sample DELETE request`,
    });
  }
}

export default new MainService();
