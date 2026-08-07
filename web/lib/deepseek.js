// DeepSeek（OpenAI 兼容）调用 + Prompt。
// 逻辑忠实移植自 Python 版 generator.py。

import OpenAI from "openai";

// ---------- 配置（在函数内部读取，确保运行时拿到环境变量） ----------
const GENERATE_MAX_RETRIES = 2;
const EXERCISES_PER_SECTION_MIN = 3;
const EXERCISES_PER_SECTION_MAX = 5;
const SECTION_MIN_CHARS = 200;

// ---------- 系统提示词（完整复用 generator.py 的 SYSTEM_PROMPT） ----------
const SYSTEM_PROMPT = `你是一位严谨的教材练习题编写专家。根据用户提供的章节内容，生成用于巩固学习的练习题。

要求：
1. 题目必须紧扣本节内容，不得超纲或臆造。
2. 解析要清晰、有理有据，尽量引用原文要点。
3. 难度分布：简单/中等/困难 都要有，但以中等为主。
4. 输出必须是纯 JSON 数组，不要任何额外文字、不要 markdown 代码块。

题型与字段约定：
- single_choice（单选）：options 为 4 个字符串，answer 为正确选项的下标（整数 0-3）
- multi_choice（多选）：options 为 4 个字符串，answer 为正确选项下标数组（如 [0,2]）
- judge（判断）：options 为 ["正确","错误"]，answer 为 0 或 1
- fill（填空）：无 options 字段，answer 为字符串

每个题目对象的字段：
{
  "type": "single_choice",
  "question": "题干",
  "options": ["A选项","B选项","C选项","D选项"],
  "answer": 0,
  "explanation": "解析说明",
  "difficulty": 2
}

difficulty 取 1（简单）、2（中等）、3（困难）。
只输出 JSON 数组本身，从 [ 开始，到 ] 结束。`;

// ---------- 构建用户提示词 ----------
function buildUserPrompt(title, content) {
  const n =
    Math.floor(Math.random() * (EXERCISES_PER_SECTION_MAX - EXERCISES_PER_SECTION_MIN + 1)) +
    EXERCISES_PER_SECTION_MIN;

  // 内容过长则截断，避免超出上下文
  let body = content;
  if (body.length > 6000) {
    body = body.slice(0, 6000) + "\n...(内容已截断)";
  }

  return (
    `章节标题：${title}\n\n` +
    `章节内容：\n${body}\n\n` +
    `请为本节生成 ${n} 道练习题，题型搭配合理（以单选为主，可含 1 道多选、1 道判断、1 道填空）。\n` +
    `严格按系统提示的 JSON 格式输出。注意：输出最外层必须是 JSON 对象，` +
    `用 {"exercises": [...]} 包裹题目数组。`
  );
}

// ---------- 解析模型返回（兼容裸数组与 {exercises:[...]} 两种形式） ----------
function parseResponse(raw) {
  raw = (raw || "").trim();
  if (!raw) return [];

  // 去掉可能的 markdown 代码块包裹
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/, "");
    raw = raw.replace(/\s*```$/, "");
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON 解析失败: ${e.message}`);
  }

  let exercises;
  if (Array.isArray(data)) {
    exercises = data;
  } else if (data && typeof data === "object") {
    exercises = data.exercises || data.data || [];
  } else {
    return [];
  }

  return exercises
    .filter((ex) => ex && typeof ex === "object")
    .map(normalizeExercise);
}

// ---------- 规整单道题目字段，保证前端一致 ----------
function normalizeExercise(ex) {
  const type = ex.type || "single_choice";
  const result = {
    type,
    question: String(ex.question || "").trim(),
    answer: ex.answer,
    explanation: String(ex.explanation || "").trim(),
    difficulty: parseInt(ex.difficulty, 10) || 2,
  };
  if (type !== "fill") {
    const opts = ex.options || [];
    result.options = opts.map((o) => String(o).trim());
  }
  return result;
}

// ---------- 对外：为单个章节生成练习题 ----------
// options.apiKey / options.baseUrl / options.model 由调用方传入，
// 优先级：调用方传入 > 环境变量。这样前端面板填入的 key 可经请求头透传到此处。
export async function generateExercises(title, content, options = {}) {
  if (!content || content.length < SECTION_MIN_CHARS) {
    return [];
  }

  const DEEPSEEK_API_KEY = options.apiKey || process.env.DEEPSEEK_API_KEY || "";
  const DEEPSEEK_BASE_URL =
    options.baseUrl || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const DEEPSEEK_MODEL = options.model || process.env.DEEPSEEK_MODEL || "deepseek-chat";

  if (!DEEPSEEK_API_KEY) {
    throw new Error("未配置 DEEPSEEK_API_KEY，请在页面顶部填写或设置环境变量");
  }

  const client = new OpenAI({
    apiKey: DEEPSEEK_API_KEY,
    baseURL: DEEPSEEK_BASE_URL,
  });

  const userPrompt = buildUserPrompt(title, content);

  let lastError = null;
  for (let attempt = 0; attempt <= GENERATE_MAX_RETRIES; attempt++) {
    try {
      const resp = await client.chat.completions.create({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        // DeepSeek 支持 json_object 模式，强制输出合法 JSON
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      const raw = resp.choices[0].message.content || "";
      const exercises = parseResponse(raw);
      if (exercises.length) {
        return exercises;
      }
      lastError = new Error("模型返回空题目列表");
    } catch (e) {
      lastError = e;
      // 网络类错误稍微退避后重试
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }

  throw new Error(
    `生成失败（重试 ${GENERATE_MAX_RETRIES} 次后仍出错）: ${
      lastError ? lastError.message : "unknown"
    }`
  );
}
