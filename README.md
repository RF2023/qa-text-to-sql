# QA Text-to-SQL

QA Text-to-SQL is a TypeScript portfolio project that turns natural-language QA questions into safe, read-only SQL for local analytics.

Example question:

- "Which module had the most flaky tests?"

The app pipeline is:

1. UI sends a question to `/api/query`
2. LLM generates SQL using schema context
3. Validation enforces strict read-only safety
4. SQLite executes validated SQL
5. API returns `question`, `sql`, `results`, and `explanation`

## Domain

This project models QA test execution and defect analytics using local SQLite data.

Core entities include:

- `bugs`
- `test_cases`
- `releases`

## Safety Guardrails

Only SELECT queries are allowed.

Validation rejects:

- `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `PRAGMA`
- multiple SQL statements
- unknown tables or columns

A default row limit is applied to keep results safe and predictable.

## Architecture

- UI: `public/index.html`, `public/app.js`, `public/styles.css`
- API: `src/server.ts`
- LLM generation: `src/llm/generateSql.ts`
- Validation: `src/validation/validateSql.ts`
- Execution service: `src/services/executeQuery.ts`
- SQLite client and schema: `src/db/client.ts`, `src/db/schema.sql`
- Shared API types: `src/types/api.ts`

## Quick Start

```bash
git clone <your-repo-url>
cd qa-text-to-sql
npm install
cp .env.example .env
# Add OPENAI_API_KEY to .env
npm run dev
```

Open `http://localhost:3000`.

## API Contract

### `POST /api/query`

Request:

```json
{
  "question": "How many critical bugs are open?"
}
```

Response:

```json
{
  "question": "How many critical bugs are open?",
  "sql": "SELECT COUNT(*) AS total FROM bugs WHERE severity = 'critical' AND status = 'open' LIMIT 100",
  "results": [{ "total": 2 }],
  "explanation": "Converted your question to a read-only SQL query, validated it against safety and schema rules, then returned 1 row(s)."
}
```

## Team Onboarding Checklist

Use this when a team wants to adopt the project for a real use case.

### 1) Domain and schema inputs

- Provide real table names, columns, and relationships
- Replace demo schema with domain schema in `src/db/schema.sql`
- Define business terms clearly (for example: flaky test, leakage, reopened defect)

### 2) LLM configuration

- Provide API key via environment variable only
- Choose model by cost/latency/accuracy needs
- Tune prompt instructions for domain vocabulary and SQL style

### 3) Safety policy decisions

- Confirm strict SELECT-only mode
- Confirm blocked statements list
- Set row-limit policy and timeout policy
- Decide whether to allow advanced SQL patterns (for example CTEs)

### 4) Validation and quality controls

- Add prompt-to-SQL test cases for key business questions
- Add negative tests for malicious or unsafe prompts
- Validate expected outputs on known QA scenarios

### 5) API and UI integration expectations

- Confirm response contract (`question`, `sql`, `results`, `explanation`)
- Confirm error response format and user-facing messages
- Decide if query history or saved questions are required

### 6) Security and compliance

- Keep secrets in `.env` or a managed secret store
- Never commit local DB files or sensitive datasets
- Add masking/anonymization rules if production-like data is used

### 7) Deployment and ownership

- Define runtime environment (local, container, cloud)
- Define team ownership for schema, prompt, and validation updates
- Define release checklist and incident process for incorrect SQL output

## Environment Variables

- `OPENAI_API_KEY` (required)
- `PORT` (optional, default `3000`)
- `DB_PATH` (optional, default `./qa.db`)

Use `.env.example` as the template.

## Interview Talking Points

- Schema grounding: LLM is constrained by known table structure
- Validation first: generated SQL is validated before execution
- Read-only execution: only safe SELECT statements are allowed
- Transparent output: users see SQL, data, and explanation
