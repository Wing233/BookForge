// POST /api/generate
// 接收 JSON: { title, content }
// 为单个章节生成练习题。内容过短（<200字）直接返回空 exercises。
// LLM 配置优先级：请求头 X-LLM-* > 环境变量 LLM_* > DEEPSEEK_*（旧名兼容）。
// 兼容所有 OpenAI 协议厂商。
// 返回 { exercises: [{ type, question, options, answer, explanation, difficulty }] }

import { generateExercises } from "../../../lib/deepseek";

const SECTION_MIN_CHARS = 200;

export async function POST(request) {
  try {
    const body = await request.json();
    const title = body && body.title;
    const content = body && body.content;

    if (!title || !content || content.length < SECTION_MIN_CHARS) {
      return Response.json({ exercises: [] });
    }

    // 前端面板填入的配置通过请求头透传（仅当未配置环境变量时使用）
    const apiKey =
      request.headers.get("x-llm-api-key") ||
      request.headers.get("x-deepseek-api-key") ||
      undefined;
    const baseUrl =
      request.headers.get("x-llm-base-url") ||
      request.headers.get("x-deepseek-base-url") ||
      undefined;
    const model =
      request.headers.get("x-llm-model") ||
      request.headers.get("x-deepseek-model") ||
      undefined;

    const exercises = await generateExercises(title, content, {
      apiKey,
      baseUrl,
      model,
    });
    return Response.json({ exercises });
  } catch (e) {
    return Response.json(
      { error: `生成失败: ${e.message}` },
      { status: 500 }
    );
  }
}
