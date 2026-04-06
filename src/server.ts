import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { executeQuery } from "./services/executeQuery.js";
import type { QueryRequest, QueryResponse, ErrorResponse } from "./types/api.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "public")));

// GET /api/health – liveness check
app.get("/api/health", (_req: express.Request, res: express.Response) => {
  res.json({ status: "ok", app: "qa-text-to-sql" });
});

// POST /api/query – convert natural language to SQL and return results
app.post(
  "/api/query",
  async (
    req: express.Request,
    res: express.Response<QueryResponse | ErrorResponse>
  ) => {
    const { question } = req.body as QueryRequest;

    if (!question || typeof question !== "string" || !question.trim()) {
      res.status(400).json({ error: "Missing required field: question" });
      return;
    }

    try {
      const result = await executeQuery(question.trim());
      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      if (message.startsWith("VALIDATION:")) {
        res.status(400).json({ error: message.replace("VALIDATION:", "").trim() });
        return;
      }

      res.status(500).json({ error: "Query processing failed." });
    }
  }
);

app.listen(PORT, () => {
  console.log(`QA Text-to-SQL server running at http://localhost:${PORT}`);
});