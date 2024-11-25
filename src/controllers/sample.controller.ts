import { Middlewares } from "@classes";
import { BaseController } from "@controllers/_base.controller";
import Service from "@services/sample.service";

class Controller extends BaseController {
  constructor() {
    super();
  }

  declareRoutes(): void {
    this.router.get("/sample", Middlewares.auth, Service.sampleGET);
    this.router.post("/sample", Middlewares.auth, Service.samplePOST);
    this.router.put("/sample", Middlewares.auth, Service.samplePUT);
    this.router.patch("/sample", Middlewares.auth, Service.samplePATCH);
    this.router.delete("/sample", Middlewares.auth, Service.sampleDELETE);
  }
}

export default new Controller().router;
