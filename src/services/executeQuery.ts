import { generateSql } from "../llm/generateSql.js";
import { validateSql } from "../validation/validateSql.js";
import db from "../db/client.js";
import type { QueryResponse } from "../types/api.js";

const MAX_RESULT_ROWS = 100;

function schemaCheck(sql: string): { valid: boolean; reason?: string } {
	try {
		// EXPLAIN QUERY PLAN validates table and column names without changing data.
		db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all();
		return { valid: true };
	} catch (error) {
		const message = error instanceof Error ? error.message.toLowerCase() : "";
		if (message.includes("no such table") || message.includes("no such column")) {
			return { valid: false, reason: "Unknown table or column referenced in generated SQL." };
		}
		return { valid: false, reason: "Generated SQL failed schema validation." };
	}
}

function buildExplanation(question: string, sql: string, rowCount: number): string {
	return `Converted your question to a read-only SQL query, validated it against safety and schema rules, then returned ${rowCount} row(s).`;
}

/**
 * Full pipeline:
 *   1. Ask the LLM to turn the question into SQL
 *   2. Validate the SQL is a safe read-only SELECT
 *   3. Execute the query against SQLite and return results
 */
export async function executeQuery(question: string): Promise<QueryResponse> {
	// Step 1: Generate SQL from the user's question.
	const sql = await generateSql(question);

	// Step 2: Validate safety rules and schema compatibility.
	const validation = validateSql(sql, {
		maxRows: MAX_RESULT_ROWS,
		schemaCheck,
	});
	if (!validation.valid) {
		throw new Error(`VALIDATION: ${validation.reason ?? "SQL validation failed."}`);
	}

	const safeSql = validation.safeSql ?? sql;

	// Step 3: Execute the validated SQL query.
	const results = db.prepare(safeSql).all() as Record<string, unknown>[];
	const explanation = buildExplanation(question, safeSql, results.length);

	return {
		question,
		sql: safeSql,
		results,
		explanation,
	};
}
