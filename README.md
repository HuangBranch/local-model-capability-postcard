# Local Model Capability Postcard

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

## 简体中文

这是一个零依赖的小工具：用同一组五项检查测试 Ollama 或兼容 OpenAI API 的本机模型，并生成可离线打开的单文件 HTML 能力卡。默认仅连接本机/私有局域网地址，不会上传测试结果；是否分享由你决定。

```sh
node src/cli.js
node src/cli.js --provider openai --url http://localhost:1234/v1 --model qwen3-8b
```

能力分仅用于快速对比，不是科学基准；代码结构和中文回答检查采用启发式判断。可用 `npm test` 和 `npm run check` 验证项目。

## License

MIT. See [LICENSE](LICENSE).
