export interface QueryRequest {
	question: string;
}

export interface QueryResponse {
	question: string;
	sql: string;
	results: Record<string, unknown>[];
	explanation: string;
}

export interface ErrorResponse {
	error: string;
}
