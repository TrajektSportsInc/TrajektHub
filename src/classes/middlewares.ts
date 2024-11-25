import { NextFunction, Request, Response } from 'express';

export class Middlewares {
  static log = function(req: Request, res: Response, next: NextFunction) {
    console.debug(`${req.method} REQUEST: ${req.path}`);
    next();
  }

  /** all middlewares that should run on anonymous requests go here */
  static anon = [
  ];

  /** all middlewares that should run on authenticated requests go here */
  static auth = [
  ];
}
