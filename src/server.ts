import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

app.get("/api/health", (_req: express.Request, res: express.Response) => {
  res.json({
    status: "ok",
    app: "qa-text-to-sql",
    message: "Server is running"
  });
});

app.listen(PORT, () => {
  console.log(`QA Text-to-SQL server running at http://localhost:${PORT}`);
});