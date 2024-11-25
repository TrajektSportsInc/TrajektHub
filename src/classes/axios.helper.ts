import axios, { AxiosInstance } from 'axios';
import * as AxiosLogger from 'axios-logger';

AxiosLogger.setGlobalConfig({
  dateFormat: 'HH:MM:ss.l',
  url: true,
  status: true,
  headers: false,
  data: false,
  logger: console.info.bind(this),
});

class AxiosHelper {
  /** generic HTTP client */
  public instance(baseURL?: string): AxiosInstance {
    if (!baseURL) {
      return axios.create();
    }

    return axios.create({
      baseURL,
    });
  }
}

export default new AxiosHelper();
