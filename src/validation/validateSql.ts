const BLOCKED_KEYWORDS = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE", "PRAGMA"];

export interface ValidationResult {
	valid: boolean;
	reason?: string;
	safeSql?: string;
}

export interface ValidationOptions {
	maxRows?: number;
	schemaCheck?: (sql: string) => ValidationResult;
}

function stripComments(sql: string): string {
	return sql.replace(/--[^\n]*/g, " ").replace(/\/\*[\s\S]*?\*\//g, " ");
}

function ensureRowLimit(sql: string, maxRows: number): string {
	const withoutTrailingSemicolon = sql.replace(/;\s*$/, "").trim();
	if (/\blimit\b/i.test(withoutTrailingSemicolon)) {
		return withoutTrailingSemicolon;
	}
	return `${withoutTrailingSemicolon} LIMIT ${maxRows}`;
}

export function validateSql(sql: string, options: ValidationOptions = {}): ValidationResult {
	const trimmed = sql.trim();
	if (!trimmed) {
		return { valid: false, reason: "Generated SQL is empty." };
	}

	const stripped = stripComments(trimmed);

	if (!stripped.toUpperCase().startsWith("SELECT")) {
		return { valid: false, reason: "Only SELECT queries are allowed." };
	}

	for (const keyword of BLOCKED_KEYWORDS) {
		const pattern = new RegExp(`\\b${keyword}\\b`, "i");
		if (pattern.test(stripped)) {
			return { valid: false, reason: `Blocked keyword detected: ${keyword}.` };
		}
	}

	const withoutTrailing = stripped.replace(/;\s*$/, "");
	if (withoutTrailing.includes(";")) {
		return { valid: false, reason: "Multiple SQL statements are not allowed." };
	}

	const maxRows = options.maxRows ?? 100;
	const safeSql = ensureRowLimit(trimmed, maxRows);

	if (options.schemaCheck) {
		const schemaResult = options.schemaCheck(safeSql);
		if (!schemaResult.valid) {
			return schemaResult;
		}
	}

	return { valid: true, safeSql };
}
