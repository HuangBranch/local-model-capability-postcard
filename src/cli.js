#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { connectProvider } from "./providers.js";
import { runBenchmark } from "./runner.js";
import { renderPostcard } from "./report.js";

const HELP = `Local Model Capability Postcard\n\nRun the same five small checks against local Ollama or an OpenAI-compatible server.\n\nUsage:\n  node src/cli.js [options]\n\nOptions:\n  --url URL          Local endpoint (default: http://localhost:11434)\n  --provider KIND    auto, ollama, or openai (default: auto)\n  --model NAME       Test only this model; repeat or comma-separate to choose several\n  --out FILE         Offline HTML card (default: capability-postcard.html)\n  --json FILE        Also save the raw local results as JSON (optional)\n  --timeout MS       Per-request timeout (default: 30000)\n  --max-models N     Maximum discovered models to test (default: 8, max: 50)\n  --help             Show this help\n\nExamples:\n  node src/cli.js\n  node src/cli.js --url http://localhost:1234/v1 --provider openai --model qwen3-8b\n`;

function parseArgs(argv) {
  const options = { url: "http://localhost:11434", provider: "auto", models: [], out: "capability-postcard.html", timeout: 30000, maxModels: 8 };
  const valueFlags = new Map([["--url", "url"], ["--provider", "provider"], ["--model", "model"], ["--out", "out"], ["--json", "json"], ["--timeout", "timeout"], ["--max-models", "maxModels"]]);
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") { options.help = true; continue; }
    const [flag, inlineValue] = token.includes("=") ? [token.slice(0, token.indexOf("=")), token.slice(token.indexOf("=") + 1)] : [token, undefined];
    const key = valueFlags.get(flag);
    if (!key) throw new Error(`Unknown option: ${token}`);
    const value = inlineValue ?? argv[++i];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
    if (key === "model") options.models.push(...value.split(",").map((item) => item.trim()).filter(Boolean));
    else if (key === "timeout" || key === "maxModels") options[key] = Number(value);
    else options[key] = value;
  }
  if (!Number.isInteger(options.timeout) || options.timeout < 1000 || options.timeout > 600000) throw new Error("--timeout must be an integer from 1000 to 600000 ms.");
  if (!Number.isInteger(options.maxModels) || options.maxModels < 1 || options.maxModels > 50) throw new Error("--max-models must be an integer from 1 to 50.");
  return options;
}

async function saveFile(path, content) {
  const absolute = resolve(path);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
  return absolute;
}

async function main() {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(`Error: ${error.message}\n\nRun with --help for usage.`); process.exitCode = 2; return; }
  if (options.help) { console.log(HELP); return; }

  try {
    console.log(`Checking local endpoint (${options.provider}) at ${options.url}…`);
    const provider = await connectProvider(options.provider, options.url, options.timeout);
    const discovered = await provider.listModels();
    if (!discovered.length) throw new Error("No models were found. Pull/load a model in the local runtime first.");
    let chosen;
    if (options.models.length) {
      const missing = options.models.filter((name) => !discovered.includes(name));
      if (missing.length) throw new Error(`Model not found: ${missing.join(", ")}. Available: ${discovered.join(", ")}`);
      chosen = [...new Set(options.models)];
    } else {
      chosen = discovered.slice(0, options.maxModels);
      if (discovered.length > chosen.length) console.log(`Found ${discovered.length} models; testing the first ${chosen.length}. Use --model or --max-models to adjust.`);
    }

    console.log(`Provider: ${provider.kind}; models: ${chosen.join(", ")}`);
    const results = await runBenchmark(provider, chosen);
    const generatedAt = new Date().toISOString();
    const document = renderPostcard({ provider: provider.kind, endpoint: provider.baseUrl, generatedAt, models: results });
    const htmlPath = await saveFile(options.out, document);
    console.log(`\nSaved offline postcard: ${htmlPath}`);
    for (const model of results) console.log(`  ${model.name}: ${model.score}/100 (${model.passCount}/${model.total})`);
    if (options.json) {
      const jsonPath = await saveFile(options.json, JSON.stringify({ provider: provider.kind, endpoint: provider.baseUrl, generatedAt, models: results }, null, 2) + "\n");
      console.log(`Saved raw results (including model responses): ${jsonPath}`);
    }
    console.log("\nNo results were uploaded. Share the HTML file manually if you choose.");
  } catch (error) {
    console.error(`Error: ${error?.message || error}`);
    process.exitCode = 1;
  }
}

main();
