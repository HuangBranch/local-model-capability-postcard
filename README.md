# Local Model Capability Postcard

**Language:** [English](README.md) · [简体中文](README.zh-CN.md)

Run the same five small checks against models served by Ollama or an OpenAI-compatible local runtime, then generate a self-contained HTML card you can share. No dependencies beyond Node.js 18+, and no result upload.

> Scores are a quick, transparent signal—not a scientific benchmark. They depend on the prompts, model versions, hardware and runtime settings.

## Quick start

```sh
# Ollama, default endpoint http://localhost:11434
node src/cli.js

# LM Studio or another OpenAI-compatible local server
node src/cli.js --url http://localhost:1234/v1 --provider openai

# Choose one or more models and an output path
node src/cli.js --provider openai --url http://localhost:1234/v1 \
  --model qwen3-8b --model llama-3.1-8b --out ./share/postcard.html
```

Open `capability-postcard.html` (or the selected output) in a browser. It has no external fonts, scripts, images, analytics or tracking. The five checks cover structured output, arithmetic, code shape, multi-turn context and a short Chinese response. Each is worth 20 points. Code and language checks are explicitly heuristic.

By default the tool tests up to eight discovered models sequentially. Use `--model NAME` to select models, repeat it or provide comma-separated names, and use `--max-models N` to change the discovery cap. `--json FILE` optionally saves raw answers locally; that file can contain model output, so keep or share it deliberately.

## Privacy and network boundary

- The endpoint must be localhost or a private/LAN address. Public internet hosts are rejected.
- Redirects are blocked; requests go only to the selected local model API.
- No prompts, results or generated cards are sent to a hosted service. You decide whether and how to share the HTML file.
- The prompts are fixed synthetic examples. Do not add sensitive information to them.

## Development

Requires Node.js 18 or newer; there are no third-party dependencies.

```sh
npm test
npm run check
```

## License

MIT. See [LICENSE](LICENSE).
