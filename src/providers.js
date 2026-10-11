import { isIP } from "node:net";

function isPrivateIpv4(host) {
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false;
  return octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168);
}

function isPrivateIpv6(host) {
  const value = host.toLowerCase().replace(/^\[|\]$/g, "");
  return value === "::1" || value.startsWith("fc") || value.startsWith("fd");
}

export function isLocalHostname(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".lan")) return true;
  const family = isIP(host);
  if (family === 4) return isPrivateIpv4(host);
  if (family === 6) return isPrivateIpv6(host);
  return false;
}

export function assertLocalBaseUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    throw new Error(`Invalid base URL: ${input}`);
  }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error("Only HTTP(S) local model endpoints are supported.");
  if (url.username || url.password) throw new Error("Do not put credentials in the endpoint URL.");
  if (!isLocalHostname(url.hostname)) {
    throw new Error("For privacy, the endpoint must be localhost or a private/LAN address. Public hosts are blocked.");
  }
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

function endpoint(baseUrl, suffix) {
  const base = baseUrl.replace(/\/+$/, "");
  if (base.endsWith("/v1")) return `${base}/${suffix}`;
  return `${base}/v1/${suffix}`;
}

async function requestJson(url, { method = "GET", body, timeoutMs = 30000 } = {}) {
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: "error"
    });
  } catch (error) {
    const detail = error?.name === "TimeoutError" ? `timed out after ${timeoutMs} ms` : error?.message;
    throw new Error(`Local model request failed (${detail}). Is the server running and reachable?`);
  }
  const text = await response.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch {
    throw new Error(`Model server returned invalid JSON (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    const detail = data?.error?.message || data?.error || data?.message || `HTTP ${response.status}`;
    throw new Error(`Model server error: ${String(detail).slice(0, 300)}`);
  }
  return data;
}

export async function connectProvider(kind, inputUrl, timeoutMs = 30000) {
  const baseUrl = assertLocalBaseUrl(inputUrl);
  let providerKind = kind;
  if (providerKind === "auto") {
    try {
      const data = await requestJson(`${baseUrl}/api/tags`, { timeoutMs });
      if (Array.isArray(data.models)) providerKind = "ollama";
    } catch { /* Try the OpenAI-compatible endpoint next. */ }
    if (providerKind === "auto") {
      try {
        const data = await requestJson(endpoint(baseUrl, "models"), { timeoutMs });
        if (Array.isArray(data.data)) providerKind = "openai";
      } catch { /* Report a concise provider hint below. */ }
    }
    if (providerKind === "auto") {
      throw new Error("Could not detect Ollama or an OpenAI-compatible local server. Specify --provider and check --url.");
    }
  }
  if (!["ollama", "openai"].includes(providerKind)) throw new Error("--provider must be auto, ollama, or openai.");

  return {
    kind: providerKind,
    baseUrl,
    async listModels() {
      if (providerKind === "ollama") {
        const data = await requestJson(`${baseUrl}/api/tags`, { timeoutMs });
        if (!Array.isArray(data.models)) throw new Error("Ollama response did not include a models list.");
        return data.models.map((item) => item.name).filter(Boolean);
      }
      const data = await requestJson(endpoint(baseUrl, "models"), { timeoutMs });
      if (!Array.isArray(data.data)) throw new Error("OpenAI-compatible response did not include a data list.");
      return data.data.map((item) => item.id).filter(Boolean);
    },
    async chat(model, messages, { json = false } = {}) {
      if (providerKind === "ollama") {
        const payload = { model, messages, stream: false, options: { temperature: 0 } };
        if (json) payload.format = "json";
        const data = await requestJson(`${baseUrl}/api/chat`, { method: "POST", body: payload, timeoutMs });
        return String(data?.message?.content || "");
      }
      const payload = { model, messages, temperature: 0, max_tokens: 256 };
      if (json) payload.response_format = { type: "json_object" };
      const data = await requestJson(endpoint(baseUrl, "chat/completions"), { method: "POST", body: payload, timeoutMs });
      return String(data?.choices?.[0]?.message?.content || "");
    }
  };
}
