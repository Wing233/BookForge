// 练习册 HTML 模板字符串。
// 完整复用 templates/exercise.html 的 CSS 和 JS（侧边栏章节树 + 答题卡 + 即时判题
// + 进度统计 + 暗色模式 + 移动端适配）。数据通过 __BOOK_DATA__ 占位符注入。
//
// 注意：模板内部 <script> 大量使用反引号与 ${}，这里用外层模板字面量承载，
// 需把内层的 ` 转义为 \`、${ 转义为 \${（原文件无反斜杠，无需额外转义）。

const TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>练习册</title>
<style>
  :root {
    color-scheme: light;
    --bg: #F7F7F8;
    --surface: #FFFFFF;
    --surface-muted: #F2F2F5;
    --text: #171717;
    --text-muted: #52525B;
    --text-soft: #71717A;
    --border: rgba(23, 23, 23, 0.08);
    --border-strong: rgba(23, 23, 23, 0.16);
    --brand: #4B3FE3;
    --brand-soft: #F2F7FF;
    --brand-soft-strong: #E5EAFF;
    --brand-text: #1A1759;
    --brand-on: #FFFFFF;
    --success: #1DC981;
    --warning: #EFAA17;
    --danger: #E8463A;
    --radius: 8px;
    --radius-card: 12px;
    --radius-full: 999px;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.06);
    --font-sans: "SF Pro Text", "PingFang SC", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    --sidebar-w: 280px;
  }
  :root[data-theme="dark"] {
    color-scheme: dark;
    --bg: #0F0F11;
    --surface: #18181B;
    --surface-muted: #1F1F23;
    --text: #E5E5E5;
    --text-muted: #A1A1AA;
    --text-soft: #8A8A93;
    --border: rgba(255,255,255,0.08);
    --border-strong: rgba(255,255,255,0.16);
    --brand: #6054F1;
    --brand-soft: #1A1759;
    --brand-soft-strong: #2A2570;
    --brand-text: #CFD8FF;
    --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
    --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body {
    font-family: var(--font-sans);
    background: var(--bg);
    color: var(--text);
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* 顶部栏 */
  .app-header {
    position: sticky;
    top: 0;
    z-index: 50;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
  }
  .menu-toggle {
    display: none;
    background: none;
    border: none;
    color: var(--text);
    cursor: pointer;
    padding: 6px;
    border-radius: var(--radius);
    font-size: 18px;
  }
  .menu-toggle:hover { background: var(--surface-muted); }
  .book-title {
    font-size: 16px;
    font-weight: 600;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .header-stats {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  .stat-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: var(--surface-muted);
    border-radius: var(--radius-full);
    font-size: 12px;
    color: var(--text-muted);
  }
  .stat-pill strong { color: var(--text); font-weight: 600; }
  .theme-toggle {
    background: none;
    border: 1px solid var(--border);
    color: var(--text);
    cursor: pointer;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }
  .theme-toggle:hover { background: var(--surface-muted); }

  /* 布局 */
  .app-body {
    display: flex;
    min-height: calc(100vh - 57px);
  }
  .sidebar {
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    position: sticky;
    top: 57px;
    height: calc(100vh - 57px);
    flex-shrink: 0;
    padding: 16px 0;
  }
  .sidebar-section {
    padding: 0 12px;
    margin-bottom: 4px;
  }
  .sidebar-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 8px 12px;
  }
  .chapter-item {
    border-radius: var(--radius);
    margin-bottom: 2px;
    overflow: hidden;
  }
  .chapter-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: var(--radius);
    font-weight: 500;
    font-size: 14px;
    color: var(--text);
    user-select: none;
  }
  .chapter-header:hover { background: var(--surface-muted); }
  .chapter-header.active { background: var(--brand-soft-strong); color: var(--brand-text); }
  .chapter-toggle {
    font-size: 10px;
    color: var(--text-soft);
    transition: transform 0.2s;
    width: 14px;
    text-align: center;
  }
  .chapter-item.collapsed .chapter-toggle { transform: rotate(-90deg); }
  .chapter-progress {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
  }
  .section-list {
    list-style: none;
    padding: 2px 0 4px 22px;
  }
  .chapter-item.collapsed .section-list { display: none; }
  .section-item {
    padding: 6px 12px;
    cursor: pointer;
    border-radius: var(--radius);
    font-size: 13px;
    color: var(--text-muted);
    user-select: none;
    position: relative;
  }
  .section-item::before {
    content: "";
    position: absolute;
    left: 6px;
    top: 50%;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--border-strong);
    transform: translateY(-50%);
  }
  .section-item:hover { background: var(--surface-muted); color: var(--text); }
  .section-item.active {
    background: var(--brand-soft-strong);
    color: var(--brand-text);
    font-weight: 500;
  }
  .section-item.active::before { background: var(--brand); }
  .section-item.done::before { background: var(--success); }

  /* 主区 */
  .main {
    flex: 1;
    padding: 24px 32px 64px;
    max-width: 900px;
    margin: 0 auto;
    min-width: 0;
  }
  .breadcrumb {
    font-size: 12px;
    color: var(--text-soft);
    margin-bottom: 8px;
  }
  .section-title {
    font-size: 22px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--text);
  }
  .section-meta {
    font-size: 12px;
    color: var(--text-soft);
    margin-bottom: 24px;
  }
  .progress-bar {
    height: 4px;
    background: var(--surface-muted);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: 24px;
  }
  .progress-fill {
    height: 100%;
    background: var(--brand);
    border-radius: var(--radius-full);
    transition: width 0.3s ease;
  }

  /* 空状态 */
  .empty-state {
    text-align: center;
    padding: 48px 24px;
    background: var(--surface);
    border: 1px dashed var(--border-strong);
    border-radius: var(--radius-card);
    color: var(--text-muted);
  }
  .empty-state .icon {
    font-size: 32px;
    margin-bottom: 12px;
    opacity: 0.6;
  }
  .empty-state h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
  }
  .empty-state p { font-size: 13px; }

  /* 内容预览（题目未生成时） */
  .content-preview {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: 20px 24px;
    margin-bottom: 20px;
  }
  .content-preview h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-soft);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .content-preview-text {
    font-size: 14px;
    line-height: 1.8;
    color: var(--text-muted);
    max-height: 400px;
    overflow-y: auto;
    white-space: pre-wrap;
    font-family: var(--font-sans);
  }

  /* 题目卡片 */
  .exercise-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    padding: 20px 24px;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);
  }
  .exercise-head {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }
  .exercise-num {
    background: var(--brand);
    color: var(--brand-on);
    width: 24px;
    height: 24px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .exercise-type {
    font-size: 11px;
    color: var(--text-soft);
    background: var(--surface-muted);
    padding: 2px 8px;
    border-radius: var(--radius-full);
  }
  .exercise-question {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    line-height: 1.6;
  }
  .options { list-style: none; margin: 12px 0; }
  .option {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 14px;
    margin-bottom: 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all 0.15s;
  }
  .option:hover { background: var(--surface-muted); border-color: var(--border-strong); }
  .option.selected { background: var(--brand-soft); border-color: var(--brand); }
  .option.correct { background: rgba(29,201,129,0.08); border-color: var(--success); }
  .option.wrong { background: rgba(232,70,58,0.08); border-color: var(--danger); }
  .option-label {
    font-weight: 600;
    color: var(--text-muted);
    flex-shrink: 0;
    width: 20px;
  }
  .option.selected .option-label { color: var(--brand); }
  .option-text { flex: 1; }

  .exercise-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }
  .btn {
    padding: 6px 16px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text);
    border-radius: var(--radius);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s;
  }
  .btn:hover { background: var(--surface-muted); }
  .btn-primary {
    background: var(--brand);
    color: var(--brand-on);
    border-color: var(--brand);
  }
  .btn-primary:hover { opacity: 0.9; background: var(--brand); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .explanation {
    margin-top: 12px;
    padding: 14px 16px;
    background: var(--surface-muted);
    border-radius: var(--radius);
    border-left: 3px solid var(--brand);
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-muted);
    display: none;
  }
  .explanation.show { display: block; }
  .explanation-label {
    font-weight: 600;
    color: var(--brand);
    margin-bottom: 4px;
    font-size: 12px;
  }

  /* 移动端 */
  @media (max-width: 768px) {
    :root { --sidebar-w: 280px; }
    .menu-toggle { display: flex; align-items: center; }
    .sidebar {
      position: fixed;
      top: 57px;
      left: 0;
      z-index: 40;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
      box-shadow: var(--shadow-md);
    }
    .sidebar.open { transform: translateX(0); }
    .main { padding: 16px 16px 48px; }
    .section-title { font-size: 18px; }
    .header-stats { gap: 8px; }
    .stat-pill { padding: 3px 10px; font-size: 11px; }
    .overlay {
      display: none;
      position: fixed;
      top: 57px;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.4);
      z-index: 35;
    }
    .overlay.show { display: block; }
  }

  /* 滚动条 */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-soft); }
</style>
</head>
<body>
<div class="app-header">
  <button class="menu-toggle" id="menuToggle" aria-label="菜单">☰</button>
  <div class="book-title" id="bookTitle">练习册</div>
  <div class="header-stats">
    <div class="stat-pill">进度 <strong id="progressText">0%</strong></div>
    <div class="stat-pill">正确 <strong id="accuracyText">—</strong></div>
    <button class="theme-toggle" id="themeToggle" aria-label="切换主题">🌙</button>
  </div>
</div>

<div class="overlay" id="overlay"></div>

<div class="app-body">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-label">目录</div>
    <div class="sidebar-section" id="chapterList"></div>
  </aside>

  <main class="main" id="mainContent">
    <!-- 由 JS 渲染 -->
  </main>
</div>

<script id="book-data" type="application/json">__BOOK_DATA__</script>
<script>
  const BOOK = JSON.parse(document.getElementById('book-data').textContent);

  // ---------- 状态 ----------
  const state = {
    currentChapter: 0,
    currentSection: 0,
    // 答题状态：{ "c-s-ex": { selected, judged } }
    answers: loadProgress(),
  };

  // ---------- 持久化 ----------
  const STORAGE_KEY = 'exercise_progress_' + (BOOK.book_title || 'default');
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers)); }
    catch {}
  }

  // ---------- 主题 ----------
  const themeToggle = document.getElementById('themeToggle');
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
    try { localStorage.setItem('exercise_theme', t); } catch {}
  }
  applyTheme(localStorage.getItem('exercise_theme') || 'light');
  themeToggle.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme');
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  // ---------- 移动端侧边栏 ----------
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const menuToggle = document.getElementById('menuToggle');
  function toggleSidebar(open) {
    sidebar.classList.toggle('open', open);
    overlay.classList.toggle('show', open);
  }
  menuToggle.addEventListener('click', () => toggleSidebar(!sidebar.classList.contains('open')));
  overlay.addEventListener('click', () => toggleSidebar(false));

  // ---------- 渲染目录 ----------
  function renderSidebar() {
    const list = document.getElementById('chapterList');
    document.getElementById('bookTitle').textContent = BOOK.book_title || '练习册';
    list.innerHTML = '';

    (BOOK.chapters || []).forEach((ch, ci) => {
      const item = document.createElement('div');
      item.className = 'chapter-item';
      const doneCount = (ch.sections || []).filter((_, si) => isSectionDone(ci, si)).length;
      const totalCount = (ch.sections || []).length;

      const header = document.createElement('div');
      header.className = 'chapter-header';
      header.innerHTML = \`
        <span class="chapter-toggle">▼</span>
        <span>\${escapeHtml(ch.title)}</span>
        <span class="chapter-progress">\${doneCount}/\${totalCount}</span>
      \`;
      header.addEventListener('click', (e) => {
        if (e.target.classList.contains('chapter-progress')) return;
        item.classList.toggle('collapsed');
      });

      const secList = document.createElement('ul');
      secList.className = 'section-list';
      (ch.sections || []).forEach((sec, si) => {
        const li = document.createElement('li');
        li.className = 'section-item';
        if (ci === state.currentChapter && si === state.currentSection) li.classList.add('active');
        if (isSectionDone(ci, si)) li.classList.add('done');
        li.textContent = sec.title || \`第 \${si+1} 节\`;
        li.addEventListener('click', () => {
          state.currentChapter = ci;
          state.currentSection = si;
          renderSidebar();
          renderMain();
          toggleSidebar(false);
        });
        secList.appendChild(li);
      });

      item.appendChild(header);
      item.appendChild(secList);
      list.appendChild(item);
    });
  }

  function isSectionDone(ci, si) {
    const sec = BOOK.chapters?.[ci]?.sections?.[si];
    if (!sec || !sec.exercises || sec.exercises.length === 0) return false;
    return sec.exercises.every((_, ei) => state.answers[\`\${ci}-\${si}-\${ei}\`]?.judged);
  }

  // ---------- 渲染主区 ----------
  function renderMain() {
    const main = document.getElementById('mainContent');
    const ch = BOOK.chapters?.[state.currentChapter];
    const sec = ch?.sections?.[state.currentSection];

    if (!sec) {
      main.innerHTML = \`<div class="empty-state"><div class="icon">📖</div><h3>暂无内容</h3><p>请检查 PDF 是否解析成功</p></div>\`;
      return;
    }

    const breadcrumb = \`\${escapeHtml(ch.title)} / \${escapeHtml(sec.title)}\`;
    const totalEx = (sec.exercises || []).length;
    const doneEx = (sec.exercises || []).filter((_, ei) => state.answers[\`\${state.currentChapter}-\${state.currentSection}-\${ei}\`]?.judged).length;
    const progress = totalEx > 0 ? Math.round(doneEx / totalEx * 100) : 0;

    let html = \`
      <div class="breadcrumb">\${breadcrumb}</div>
      <h1 class="section-title">\${escapeHtml(sec.title)}</h1>
      <div class="section-meta">\${totalEx > 0 ? \`\${totalEx} 道题 · 已完成 \${doneEx}\` : '本章暂无题目'}</div>
      <div class="progress-bar"><div class="progress-fill" style="width:\${progress}%"></div></div>
    \`;

    if (!sec.exercises || sec.exercises.length === 0) {
      // 无题目：仅显示空状态，不展示原文
      html += \`
        <div class="empty-state">
          <div class="icon">✨</div>
          <h3>本章暂无题目</h3>
          <p>本节内容较短，未生成练习题</p>
        </div>
      \`;
    } else {
      sec.exercises.forEach((ex, ei) => {
        html += renderExercise(ex, ei);
      });
    }

    main.innerHTML = html;

    // 绑定题目事件
    if (sec.exercises) {
      sec.exercises.forEach((ex, ei) => bindExercise(ex, ei));
    }

    updateGlobalStats();
  }

  function renderExercise(ex, ei) {
    const typeMap = {
      single_choice: '单选', multi_choice: '多选',
      judge: '判断', fill: '填空',
    };
    const typeLabel = typeMap[ex.type] || '题目';
    let optionsHtml = '';

    if (ex.type === 'fill') {
      optionsHtml = \`<input class="fill-input" data-ex="\${ei}" type="text" placeholder="请输入答案" style="width:100%;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font-size:14px;margin-top:8px">\`;
    } else if (ex.options) {
      optionsHtml = '<ul class="options">';
      ex.options.forEach((opt, oi) => {
        const labels = ['A','B','C','D','E','F'];
        optionsHtml += \`
          <li class="option" data-ex="\${ei}" data-opt="\${oi}">
            <span class="option-label">\${labels[oi]}</span>
            <span class="option-text">\${escapeHtml(opt)}</span>
          </li>
        \`;
      });
      optionsHtml += '</ul>';
    }

    return \`
      <div class="exercise-card" id="ex-\${ei}">
        <div class="exercise-head">
          <span class="exercise-num">\${ei+1}</span>
          <span class="exercise-type">\${typeLabel}</span>
          <div class="exercise-question">\${escapeHtml(ex.question)}</div>
        </div>
        \${optionsHtml}
        <div class="exercise-actions">
          <button class="btn btn-primary" data-action="submit" data-ex="\${ei}">提交</button>
          <button class="btn" data-action="reset" data-ex="\${ei}">重置</button>
        </div>
        <div class="explanation" id="exp-\${ei}">
          <div class="explanation-label">解析</div>
          <div id="exp-text-\${ei}"></div>
        </div>
      </div>
    \`;
  }

  function bindExercise(ex, ei) {
    const card = document.getElementById(\`ex-\${ei}\`);
    if (!card) return;
    const key = \`\${state.currentChapter}-\${state.currentSection}-\${ei}\`;
    const existing = state.answers[key];

    // 选项点击
    card.querySelectorAll('.option').forEach(opt => {
      opt.addEventListener('click', () => {
        if (state.answers[key]?.judged) return;
        if (ex.type === 'multi_choice') {
          opt.classList.toggle('selected');
        } else {
          card.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');
        }
      });
    });

    // 提交/重置
    card.querySelector('[data-action="submit"]').addEventListener('click', () => judgeExercise(ex, ei));
    card.querySelector('[data-action="reset"]').addEventListener('click', () => resetExercise(ex, ei));

    // 恢复已有状态
    if (existing) {
      if (ex.type === 'fill') {
        const input = card.querySelector('.fill-input');
        if (input) input.value = existing.selected || '';
      } else {
        (existing.selected || []).forEach(oi => {
          const opt = card.querySelector(\`.option[data-opt="\${oi}"]\`);
          if (opt) opt.classList.add('selected');
        });
      }
      if (existing.judged) showResult(ex, ei, existing.selected, existing.correct);
    }
  }

  function judgeExercise(ex, ei) {
    const card = document.getElementById(\`ex-\${ei}\`);
    const key = \`\${state.currentChapter}-\${state.currentSection}-\${ei}\`;
    let selected;
    let correct = false;

    if (ex.type === 'fill') {
      const input = card.querySelector('.fill-input');
      selected = input?.value?.trim() || '';
      correct = selected.toLowerCase() === String(ex.answer).trim().toLowerCase();
    } else {
      const sel = Array.from(card.querySelectorAll('.option.selected')).map(o => parseInt(o.dataset.opt));
      selected = sel;
      const answerArr = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
      if (ex.type === 'multi_choice') {
        const setSel = new Set(sel);
        const setAns = new Set(answerArr);
        correct = sel.length === answerArr.length && [...setSel].every(x => setAns.has(x));
      } else {
        correct = sel.length === 1 && answerArr.includes(sel[0]);
      }
    }

    state.answers[key] = { selected, judged: true, correct };
    saveProgress();
    showResult(ex, ei, selected, correct);
    renderSidebar();
    updateGlobalStats();
  }

  function showResult(ex, ei, selected, correct) {
    const card = document.getElementById(\`ex-\${ei}\`);
    if (!card) return;

    if (ex.type !== 'fill' && ex.options) {
      const answerArr = Array.isArray(ex.answer) ? ex.answer : [ex.answer];
      card.querySelectorAll('.option').forEach(opt => {
        const oi = parseInt(opt.dataset.opt);
        opt.classList.remove('correct', 'wrong');
        if (answerArr.includes(oi)) opt.classList.add('correct');
        else if (opt.classList.contains('selected') && !correct) opt.classList.add('wrong');
      });
    }

    const exp = card.querySelector(\`#exp-\${ei}\`);
    const expText = card.querySelector(\`#exp-text-\${ei}\`);
    const result = correct ? '✓ 正确' : '✗ 错误';
    expText.innerHTML = \`<strong>\${result}</strong><br>\${escapeHtml(ex.explanation || '（暂无解析）')}\`;
    exp.classList.add('show');
  }

  function resetExercise(ex, ei) {
    const card = document.getElementById(\`ex-\${ei}\`);
    const key = \`\${state.currentChapter}-\${state.currentSection}-\${ei}\`;
    card.querySelectorAll('.option').forEach(o => o.classList.remove('selected','correct','wrong'));
    const input = card.querySelector('.fill-input');
    if (input) input.value = '';
    card.querySelector(\`#exp-\${ei}\`).classList.remove('show');
    delete state.answers[key];
    saveProgress();
    renderSidebar();
    updateGlobalStats();
  }

  // ---------- 全局统计 ----------
  function updateGlobalStats() {
    let total = 0, done = 0, correct = 0;
    (BOOK.chapters || []).forEach((ch, ci) => {
      (ch.sections || []).forEach((sec, si) => {
        (sec.exercises || []).forEach((_, ei) => {
          total++;
          const a = state.answers[\`\${ci}-\${si}-\${ei}\`];
          if (a?.judged) { done++; if (a.correct) correct++; }
        });
      });
    });
    const progress = total > 0 ? Math.round(done / total * 100) : 0;
    const acc = done > 0 ? Math.round(correct / done * 100) + '%' : '—';
    document.getElementById('progressText').textContent = progress + '%';
    document.getElementById('accuracyText').textContent = acc;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------- 启动 ----------
  renderSidebar();
  renderMain();
</script>
</body>
</html>`;

// 把 bookData 注入模板，返回完整 HTML 字符串。
// 注入 JSON 数据时转义 </ 防止破坏 <script> 标签（与 Python renderer 一致）。
// 注意：剥离每个 section 的 content 字段，避免把整本书原文注入 HTML（版权 + 体积）。
export function renderExerciseHtml(bookData) {
  const sanitized = {
    book_title: bookData.book_title,
    chapters: (bookData.chapters || []).map((ch) => ({
      title: ch.title,
      sections: (ch.sections || []).map((sec) => ({
        title: sec.title,
        exercises: sec.exercises || [],
      })),
    })),
  };
  const jsonStr = JSON.stringify(sanitized);
  const jsonEscaped = jsonStr.replace(/<\//g, "<\\/");
  return TEMPLATE.replace(/__BOOK_DATA__/g, jsonEscaped);
}
