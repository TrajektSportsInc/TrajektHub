import { Middlewares } from '@classes';
import { BaseController } from '@controllers/_base.controller';
import MainService from '@services/main.service';

class MainController extends BaseController {
  constructor() {
    super();
  }

  declareRoutes(): void {
    this.router.get('/sample', Middlewares.auth, MainService.sampleGET);
    this.router.post('/sample', Middlewares.auth, MainService.samplePOST);
    this.router.put('/sample', Middlewares.auth, MainService.samplePUT);
    this.router.patch('/sample', Middlewares.auth, MainService.samplePATCH);
    this.router.delete('/sample', Middlewares.auth, MainService.sampleDELETE);
  }
}

export default new MainController().router;
