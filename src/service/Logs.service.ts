import Logs from "../model/Logs";

class LogsService {
  async info(message: any) {
    await Logs.create({
      type: "INFO",
      message: message,
    });
  }
  async error(message: any) {
    await Logs.create({
      type: "ERROR",
      message: message,
    });
  }
  async warn(message: any) {
    await Logs.create({
      type: "WARN",
      message: message,
    });
  }
}
export default LogsService;
