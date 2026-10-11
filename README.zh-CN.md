# 本机模型能力卡片

**语言：** [English](README.md) · [简体中文](README.zh-CN.md)

使用同一组五项小型检查评估由 Ollama 或兼容 OpenAI API 的本机运行环境提供的模型，并生成可分享的独立 HTML 能力卡。除 Node.js 18+ 外无需其他依赖；测试结果不会上传。

> 分数用于快速、透明地参考，不是科学基准。结果会受提示词、模型版本、硬件和运行参数影响。

## 快速开始

```sh
# Ollama；默认端点为 http://localhost:11434
node src/cli.js

# LM Studio 或其他兼容 OpenAI API 的本机服务
node src/cli.js --url http://localhost:1234/v1 --provider openai

# 指定一个或多个模型以及输出路径
node src/cli.js --provider openai --url http://localhost:1234/v1 \
  --model qwen3-8b --model llama-3.1-8b --out ./share/postcard.html
```

在浏览器中打开 `capability-postcard.html`（或你指定的输出文件）。该文件不依赖外部字体、脚本或图片，也不包含分析或追踪代码。五项检查分别涉及结构化输出、算术、代码结构、多轮上下文和简短中文回答，每项 20 分。代码与语言检查明确采用启发式判断。

默认按顺序测试最多 8 个已发现的模型。使用 `--model NAME` 指定模型；可重复该参数，也可用逗号分隔多个模型。使用 `--max-models N` 调整自动发现模型数量上限。可选的 `--json FILE` 会在本地保存原始答案；文件可能包含模型输出，请谨慎保管或分享。

## 隐私与网络边界

- 端点必须是 localhost 或私有/局域网地址；程序会拒绝公网主机。
- 禁止 HTTP 重定向；请求只会发送到所选的本机模型 API。
- 提示词、结果和生成的能力卡都不会发送到托管服务。是否以及如何分享 HTML 文件由你决定。
- 提示词是固定的合成示例；请勿向其中添加敏感信息。

## 开发

需要 Node.js 18 或更高版本；项目没有第三方依赖。

```sh
npm test
npm run check
```

## 许可证

MIT，详见 [LICENSE](LICENSE)。
