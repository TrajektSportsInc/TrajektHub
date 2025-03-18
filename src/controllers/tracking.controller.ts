import { Middlewares } from '@classes';
import { BaseController } from '@controllers/_base.controller';
import Service from '@services/tracking.service';

class Controller extends BaseController {
  constructor() {
    super();
  }

  declareRoutes(): void {
    // rapsodo won't come with machineID; the serial number will need to be used instead
    this.router.post('/rapsodo', Middlewares.anon, Service.postRapsodo);

    this.router.post(
      '/trackman/session',
      Middlewares.anon,
      Service.postTrackmanSession
    );

    this.router.post(
      '/trackman/ball',
      Middlewares.anon,
      Service.postTrackmanBall
    );

    // payload body contains the machineID
    this.router.post('/msbs', Middlewares.anon, Service.postMSBS);
  }
}

export default new Controller().router;
