import axios from "axios";

export const client = axios.create();
client.defaults.timeout = 3000;
