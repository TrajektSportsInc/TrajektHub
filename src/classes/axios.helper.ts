import axios, { AxiosInstance } from 'axios';
import * as AxiosLogger from 'axios-logger';
import { StatusCodes } from 'http-status-codes';

const HUB_API_KEY = process.env.HUB_API_KEY;

AxiosLogger.setGlobalConfig({
  dateFormat: 'HH:MM:ss.l',
  url: true,
  status: true,
  headers: false,
  data: false,
  logger: console.info.bind(this),
});

export const ignoreNotFound = (e: any) => {
  if (e.status === StatusCodes.NOT_FOUND) {
    return undefined;
  }

  console.error(e);
  return undefined;
};

class AxiosHelper {
  /** generic HTTP client */
  public instance(baseURL?: string): AxiosInstance {
    if (!baseURL) {
      return axios.create();
    }

    return axios.create({
      baseURL,
      headers: {
        'x-hub-key': HUB_API_KEY ?? '----NO KEY----',
      },
    });
  }
}

export default new AxiosHelper();
