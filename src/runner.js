const cases = [
  {
    id: "structured-output",
    label: "结构化输出",
    messages: [{ role: "user", content: 'Return only one valid JSON object with exactly these keys: "status" and "items". Set status to "ready" and items to an array containing the string "lifeboat". No markdown.' }],
    json: true,
    score(answer) {
      try {
        const value = JSON.parse(answer.trim());
        const keys = Object.keys(value).sort();
        const passed = keys.join(",") === "items,status" && value.status === "ready" && Array.isArray(value.items) && value.items.includes("lifeboat");
        return { passed, note: passed ? "Valid JSON with the requested shape." : "JSON parsed, but the exact requested shape was not met." };
      } catch {
        return { passed: false, note: "Response was not valid bare JSON." };
      }
    }
  },
  {
    id: "arithmetic",
    label: "算术指令",
    messages: [{ role: "user", content: "A basket has 12 apples. Add 7, give away 5, then double the remainder. Reply with one integer only." }],
    score(answer) {
      const passed = /^\s*28\s*[.!。]?\s*$/.test(answer);
      return { passed, note: passed ? "Correct: 28." : "Expected the exact answer 28." };
    }
  },
  {
    id: "code-shape",
    label: "代码生成",
    messages: [{ role: "user", content: "Write a JavaScript function named sumEven(nums) that returns the sum of even integers. Include code only; do not explain." }],
    score(answer) {
      const named = /function\s+sumEven\s*\(|(?:const|let)\s+sumEven\s*=/.test(answer);
      const parity = /%\s*2|2\s*===?\s*[^\n;]*%/.test(answer);
      const aggregation = /filter|reduce|for\s*\(|for\s+\w+/.test(answer);
      const passed = named && parity && aggregation;
      return { passed, note: passed ? "Contains a function, parity check, and aggregation/loop (heuristic)." : "Did not match the basic function/parity/aggregation checks." };
    }
  },
  {
    id: "conversation-memory",
    label: "多轮上下文",
    messages: [
      { role: "user", content: "Remember this code for the next turn: ORBIT-27. Reply only: stored." },
      { role: "assistant", content: "stored" },
      { role: "user", content: "What was the code? Reply with the code only." }
    ],
    score(answer) {
      const passed = /\bORBIT-27\b/.test(answer);
      return { passed, note: passed ? "Repeated the code from the earlier turn." : "Did not reproduce the earlier code." };
    }
  },
  {
    id: "chinese-short-answer",
    label: "中文简短回答",
    messages: [{ role: "user", content: "请只用简体中文、不超过 12 个汉字回答：本地自动保存草稿最大的好处是什么？" }],
    score(answer) {
      const hanCount = (answer.match(/\p{Script=Han}/gu) || []).length;
      const passed = hanCount > 0 && hanCount <= 12 && /恢复|找回|保留|丢失|继续/.test(answer);
      return { passed, note: passed ? `Relevant short Chinese answer (${hanCount} Han characters; heuristic).` : `Expected a relevant answer of at most 12 Han characters; got ${hanCount}.` };
    }
  }
];

export function getCases() {
  return cases.map(({ id, label }) => ({ id, label }));
}

export async function runBenchmark(provider, modelNames) {
  const models = [];
  for (const name of modelNames) {
    const results = [];
    for (const item of cases) {
      const startedAt = performance.now();
      try {
        const answer = await provider.chat(name, item.messages, { json: Boolean(item.json) });
        const latencyMs = Math.round(performance.now() - startedAt);
        const scored = item.score(answer);
        results.push({ id: item.id, label: item.label, passed: scored.passed, note: scored.note, latencyMs, answer: answer.slice(0, 1600) });
      } catch (error) {
        results.push({ id: item.id, label: item.label, passed: false, note: String(error?.message || error).slice(0, 300), latencyMs: Math.round(performance.now() - startedAt), answer: "" });
      }
    }
    const passCount = results.filter((result) => result.passed).length;
    models.push({ name, score: Math.round((passCount / cases.length) * 100), passCount, total: cases.length, cases: results });
  }
  return models.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}
