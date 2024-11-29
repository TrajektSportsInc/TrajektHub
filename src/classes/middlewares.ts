import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

const HUB_API_KEY = process.env.HUB_API_KEY;

const apiKey = async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!HUB_API_KEY) {
      throw new Error('No API key found for TrajektHub');
    }

    const hubKey = req.headers['x-hub-key'] as string;
    if (hubKey !== HUB_API_KEY) {
      throw new Error('Incorrect API key found for TrajektHub');
    }

    return next();
  } catch (e) {
    console.error(e);

    res.status(StatusCodes.FORBIDDEN).json({
      message: 'Failed authentication',
      error: (e as Error).message,
    });
    return;
  }
};

export class Middlewares {
  static log = function (req: Request, res: Response, next: NextFunction) {
    console.debug(`${req.method} REQUEST: ${req.path}`);
    next();
  };

  /** all middlewares that should run on anonymous requests go here */
  static anon = [];

  /** all middlewares that should run on authenticated requests go here */
  static auth = [apiKey];
}
