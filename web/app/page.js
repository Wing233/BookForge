"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { renderExerciseHtml } from "../lib/exercise-template";

// ---------- 把平铺 sections 组织成 chapters 树（移植自 renderer.build_book_data） ----------
function buildBookData(bookTitle, sections, exercisesMap) {
  const chapters = [];
  let currentChapter = null;
  let pendingChapterSection = null;

  sections.forEach((sec, idx) => {
    const ex = exercisesMap[idx];
    if (sec.level <= 1) {
      // 新建章节，暂存自身内容（待定是否作为 section）
      currentChapter = { title: sec.title, sections: [] };
      chapters.push(currentChapter);
      pendingChapterSection = sectionToDict(sec, ex);
    } else {
      // 归入当前章节
      if (currentChapter === null) {
        currentChapter = { title: "全书", sections: [] };
        chapters.push(currentChapter);
        pendingChapterSection = null;
      }
      // 有真正的子节，丢弃章自身的 pending section
      pendingChapterSection = null;
      currentChapter.sections.push(sectionToDict(sec, ex));
    }
  });

  // 仍在等待的章（该章没有任何子节，把章内容作为唯一 section）
  if (pendingChapterSection !== null && currentChapter !== null) {
    currentChapter.sections.push(pendingChapterSection);
  }

  if (!chapters.length && sections.length) {
    chapters.push({
      title: bookTitle || "全书",
      sections: sections.map((s, i) => sectionToDict(s, exercisesMap[i])),
    });
  }

  return { book_title: bookTitle, chapters };
}

function sectionToDict(sec, exercises) {
  return {
    title: sec.title,
    content: sec.content,
    exercises: exercises || [],
  };
}

// ---------- 页面样式 ----------
const PAGE_CSS = `
.wg-app {
  --bg: #F7F7F8; --surface: #FFFFFF; --surface-muted: #F2F2F5;
  --text: #171717; --text-muted: #52525B; --text-soft: #71717A;
  --border: rgba(23,23,23,0.08); --border-strong: rgba(23,23,23,0.16);
  --brand: #4B3FE3; --brand-soft: #F2F7FF; --brand-soft-strong: #E5EAFF;
  --brand-text: #1A1759; --brand-on: #FFFFFF;
  --success: #1DC981; --danger: #E8463A; --warning: #EFAA17;
  --radius: 8px; --radius-card: 12px; --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04); --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-size: 14px; line-height: 1.6;
}
.wg-app[data-theme="dark"] {
  --bg: #0F0F11; --surface: #18181B; --surface-muted: #1F1F23;
  --text: #E5E5E5; --text-muted: #A1A1AA; --text-soft: #8A8A93;
  --border: rgba(255,255,255,0.08); --border-strong: rgba(255,255,255,0.16);
  --brand: #6054F1; --brand-soft: #1A1759; --brand-soft-strong: #2A2570;
  --brand-text: #CFD8FF; --shadow-sm: 0 1px 2px rgba(0,0,0,0.3); --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
}
.wg-header {
  position: sticky; top: 0; z-index: 50; background: var(--surface);
  border-bottom: 1px solid var(--border); padding: 12px 20px;
  display: flex; align-items: center; gap: 16px; box-shadow: var(--shadow-sm);
}
.wg-header h1 { font-size: 16px; font-weight: 600; flex: 1; }
.wg-theme-btn {
  background: none; border: 1px solid var(--border); color: var(--text);
  width: 32px; height: 32px; border-radius: var(--radius-full); cursor: pointer;
  font-size: 14px; display: flex; align-items: center; justify-content: center;
}
.wg-theme-btn:hover { background: var(--surface-muted); }
.wg-main { max-width: 900px; margin: 0 auto; padding: 32px 20px 64px; }
.wg-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-card); padding: 32px; box-shadow: var(--shadow-sm);
}
.wg-card h2 { font-size: 22px; font-weight: 600; margin-bottom: 6px; }
.wg-card .sub { color: var(--text-muted); font-size: 14px; margin-bottom: 24px; }
.wg-drop {
  border: 2px dashed var(--border-strong); border-radius: var(--radius-card);
  padding: 32px; text-align: center; cursor: pointer; transition: all 0.15s;
  margin-bottom: 16px;
}
.wg-drop:hover { border-color: var(--brand); background: var(--brand-soft); }
.wg-drop .icon { font-size: 36px; margin-bottom: 8px; }
.wg-drop .t { font-weight: 600; margin-bottom: 4px; }
.wg-drop .s { font-size: 12px; color: var(--text-soft); }
.wg-file-name { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; word-break: break-all; }
.wg-btn {
  padding: 10px 20px; border: 1px solid var(--border); background: var(--surface);
  color: var(--text); border-radius: var(--radius); cursor: pointer;
  font-size: 14px; font-weight: 500; transition: all 0.15s; display: inline-flex; align-items: center; gap: 8px;
}
.wg-btn:hover { background: var(--surface-muted); }
.wg-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.wg-btn-primary { background: var(--brand); color: var(--brand-on); border-color: var(--brand); }
.wg-btn-primary:hover { opacity: 0.9; background: var(--brand); }
.wg-btn-danger { color: var(--danger); border-color: var(--danger); }
.wg-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.wg-status { font-size: 13px; color: var(--text-muted); margin-top: 12px; }
.wg-error { color: var(--danger); }
.wg-progress { margin: 20px 0; }
.wg-progress-bar { height: 8px; background: var(--surface-muted); border-radius: var(--radius-full); overflow: hidden; }
.wg-progress-fill { height: 100%; background: var(--brand); border-radius: var(--radius-full); transition: width 0.3s ease; }
.wg-progress-text { font-size: 12px; color: var(--text-soft); margin-top: 6px; display: flex; justify-content: space-between; }
.wg-stats { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.wg-stat { background: var(--surface-muted); border-radius: var(--radius-full); padding: 6px 14px; font-size: 12px; color: var(--text-muted); }
.wg-stat strong { color: var(--text); font-weight: 600; }
.wg-tree { border: 1px solid var(--border); border-radius: var(--radius-card); overflow: hidden; max-height: 460px; overflow-y: auto; }
.wg-ch { border-bottom: 1px solid var(--border); }
.wg-ch:last-child { border-bottom: none; }
.wg-ch-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer; font-weight: 600; font-size: 14px; user-select: none; }
.wg-ch-head:hover { background: var(--surface-muted); }
.wg-ch-toggle { font-size: 10px; color: var(--text-soft); width: 12px; }
.wg-ch.collapsed .wg-ch-toggle { transform: rotate(-90deg); }
.wg-ch-count { margin-left: auto; font-size: 11px; color: var(--text-soft); font-weight: 400; }
.wg-sec-list { padding: 0 14px 8px 30px; }
.wg-ch.collapsed .wg-sec-list { display: none; }
.wg-sec { display: flex; align-items: center; gap: 8px; padding: 6px 8px; font-size: 13px; color: var(--text-muted); border-radius: var(--radius); }
.wg-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); flex-shrink: 0; }
.wg-dot.done { background: var(--success); }
.wg-dot.cur { background: var(--brand); box-shadow: 0 0 0 4px var(--brand-soft-strong); }
.wg-sec .num { margin-left: auto; font-size: 11px; color: var(--text-soft); }
.wg-iframe { width: 100%; height: 75vh; border: 1px solid var(--border); border-radius: var(--radius-card); background: #fff; }
.wg-section-title { font-size: 13px; font-weight: 600; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.5px; margin: 24px 0 12px; }
.wg-link { color: var(--brand); cursor: pointer; font-size: 13px; background: none; border: none; padding: 0; }
.wg-link:hover { text-decoration: underline; }
.wg-spinner { width: 14px; height: 14px; border: 2px solid var(--border-strong); border-top-color: var(--brand); border-radius: 50%; animation: wg-spin 0.6s linear infinite; display: inline-block; }
@keyframes wg-spin { to { transform: rotate(360deg); } }
@media (max-width: 640px) { .wg-card { padding: 20px; } .wg-main { padding: 20px 14px 48px; } }
.wg-settings-panel {
  margin-top: 16px; padding: 16px; border: 1px solid var(--border);
  border-radius: var(--radius); background: var(--surface-muted);
}
.wg-settings-panel h3 { font-size: 14px; font-weight: 600; margin-bottom: 8px; }
.wg-settings-panel .field { margin-bottom: 12px; }
.wg-settings-panel label { display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.wg-settings-panel input {
  width: 100%; padding: 8px 12px; border: 1px solid var(--border);
  border-radius: var(--radius); background: var(--surface); color: var(--text);
  font-size: 13px; font-family: inherit;
}
.wg-settings-panel .hint {
  font-size: 12px; color: var(--text-soft); margin-top: 8px; line-height: 1.6;
}
.wg-settings-panel .warn {
  margin-top: 8px; padding: 8px 12px; background: rgba(239,170,23,0.08);
  border-left: 3px solid var(--warning); border-radius: 4px;
  font-size: 12px; color: var(--text-muted); line-height: 1.6;
}
.wg-key-status {
  font-size: 12px; color: var(--text-soft); margin-left: auto;
}
.wg-key-status.set { color: var(--success); }
`;

// ---------- 组件 ----------
export default function Page() {
  const [theme, setTheme] = useState("light");
  const [stage, setStage] = useState("upload"); // upload | generate
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [book, setBook] = useState(null); // { book_title, sections }
  const [exercisesMap, setExercisesMap] = useState({}); // { idx: [exercises] }
  const exercisesMapRef = useRef({});
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const stopRef = useRef(false);
  const fileInputRef = useRef(null);

  // DeepSeek API 配置（存浏览器 localStorage，调用时经请求头透传到后端）
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("deepseek-chat");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem("wg_theme") || "light";
      setTheme(t);
      const k = localStorage.getItem("wg_deepseek_key") || "";
      const m = localStorage.getItem("wg_deepseek_model") || "deepseek-chat";
      setApiKey(k);
      setModel(m);
    } catch (e) {}
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      localStorage.setItem("wg_theme", next);
    } catch (e) {}
  }

  function saveSettings() {
    try {
      localStorage.setItem("wg_deepseek_key", apiKey);
      localStorage.setItem("wg_deepseek_model", model);
    } catch (e) {}
    setShowSettings(false);
  }

  const sections = book ? book.sections : [];
  const completedCount = useMemo(
    () => sections.filter((_, i) => exercisesMapRef.current[i] !== undefined).length,
    [exercisesMap, sections]
  );
  const totalExercises = useMemo(
    () =>
      sections.reduce(
        (sum, _, i) => sum + (exercisesMap[i] ? exercisesMap[i].length : 0),
        0
      ),
    [exercisesMap, sections]
  );

  function onPickFile(e) {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
      setError("");
    }
  }

  async function onParse() {
    if (!file) {
      setError("请先选择 PDF 文件");
      return;
    }
    setParsing(true);
    setError("");
    try {
      // 浏览器端直接解析 PDF，避免上传触发 serverless 413 限制
      // 动态导入 PdfParserClient（内部延迟加载 pdfjs-dist，避免 SSR 时 DOMMatrix 未定义）
      const { parsePdfInBrowser } = await import("./PdfParserClient");
      const data = await parsePdfInBrowser(file);
      setBook(data);
      exercisesMapRef.current = {};
      setExercisesMap({});
      setCurrentIndex(-1);
      setPreviewHtml("");
      setStage("generate");
    } catch (e) {
      setError("PDF 解析失败: " + (e?.message || String(e)));
    } finally {
      setParsing(false);
    }
  }

  function findStartIndex() {
    for (let i = 0; i < sections.length; i++) {
      if (exercisesMapRef.current[i] === undefined) return i;
    }
    return sections.length;
  }

  async function startGenerate() {
    // 前端未填 key 且后端也可能未配置环境变量时，提前提示
    if (!apiKey) {
      setError("请先点击右上角「设置」填写 DeepSeek API Key");
      setShowSettings(true);
      return;
    }
    setGenerating(true);
    setError("");
    stopRef.current = false;
    let i = findStartIndex();
    for (; i < sections.length; i++) {
      if (stopRef.current) break;
      const sec = sections[i];
      // 内容过短直接跳过，标记为空题目，不调用 API
      if (!sec.content || sec.content.length < 200) {
        exercisesMapRef.current = {
          ...exercisesMapRef.current,
          [i]: [],
        };
        setExercisesMap({ ...exercisesMapRef.current });
        continue;
      }
      setCurrentIndex(i);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-deepseek-api-key": apiKey,
            "x-deepseek-model": model,
          },
          body: JSON.stringify({ title: sec.title, content: sec.content }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "生成失败");
          break;
        }
        exercisesMapRef.current = {
          ...exercisesMapRef.current,
          [i]: data.exercises || [],
        };
        setExercisesMap({ ...exercisesMapRef.current });
      } catch (e) {
        setError(e.message);
        break;
      }
    }
    setCurrentIndex(-1);
    setGenerating(false);
  }

  function stopGenerate() {
    stopRef.current = true;
  }

  function viewBook() {
    const bookData = buildBookData(
      book.book_title,
      sections,
      exercisesMapRef.current
    );
    setPreviewHtml(renderExerciseHtml(bookData));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  }

  function openInNewWindow() {
    const w = window.open();
    if (w) {
      w.document.open();
      w.document.write(previewHtml);
      w.document.close();
    }
  }

  function downloadHtml() {
    const blob = new Blob([previewHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.book_title || "练习册"}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function resetAll() {
    setStage("upload");
    setBook(null);
    setFile(null);
    setFileName("");
    setExercisesMap({});
    exercisesMapRef.current = {};
    setPreviewHtml("");
    setError("");
    setCurrentIndex(-1);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const progress =
    sections.length > 0
      ? Math.round((completedCount / sections.length) * 100)
      : 0;

  return (
    <div className="wg-app" data-theme={theme}>
      <style dangerouslySetInnerHTML={{ __html: PAGE_CSS }} />
      <header className="wg-header">
        <h1>📚 练习册生成器</h1>
        <span className={`wg-key-status${apiKey ? " set" : ""}`}>
          {apiKey ? `● 已配置 ${model}` : "○ 未配置 API Key"}
        </span>
        <button className="wg-theme-btn" onClick={() => setShowSettings(!showSettings)} aria-label="API 设置" title="API 设置">
          ⚙️
        </button>
        <button className="wg-theme-btn" onClick={toggleTheme} aria-label="切换主题">
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </header>

      <main className="wg-main">
        {showSettings && (
          <div className="wg-card" style={{ marginBottom: 20 }}>
            <h2>API 设置</h2>
            <p className="sub">配置 DeepSeek API Key 以生成练习题。Key 保存在浏览器本地。</p>
            <div className="wg-settings-panel">
              <div className="field">
                <label>DeepSeek API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>
              <div className="field">
                <label>模型</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="deepseek-chat"
                />
                <div className="hint">
                  常用模型：deepseek-chat（V3，通用）、deepseek-reasoner（R1，推理）。详见 DeepSeek 官方文档。
                </div>
              </div>
              <div className="warn">
                ⚠️ 安全提示：你填入的 Key 仅保存在本浏览器 localStorage，但调用时会通过请求头发送到部署的服务端再转发给 DeepSeek。
                请仅在你信任的部署实例上填写；生产环境建议改为服务端环境变量 <code>DEEPSEEK_API_KEY</code>。
              </div>
              <div className="wg-row" style={{ marginTop: 12 }}>
                <button className="wg-btn wg-btn-primary" onClick={saveSettings}>保存</button>
                <button className="wg-btn" onClick={() => setShowSettings(false)}>取消</button>
                {apiKey && (
                  <button
                    className="wg-btn wg-btn-danger"
                    onClick={() => {
                      setApiKey("");
                      setModel("deepseek-chat");
                      try {
                        localStorage.removeItem("wg_deepseek_key");
                        localStorage.removeItem("wg_deepseek_model");
                      } catch (e) {}
                    }}
                  >
                    清除
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {stage === "upload" && (
          <div className="wg-card">
            <h2>上传 PDF 教材</h2>
            <p className="sub">上传一本 PDF 教材，系统将解析章节并逐节调用 DeepSeek 生成练习题。</p>

            <label className="wg-drop" onClick={() => fileInputRef.current && fileInputRef.current.click()}>
              <div className="icon">📄</div>
              <div className="t">{fileName || "点击选择 PDF 文件"}</div>
              <div className="s">支持 .pdf，最大 50MB</div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={onPickFile}
                style={{ display: "none" }}
              />
            </label>

            <div className="wg-row">
              <button
                className="wg-btn wg-btn-primary"
                onClick={onParse}
                disabled={!file || parsing}
              >
                {parsing ? "解析中…" : "开始解析"}
              </button>
              {error && <span className="wg-status wg-error">{error}</span>}
            </div>
            {parsing && (
              <div className="wg-status">正在提取文本与识别章节，请稍候…</div>
            )}
          </div>
        )}

        {stage === "generate" && book && (
          <>
            <div className="wg-card" style={{ marginBottom: 20 }}>
              <div className="wg-row" style={{ justifyContent: "space-between" }}>
                <h2 style={{ margin: 0 }}>{book.book_title}</h2>
                <button className="wg-link" onClick={resetAll}>
                  重新上传
                </button>
              </div>
              <div className="wg-stats" style={{ marginTop: 16 }}>
                <div className="wg-stat">章节 <strong>{book.sections.filter((s) => s.level <= 1).length}</strong></div>
                <div className="wg-stat">小节 <strong>{sections.length}</strong></div>
                <div className="wg-stat">已生成 <strong>{completedCount}</strong></div>
                <div className="wg-stat">题目 <strong>{totalExercises}</strong></div>
              </div>

              <div className="wg-progress">
                <div className="wg-progress-bar">
                  <div className="wg-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="wg-progress-text">
                  <span>{generating ? "生成中…" : progress >= 100 ? "已全部完成" : "等待开始"}</span>
                  <span>{completedCount} / {sections.length}（{progress}%）</span>
                </div>
              </div>

              <div className="wg-row">
                {!generating ? (
                  <button
                    className="wg-btn wg-btn-primary"
                    onClick={startGenerate}
                    disabled={completedCount >= sections.length}
                  >
                    {completedCount > 0 ? "继续生成" : "开始生成"}
                  </button>
                ) : (
                  <button className="wg-btn wg-btn-danger" onClick={stopGenerate}>
                    停止生成
                  </button>
                )}
                <button
                  className="wg-btn"
                  onClick={viewBook}
                  disabled={totalExercises === 0}
                >
                  查看练习册
                </button>
              </div>
              {error && <div className="wg-status wg-error">⚠ {error}</div>}
              {generating && currentIndex >= 0 && (
                <div className="wg-status">
                  <span className="wg-spinner" /> 正在生成第 {currentIndex + 1} / {sections.length} 节：{sections[currentIndex].title}
                </div>
              )}
            </div>

            <div className="wg-section-title">章节目录</div>
            <div className="wg-tree">
              {buildChapterTree(sections).map((ch, ci) => (
                <ChapterView
                  key={ci}
                  chapter={ch}
                  exercisesMap={exercisesMap}
                  currentIndex={currentIndex}
                />
              ))}
            </div>

            {previewHtml && (
              <>
                <div className="wg-section-title" style={{ marginTop: 32 }}>
                  练习册预览
                </div>
                <div className="wg-row" style={{ marginBottom: 12 }}>
                  <button className="wg-btn wg-btn-primary" onClick={openInNewWindow}>
                    新窗口打开
                  </button>
                  <button className="wg-btn" onClick={downloadHtml}>
                    下载 HTML
                  </button>
                </div>
                <iframe className="wg-iframe" srcDoc={previewHtml} title="练习册预览" />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ---------- 把平铺 sections 按 level 分组为 chapter 树（仅用于展示） ----------
// 每章节记录 headerIdx（level-1 自身的全局索引，无则为 -1），
// 以及 sections（子节，带 globalIdx）。
function buildChapterTree(sections) {
  const chapters = [];
  let current = null;
  sections.forEach((sec, idx) => {
    if (sec.level <= 1) {
      current = { title: sec.title, headerIdx: idx, sections: [] };
      chapters.push(current);
    } else {
      if (!current) {
        current = { title: "全书", headerIdx: -1, sections: [] };
        chapters.push(current);
      }
      current.sections.push({ title: sec.title, globalIdx: idx });
    }
  });
  if (!chapters.length) {
    chapters.push({
      title: "全书",
      headerIdx: -1,
      sections: sections.map((s, i) => ({ title: s.title, globalIdx: i })),
    });
  }
  return chapters;
}

function ChapterView({ chapter, exercisesMap, currentIndex }) {
  const [collapsed, setCollapsed] = useState(false);

  // 本章涉及的全部全局索引（含章首与子节）
  const idxList = [];
  if (chapter.headerIdx >= 0) idxList.push(chapter.headerIdx);
  chapter.sections.forEach((s) => idxList.push(s.globalIdx));
  const done = idxList.filter((i) => exercisesMap[i] !== undefined).length;
  const total = idxList.length;

  return (
    <div className={"wg-ch" + (collapsed ? " collapsed" : "")}>
      <div className="wg-ch-head" onClick={() => setCollapsed((c) => !c)}>
        <span className="wg-ch-toggle">▼</span>
        <span>{chapter.title}</span>
        <span className="wg-ch-count">
          {done}/{total}
        </span>
      </div>
      <ul className="wg-sec-list">
        {chapter.sections.length === 0 && chapter.headerIdx >= 0 && (
          <li className="wg-sec">
            <StatusDot
              idx={chapter.headerIdx}
              exercisesMap={exercisesMap}
              currentIndex={currentIndex}
            />
            <span>（本章内容）</span>
            <SectionNum idx={chapter.headerIdx} exercisesMap={exercisesMap} />
          </li>
        )}
        {chapter.sections.map((s) => (
          <li key={s.globalIdx} className="wg-sec">
            <StatusDot
              idx={s.globalIdx}
              exercisesMap={exercisesMap}
              currentIndex={currentIndex}
            />
            <span>{s.title || `第 ${s.globalIdx + 1} 节`}</span>
            <SectionNum idx={s.globalIdx} exercisesMap={exercisesMap} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusDot({ idx, exercisesMap, currentIndex }) {
  const isCur = idx === currentIndex;
  const isDone = exercisesMap[idx] !== undefined;
  const cls = "wg-dot" + (isCur ? " cur" : isDone ? " done" : "");
  return <span className={cls} />;
}

function SectionNum({ idx, exercisesMap }) {
  const ex = exercisesMap[idx];
  if (!ex) return null;
  return <span className="num">{ex.length} 题</span>;
}
