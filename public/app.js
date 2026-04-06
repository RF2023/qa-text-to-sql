const form        = document.getElementById("queryForm");
const input       = document.getElementById("questionInput");
const submitBtn   = document.getElementById("submitBtn");
const loadingEl   = document.getElementById("loading");
const errorEl     = document.getElementById("errorBox");
const resultsEl   = document.getElementById("results");
const sqlOutput   = document.getElementById("sqlOutput");
const explanationOutput = document.getElementById("explanationOutput");
const tableWrap   = document.getElementById("tableWrap");

// Populate input from example buttons
document.querySelectorAll(".example-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		input.value = btn.textContent;
		input.focus();
	});
});

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	const question = input.value.trim();
	if (!question) return;
	await runQuery(question);
});

async function runQuery(question) {
	setLoading(true);
	hide(errorEl);
	hide(resultsEl);

	try {
		const res = await fetch("/api/query", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question }),
		});

		const data = await res.json();

		if (!res.ok) {
			showError(data.error ?? "An unexpected error occurred.");
			return;
		}

		renderResults(data);
	} catch {
		showError("Could not reach the server. Is it running?");
	} finally {
		setLoading(false);
	}
}

function renderResults({ sql, results, explanation }) {
	sqlOutput.textContent = sql;
	explanationOutput.textContent = explanation || "No explanation available.";

	if (!results || results.length === 0) {
		tableWrap.innerHTML = '<p class="no-results">No results found.</p>';
	} else {
		const columns = Object.keys(results[0]);
		const thead = `<tr>${columns.map((c) => `<th>${escape(c)}</th>`).join("")}</tr>`;
		const tbody = results
			.map(
				(row) =>
					`<tr>${columns.map((c) => `<td>${escape(row[c] ?? "")}</td>`).join("")}</tr>`
			)
			.join("");
		tableWrap.innerHTML = `<table class="results-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
	}

	show(resultsEl);
}

function showError(message) {
	errorEl.textContent = message;
	show(errorEl);
}

function setLoading(on) {
	submitBtn.disabled = on;
	on ? show(loadingEl) : hide(loadingEl);
}

function show(el) { el.classList.remove("hidden"); }
function hide(el) { el.classList.add("hidden"); }

/** Prevent HTML injection in rendered cell values */
function escape(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}
