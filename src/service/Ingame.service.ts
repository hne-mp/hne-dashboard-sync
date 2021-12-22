import axios, { AxiosRequestConfig } from "axios";
import config from "../config";

const client = axios.create({
  baseURL: config.INGAME_QUERY_API,
  timeout: 300000,
});

const beforeRequest = (conf: AxiosRequestConfig) => {
  Object.assign(conf.headers, {
    "X-SecretKey": config.INGAME_QUERY_API_SECRET,
  });
  console.log(`ingame playfab before request: ` + conf.baseURL + conf.url);
  return conf;
};
client.interceptors.request.use(beforeRequest);
client.interceptors.response.use((res) => {
  const { success = true, errors } = res.data;
  console.log(
    res.config.baseURL + res.config.url + " data: " + JSON.stringify(res.data),
  );
  if (success) return res.data;
  else return Promise.reject(errors);
});

const heSpend = async (from: string, to: string): Promise<IInGameSpend> =>
  await client.get(`/heroes-empires/spend/${from}/${to}`);

const heEarn = async (from: string, to: string): Promise<IInGameEarn> =>
  await client.get(`/heroes-empires/earn/${from}/${to}`);

const heSpendNew = async (from: string, to: string): Promise<IRowData> =>
  await client.get(`/heroes-empires/playfab/spend/${from}/${to}`);

const heEarnNew = async (from: string, to: string): Promise<IRowData> =>
  await client.get(`/heroes-empires/playfab/earn/${from}/${to}`);

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
export interface IRowData {
  Columns: string[];
  Rows: any[][];
}

export default {
  heSpend,
  heEarn,
  heSpendNew,
  heEarnNew,
};
