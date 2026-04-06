import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Reads schema.sql and extracts only the CREATE TABLE blocks,
 * so the LLM understands column names and types without seeing seed data.
 */
function getSchemaContext(): string {
	const schemaPath = path.join(process.cwd(), "src", "db", "schema.sql");
	const raw = fs.readFileSync(schemaPath, "utf-8");

	const blocks: string[] = [];
	let block = "";
	let inside = false;

	for (const line of raw.split("\n")) {
		if (/^\s*CREATE\s+TABLE/i.test(line)) {
			inside = true;
			block = "";
		}
		if (inside) {
			block += line + "\n";
			if (line.trim() === ");") {
				blocks.push(block.trim());
				inside = false;
			}
		}
	}

	return blocks.join("\n\n");
}

const SYSTEM_PROMPT = `You are a SQL expert working with a SQLite database.
Convert the user's natural language question into a single valid SELECT query.

Rules:
- Output ONLY the raw SQL query — no markdown fences, no explanation.
- Use only SELECT. Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, or PRAGMA.
- Prefer readable column aliases (e.g. COUNT(*) AS total).
- Use proper SQLite syntax.

Schema:
${getSchemaContext()}`;

export async function generateSql(question: string): Promise<string> {
	const response = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user",   content: question },
		],
		temperature: 0,
		max_tokens: 300,
	});

	const sql = response.choices[0]?.message?.content?.trim() ?? "";
	if (!sql) throw new Error("LLM returned an empty response.");
	return sql;
}
