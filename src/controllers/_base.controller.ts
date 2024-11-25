import { Middlewares } from '@classes';
import { BaseService } from '@services/_base.service';
import express, { Router } from 'express';

export abstract class BaseController {
  public router: Router;

  constructor() {
    this.router = express.Router();

    /** quick test for controller liveness */
    this.router.get('/ping', Middlewares.anon, BaseService.ping);

    this.declareRoutes();
  }

  protected abstract declareRoutes(): void;
}
