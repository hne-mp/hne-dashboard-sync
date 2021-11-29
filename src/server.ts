import express from "express";
import { Job } from "./job";
import model from "./model";
import apisRouter from "./routes/api";
import SystemConfigService from "./service/SystemConfig.service";
import { launch_bot } from "./service/Telegram.Bot";

const jobs = new Job();

model
  .initModel()
  .then(SystemConfigService.init)
  .then(jobs.init)
  .then(launch_bot)
  .then(jobs.startJob)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

const app = express();
// Express configuration
app.set("port", process.env.PORT || 5000);

// @route   GET /
// @desc    Test Base API
// @access  Public
app.get("/", (_req, res) => {
  res.json(Job.status());
});

app.use("/api", apisRouter);

// error handler
app.use(function (err: any, req: any, res: any, next: any) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const port = app.get("port");
const server = app.listen(port, () =>
  console.log(`Server started on port ${port}`),
);

export default server;
