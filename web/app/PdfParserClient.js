"use client";

// 客户端 PDF 解析模块：隔离 pdfjs-dist，延迟初始化避免 SSR 报错。
// pdfjs-dist 在模块顶层会引用浏览器 API（DOMMatrix），所以：
// - 用 next/dynamic({ ssr: false }) 加载，确保只在浏览器执行
// - pdfjs 的 import 放在函数内部，首次调用时才加载

const CHAPTER_PATTERNS = [
  "^第[一二三四五六七八九十百零\\d]+[章节篇部分]",
  "^Chapter\\s+\\d+",
  "^\\d+\\.\\d+\\s",
  "^\\d+\\s+[A-Z]",
];
const CHAPTER_RE = new RegExp(CHAPTER_PATTERNS.map((p) => `(?:${p})`).join("|"));

function guessLevel(title) {
  if (/^第[一二三四五六七八九十百零\d]+[章篇]/.test(title)) return 1;
  if (/^第[一二三四五六七八九十百零\d]+[节部分]/.test(title)) return 2;
  if (/^\d+\.\d+\s/.test(title)) return 2;
  if (/^\d+\.\d+\.\d+/.test(title)) return 3;
  return 1;
}

async function extractPageText(pdf, pageNum) {
  const page = await pdf.getPage(pageNum);
  const content = await page.getTextContent();
  const lines = [];
  let current = "";
  let lastY = null;
  for (const item of content.items) {
    if (!item.str) continue;
    const y = item.transform ? item.transform[5] : null;
    if (lastY !== null && y !== null && Math.abs(y - lastY) > 2) {
      lines.push(current);
      current = "";
    }
    current += item.str;
    if (item.hasEOL) {
      lines.push(current);
      current = "";
      lastY = null;
      continue;
    }
    lastY = y;
  }
  if (current) lines.push(current);
  return lines.join("\n");
}

async function extractPagesText(pdf, start, end) {
  const parts = [];
  const last = Math.min(end, pdf.numPages - 1);
  for (let i = Math.max(0, start); i <= last; i++) {
    parts.push(await extractPageText(pdf, i + 1));
  }
  return parts.join("\n");
}

async function getOutlineWithPages(pdf) {
  let outline;
  try {
    outline = await pdf.getOutline();
  } catch (e) {
    return null;
  }
  if (!outline || !outline.length) return null;
  const result = [];
  async function walk(items, level) {
    for (const item of items) {
      let pageNum = 1;
      try {
        let dest = item.dest;
        if (typeof dest === "string") dest = await pdf.getDestination(dest);
        if (dest && dest[0] != null) {
          const pageIndex = await pdf.getPageIndex(dest[0]);
          pageNum = pageIndex + 1;
        }
      } catch (e) {}
      result.push({ level, title: (item.title || "").trim(), page: pageNum });
      if (item.items && item.items.length) await walk(item.items, level + 1);
    }
  }
  await walk(outline, 1);
  return result;
}

function findEndPage(toc, idx, totalPages) {
  const currentLevel = toc[idx].level;
  for (let j = idx + 1; j < toc.length; j++) {
    if (toc[j].level <= currentLevel) return toc[j].page - 1 - 1;
  }
  return totalPages - 1;
}

async function splitByToc(pdf, toc) {
  const sections = [];
  const totalPages = pdf.numPages;
  for (let i = 0; i < toc.length; i++) {
    const { level, title, page } = toc[i];
    const startPage = page - 1;
    const endPage = findEndPage(toc, i, totalPages);
    const content = await extractPagesText(pdf, startPage, endPage);
    sections.push({ title, level, content: content.trim(), page });
  }
  return sections;
}

async function splitByRegex(pdf) {
  const sections = [];
  let currentTitle = null;
  let currentLevel = 1;
  let currentPage = 1;
  let currentLines = [];
  function flush() {
    if (currentTitle !== null) {
      sections.push({
        title: currentTitle,
        level: currentLevel,
        content: currentLines.join("\n").trim(),
        page: currentPage,
      });
    }
  }
  for (let pageIdx = 0; pageIdx < pdf.numPages; pageIdx++) {
    const text = await extractPageText(pdf, pageIdx + 1);
    for (const line of text.split("\n")) {
      const stripped = line.trim();
      if (stripped && CHAPTER_RE.test(stripped)) {
        flush();
        currentTitle = stripped;
        currentLevel = guessLevel(stripped);
        currentPage = pageIdx + 1;
        currentLines = [];
      } else if (currentTitle !== null) {
        currentLines.push(line);
      }
    }
  }
  flush();
  return sections;
}

function deriveBookTitle(filename) {
  if (!filename) return "PDF文档";
  const base = String(filename).split(/[\\/]/).pop() || "PDF文档";
  return base.replace(/\.pdf$/i, "") || "PDF文档";
}

// 缓存已加载的 pdfjsLib，避免重复初始化
let _pdfjsLib = null;
async function loadPdfjs() {
  if (_pdfjsLib) return _pdfjsLib;
  const mod = await import("pdfjs-dist/build/pdf.mjs");
  _pdfjsLib = mod;
  const version = mod.version;
  mod.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  return mod;
}

// 对外导出：在浏览器端解析 PDF
export async function parsePdfInBrowser(file) {
  const pdfjsLib = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);
  const version = pdfjsLib.version;
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/cmaps/`,
    cMapPacked: true,
  });
  const pdf = await loadingTask.promise;
  const bookTitle = deriveBookTitle(file.name);
  const toc = await getOutlineWithPages(pdf);
  let sections;
  if (toc && toc.length) {
    sections = await splitByToc(pdf, toc);
  } else {
    sections = await splitByRegex(pdf);
  }
  try {
    await pdf.cleanup();
    await loadingTask.destroy();
  } catch (e) {}
  if (!sections.length) {
    sections = [{ title: bookTitle, level: 1, content: "", page: 1 }];
  }
  return { book_title: bookTitle, sections };
}
