import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { donorsRouter } from "./routes/donors";
import { donationsRouter } from "./routes/donations";
import { chatsRouter } from "./routes/chats";
import { adminRouter } from "./routes/admin";
import { devicesRouter } from "./routes/devices";
import { createSocketServer } from "./socket";
import { startCronJobs } from "./lib/cron";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/donors", donorsRouter);
app.use("/api/v1/donations", donationsRouter);
app.use("/api/v1/chats", chatsRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/devices", devicesRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const httpServer = createServer(app);
createSocketServer(httpServer);
startCronJobs();

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`Blood backend listening on http://localhost:${port}`);
});
