import { Middlewares } from '@classes';
import { BaseController } from '@controllers/_base.controller';
import Service from '@services/node.service';

class Controller extends BaseController {
  constructor() {
    super();
  }

  declareRoutes(): void {
    this.router.post(
      '/users/connection',
      Middlewares.auth,
      Service.postUserConnection
    );

    this.router.post(
      '/users/disconnection',
      Middlewares.auth,
      Service.postUserDisconnection
    );

    this.router.post(
      '/machines/connection',
      Middlewares.auth,
      Service.postMachineConnection
    );
  }
}

export default new Controller().router;
