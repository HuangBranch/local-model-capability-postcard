function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function scoreClass(score) {
  if (score >= 80) return "high";
  if (score >= 60) return "mid";
  return "low";
}

export function renderPostcard({ provider, endpoint, generatedAt = new Date().toISOString(), models = [] }) {
  const cards = models.map((model, index) => {
    const rows = model.cases.map((item) => `
      <li class="case ${item.passed ? "pass" : "fail"}">
        <div class="case-head"><span>${escapeHtml(item.label)}</span><span class="case-result">${item.passed ? "PASS" : "CHECK"} · ${escapeHtml(item.latencyMs)} ms</span></div>
        <p>${escapeHtml(item.note)}</p>
        ${item.answer ? `<details><summary>查看模型回答</summary><pre>${escapeHtml(item.answer)}</pre></details>` : ""}
      </li>`).join("");
    return `
      <article class="model-card">
        <div class="rank">${String(index + 1).padStart(2, "0")}</div>
        <div class="model-main">
          <div class="model-title"><h2>${escapeHtml(model.name)}</h2><span class="provider">${escapeHtml(provider)}</span></div>
          <div class="score-row"><strong class="score ${scoreClass(model.score)}">${escapeHtml(model.score)}<small>/100</small></strong><div class="score-meta"><b>${escapeHtml(model.passCount)}/${escapeHtml(model.total)} checks passed</b><div class="bar"><i style="width:${Math.max(0, Math.min(100, Number(model.score) || 0))}%"></i></div></div></div>
          <ul class="cases">${rows}</ul>
        </div>
      </article>`;
  }).join("");

  const safeEndpoint = escapeHtml(endpoint);
  const timestamp = escapeHtml(new Date(generatedAt).toLocaleString("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="An offline capability postcard from small, repeatable checks against local language models.">
<title>Local Model Capability Postcard</title>
<style>
:root{color-scheme:light;--ink:#18212f;--muted:#64748b;--line:#e5eaf1;--paper:#f5f7fb;--accent:#6957e8;--green:#147d55;--amber:#9a6700;--red:#b42318}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:15px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.wrap{max-width:920px;margin:0 auto;padding:48px 22px 64px}.eyebrow{text-transform:uppercase;letter-spacing:.12em;color:var(--accent);font-size:12px;font-weight:800}.hero{padding:28px 0 34px}.hero h1{font-size:clamp(32px,6vw,52px);line-height:1.02;letter-spacing:-.045em;margin:12px 0}.hero p{color:var(--muted);max-width:650px;margin:0}.meta{display:flex;flex-wrap:wrap;gap:10px 20px;margin-top:22px;color:var(--muted);font-size:13px}.meta b{color:var(--ink)}.models{display:grid;gap:18px}.model-card{display:grid;grid-template-columns:52px 1fr;gap:16px;padding:22px;background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 8px 28px #1b2b4410}.rank{font-size:13px;font-weight:800;color:#a1aabb;padding-top:3px}.model-title{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.model-title h2{font-size:21px;letter-spacing:-.02em;margin:0;overflow-wrap:anywhere}.provider{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--accent);background:#f0edff;padding:4px 8px;border-radius:99px}.score-row{display:flex;align-items:center;gap:16px;margin:16px 0}.score{font-size:38px;line-height:1;letter-spacing:-.05em}.score small{font-size:14px;letter-spacing:0;color:var(--muted)}.score.high{color:var(--green)}.score.mid{color:var(--amber)}.score.low{color:var(--red)}.score-meta{flex:1;font-size:12px;color:var(--muted)}.score-meta b{color:var(--ink)}.bar{height:6px;background:#edf0f5;border-radius:99px;margin-top:7px;overflow:hidden}.bar i{display:block;height:100%;background:var(--accent);border-radius:inherit}.cases{list-style:none;padding:0;margin:0;border-top:1px solid var(--line)}.case{padding:13px 0;border-bottom:1px solid var(--line)}.case:last-child{border-bottom:0;padding-bottom:0}.case-head{display:flex;justify-content:space-between;gap:12px;font-weight:700}.case-result{font:700 11px/1.8 ui-monospace,SFMono-Regular,monospace;color:var(--green)}.fail .case-result{color:var(--amber)}.case p{color:var(--muted);font-size:13px;margin:4px 0 0}.case details{margin-top:9px}.case summary{cursor:pointer;color:var(--accent);font-size:12px;font-weight:700}.case pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:260px;overflow:auto;padding:12px;background:#f7f8fc;border-radius:9px;font:12px/1.5 ui-monospace,SFMono-Regular,monospace}.foot{margin-top:25px;padding:17px 0;border-top:1px solid var(--line);color:var(--muted);font-size:12px}.foot strong{color:var(--ink)}@media(max-width:560px){.wrap{padding:28px 14px 44px}.model-card{grid-template-columns:28px 1fr;gap:8px;padding:16px}.score-row{align-items:flex-start}.hero{padding-top:12px}}
</style></head>
<body><main class="wrap"><header class="hero"><div class="eyebrow">Local Model Capability Postcard</div><h1>Small tests.<br>Useful signal.</h1><p>A compact snapshot of how local models handled the same five tasks. Scores are quick heuristics, not a scientific benchmark.</p><div class="meta"><span>Provider <b>${escapeHtml(provider)}</b></span><span>Endpoint <b>${safeEndpoint}</b></span><span>Generated <b>${timestamp}</b></span></div></header><section class="models" aria-label="Model comparisons">${cards || "<p>No model results available.</p>"}</section><footer class="foot"><strong>How to read this:</strong> each task is worth 20 points; code and short-answer checks use simple heuristics. Results depend on model versions, prompt wording, hardware and runtime settings. Generated locally by Local Model Capability Postcard; this file has no external assets or trackers.</footer></main></body></html>`;
}
