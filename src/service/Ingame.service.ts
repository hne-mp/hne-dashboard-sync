import axios from "axios";
import config from "../config";

const client = axios.create({
  baseURL: config.INGAME_QUERY_API,
});

const beforeRequest = (conf: any) => {
  Object.assign(conf.headers, {
    "X-SecretKey": config.INGAME_QUERY_API_SECRET,
  });
  return conf;
};
client.interceptors.request.use(beforeRequest);
client.interceptors.response.use(({ data }) => {
  const { success = true, errors } = data;
  if (success) return data;
  else return Promise.reject(errors);
});

const heSpend = async (from: string, to: string): Promise<IInGameSpend> =>
  await client.get(`/heroes-empires/spend/${from}/${to}`);

const heEarn = async (from: string, to: string): Promise<IInGameEarn> =>
  await client.get(`/heroes-empires/earn/${from}/${to}`);

export interface IInGameEarn {
  Rows: {
    date: {
      value: string;
    };
    context: string;
    events: number;
    earn: number;
  }[];
}
export interface IInGameSpend {
  Rows: {
    date: {
      value: string;
    };
    context: string;
    times: number;
    spend: number;
  }[];
}

export default {
  heSpend,
  heEarn,
};
