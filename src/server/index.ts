import { HttpException } from '@classes';
import express, { Application, NextFunction, Request, Response } from 'express';
import * as http from 'http';
import morgan from 'morgan';
import * as rfs from 'rotating-file-stream';
import ctrl from '@controllers';
import { Middlewares } from '@classes';
import helmet from 'helmet';
import bodyParser from 'body-parser';

const PORT = process.env.PORT || 8000;

const CONTROLLERS: { route: string, controller: any }[] = [
  { route: '/', controller: ctrl.MainController },
];

class MainServer {
  private app: Application;
  private server?: http.Server;

  constructor() {
    this.app = express();

    this.app.use(helmet({
      /** uncomment from the following to disable specific modules */
      // contentSecurityPolicy: false,
      // crossOriginEmbedderPolicy: false,
      // crossOriginOpenerPolicy: false,
      // crossOriginResourcePolicy: false,
      // expectCt: false,
      // referrerPolicy: false,
      // hsts: false,
      // noSniff: false,
      // originAgentCluster: false,
      // dnsPrefetchControl: false,
      // ieNoOpen: false,
      // frameguard: false,
    }));

    /** log errors */
    const errorLog = rfs.createStream('error.log', {
      interval: '1d', //daily rotation
      path: 'logs',
      compress: true,
    });

    this.app.use(morgan('combined', {
      skip: (req: Request, res: Response) => {
        return res.statusCode < 400;
      },
      stream: errorLog,
    }));

    /** log access */
    const accessLog = rfs.createStream('access.log', {
      interval: '1d', //daily rotation
      path: 'logs',
      compress: true,
    });

    this.app.use(morgan('common', {
      stream: accessLog,
    }));

    /** for requests with JSON payloads */
    this.app.use(bodyParser.urlencoded({
      extended: true,
    }));
    this.app.use(bodyParser.json());

    /** log http errors to console */
    this.app.use((err: HttpException, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      return res.status(err.status).json({ message: err.message });
    });

    /** log all received requests to console */
    this.app.use(Middlewares.log);

    /** declare controllers */
    CONTROLLERS.forEach((c) => {
      this.app.use(c.route, c.controller);
    });
  }

  start() {
    this.server = this.app.listen(PORT, (): void => {
      console.log(`Server Running here 👉 https://localhost:${PORT}`);
    });

    process.on('SIGTERM', () => {
      console.debug('SIGTERM signal received: closing server');
      this.server ?.close(() => {
        console.debug('Server closed');
      });
    });
  }

  stop() {
    console.debug('Manual stop instruction received: closing server');
    this.server ?.close(() => {
      console.debug('Server closed');
    });
  }
}

export default new MainServer();
