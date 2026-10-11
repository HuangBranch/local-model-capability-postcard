import test from "node:test";
import assert from "node:assert/strict";
import { assertLocalBaseUrl, isLocalHostname, connectProvider } from "../src/providers.js";
import { getCases } from "../src/runner.js";
import { renderPostcard } from "../src/report.js";

 test("accepts loopback and private LAN endpoints but rejects public hosts", () => {
  for (const host of ["localhost", "127.0.0.1", "10.2.3.4", "172.20.2.4", "192.168.1.5", "::1", "llm.local", "box.lan"]) assert.equal(isLocalHostname(host), true, host);
  for (const host of ["8.8.8.8", "example.com", "172.32.0.1", "192.167.1.1", "169.254.169.254"]) assert.equal(isLocalHostname(host), false, host);
  assert.equal(assertLocalBaseUrl("http://localhost:1234/v1/"), "http://localhost:1234/v1");
  assert.throws(() => assertLocalBaseUrl("https://example.com"), /Public hosts are blocked/);
  assert.throws(() => assertLocalBaseUrl("http://user:pass@localhost:1234"), /credentials/);
});

test("provides five stable, labeled capability checks", () => {
  const cases = getCases();
  assert.equal(cases.length, 5);
  assert.deepEqual(cases.map((item) => item.id), ["structured-output", "arithmetic", "code-shape", "conversation-memory", "chinese-short-answer"]);
  assert.ok(cases.every((item) => item.label));
});

test("normalizes OpenAI-compatible endpoint paths", async () => {
  const provider = await connectProvider("openai", "http://localhost:1234/v1");
  assert.equal(provider.kind, "openai");
  assert.equal(provider.baseUrl, "http://localhost:1234/v1");
});

test("renders a static, self-contained card and escapes model text", () => {
  const html = renderPostcard({
    provider: "ollama",
    endpoint: "http://localhost:11434",
    generatedAt: "2026-01-01T00:00:00.000Z",
    models: [{
      name: "<img src=x onerror=alert(1)>", score: 80, passCount: 4, total: 5,
      cases: [{ id: "x", label: "Test <x>", passed: true, note: "safe & sound", latencyMs: 12, answer: "<script>alert('x')</script>" }]
    }]
  });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.match(html, /safe &amp; sound/);
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<(?:script|link|img)\b[^>]+(?:src|href)=/i);
});
