import { HttpException, Middlewares } from '@classes';
import ctrl from '@controllers';
import { HubMachine } from '@interfaces/local-db';
import { dbMachines } from '@root/local-db';
import { SERVER_CLIENTS } from '@root/server/connections';
import bodyParser from 'body-parser';
import express, { Application, NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import * as http from 'http';
import morgan from 'morgan';
import * as rfs from 'rotating-file-stream';

const PORT = process.env.PORT || 3001;

const CONTROLLERS: { route: string; controller: any }[] = [
  { route: '/node', controller: ctrl.Node },
  { route: '/tracking', controller: ctrl.Tracking },
];

// rebuilds machines and queues by scanning servers
const initMachines = async () => {
  for (const { client } of SERVER_CLIENTS) {
    try {
      const sMachines = await client
        .get('hub/scan')
        .then((result) => result.data as HubMachine[]);

      sMachines.forEach((sMachine) => {
        const existingMachine = dbMachines.find(
          (m) => m.machineID === sMachine.machineID
        );

        if (!existingMachine) {
          dbMachines.push(sMachine);
          return;
        }

        existingMachine.queue.push(...sMachine.queue);
      });
    } catch (e) {
      console.error(e);
    }
  }

  // FIFO treatment for queue
  dbMachines.forEach((m) =>
    m.queue.sort((a, b) => (a.created < b.created ? -1 : 1))
  );

  console.log('dbMachines initialized:', dbMachines);
};

class MainServer {
  private app: Application;
  private server?: http.Server;

  constructor() {
    this.app = express();

    this.app.use(
      helmet({
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
      })
    );

    /** log errors */
    const errorLog = rfs.createStream('error.log', {
      interval: '1d', //daily rotation
      path: 'logs',
      compress: true,
    });

    this.app.use(
      morgan('combined', {
        skip: (req: Request, res: Response) => res.statusCode < 400,
        stream: errorLog,
      })
    );

    /** log access */
    const accessLog = rfs.createStream('access.log', {
      interval: '1d', //daily rotation
      path: 'logs',
      compress: true,
    });

    this.app.use(
      morgan('common', {
        stream: accessLog,
      })
    );

    /** for requests with JSON payloads */
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );
    this.app.use(bodyParser.json());

    /** log http errors to console */
    this.app.use(
      (err: HttpException, req: Request, res: Response, next: NextFunction) => {
        console.error(err.stack);
        return res.status(err.status).json({ message: err.message });
      }
    );

    /** log all received requests to console */
    this.app.use(Middlewares.log);

    /** declare controllers */
    CONTROLLERS.forEach((c) => {
      this.app.use(c.route, c.controller);
    });
  }

  start() {
    this.server = this.app.listen(PORT, (): void => {
      console.log(`Hub running here 👉 https://localhost:${PORT}`);
    });

    // scan each server to construct machines and queues accordingly
    initMachines();

    process.on('SIGTERM', () => {
      console.debug('SIGTERM signal received: closing Hub');
      this.server?.close(() => {
        console.debug('Hub closed');
      });
    });
  }

  stop() {
    console.debug('Manual stop instruction received: closing Hub');
    this.server?.close(() => {
      console.debug('Hub closed');
    });
  }
}

export default new MainServer();
