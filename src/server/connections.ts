import AxiosHelper from '@classes/axios.helper';
import { AxiosInstance } from 'axios';

export const SERVERS = process.env.SERVERS?.split(',') ?? [];

export const SERVER_CLIENTS: {
  server: string;
  client: AxiosInstance;
}[] = SERVERS.map((m) => ({
  server: m,
  client: AxiosHelper.instance(m),
}));
