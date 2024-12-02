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

    // configured per unit to include the machineID
    this.router.post(
      '/trackman/session/:machineID',
      Middlewares.anon,
      Service.postTrackmanSession
    );

    // configured per unit to include the machineID
    this.router.post(
      '/trackman/ball/:machineID',
      Middlewares.anon,
      Service.postTrackmanBall
    );

    // payload body contains the machineID
    this.router.post('/msbs', Middlewares.anon, Service.postMSBS);
  }
}

export default new Controller().router;
