// codexAutoApply.js
import fs from "fs";
import path from "path";

function ensureDir(p) { fs.mkdirSync(path.dirname(p), { recursive: true }); }

export function readFileSafe(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf-8") : "";
}

export function writeFileSafe(p, content) {
  ensureDir(p);
  fs.writeFileSync(p, content, "utf-8");
  console.log("✏️  파일 저장:", p);
}

export function replaceInFile(p, replacer) {
  const prev = readFileSafe(p);
  const next = replacer(prev);
  if (next !== prev) writeFileSafe(p, next);
}

export function insertAfterPattern(p, pattern, insertion) {
  replaceInFile(p, (t) => {
    if (t.includes(insertion.trim())) return t; // 중복 방지
    const idx = t.search(pattern);
    if (idx === -1) return t + "\n" + insertion + "\n";
    const m = t.match(pattern);
    const pos = idx + (m?.[0]?.length ?? 0);
    return t.slice(0, pos) + "\n" + insertion + "\n" + t.slice(pos);
  });
}

// 로그인 버튼 크기 조정 (Tailwind/인라인 둘 다 시도)
export function shrinkLoginButton(filePath, widthPx = 80, heightPx = 36) {
  replaceInFile(filePath, (t) => {
    let out = t;

    // 1) Tailwind class 수정 (w-*, h-*)
    out = out
      .replace(/className\s*=\s*["']([^"']*?)\bw-\d+\b([^"']*)["']/g, (_m, a, b) => `className="${a} w-20 ${b}"`)
      .replace(/className\s*=\s*["']([^"']*?)\bh-\d+\b([^"']*)["']/g, (_m, a, b) => `className="${a} h-9 ${b}"`);

    // 2) 인라인 스타일 수정
    out = out.replace(
      /<button([^>]*?)style=\{([^}]+)\}([^>]*)>/g,
      (m, a, styleObj, c) => {
        let s = styleObj;
        s = s.replace(/width\s*:\s*['"]?\d+px['"]?/i, `width: '${widthPx}px'`);
        s = s.replace(/height\s*:\s*['"]?\d+px['"]?/i, `height: '${heightPx}px'`);
        if (!/width\s*:/.test(s)) s = `{ width: '${widthPx}px', ${s.replace(/^\{|\}$/g, "")} }`;
        return `<button${a}style=${s}${c}>`;
      }
    );

    // 3) 버튼에 기본 클래스가 없다면 적당한 크기 부여
    out = out.replace(/<button([^>]*?)>(\s*로그인\s*|[^<]*login[^<]*)<\/button>/gi, (m, a, inner) => {
      if (/className=/.test(a)) return m;
      return `<button className="px-3 py-2 text-sm w-20 h-9" ${a}>${inner}</button>`;
    });

    return out;
  });
}

// 라우터에 페이지 등록 (react-router-dom v6+ 기준)
export function ensureRoute(filePath, routePath, importName, importFrom) {
  replaceInFile(filePath, (t) => {
    let out = t;

    // import 추가
    if (!new RegExp(`\\b${importName}\\b`).test(out)) {
      out = out.replace(
        /import[^;]+;\s*$/m,
        (m) => `${m}\nimport ${importName} from "${importFrom}";`
      );
      if (!/import/.test(out)) out = `import ${importName} from "${importFrom}";\n` + out;
    }

    // <Route> 추가 (v6/7 유사)
    if (/<Routes>/.test(out)) {
      if (!new RegExp(`<Route\\s+path=["']${routePath}["']`).test(out)) {
        out = out.replace(
          /<Routes>([\s\S]*?)<\/Routes>/,
          (m, inner) => `<Routes>${inner}\n  <Route path="${routePath}" element={<${importName} />} />\n</Routes>`
        );
      }
    } else {
      // 간단 라우팅 패턴 없는 경우 하단에 부착
      if (!out.includes(`path="${routePath}"`)) {
        out += `\n{/* Codex: injected route */}\n// import { BrowserRouter, Routes, Route } from "react-router-dom";\n// <BrowserRouter><Routes><Route path="${routePath}" element={<${importName} />} /></Routes></BrowserRouter>\n`;
      }
    }
    return out;
  });
}

// 페이지 파일 생성 (없으면 템플릿 생성)
export function ensurePage(filePath, titleKo) {
  if (fs.existsSync(filePath)) return;
  const rel = path.relative(process.cwd(), filePath);
  const jsx = filePath.endsWith(".tsx") || filePath.endsWith(".jsx");
  const compName = path.basename(filePath).replace(/\.(t|j)sx?$/i, "").replace(/[^A-Za-z0-9]/g, "_");
  const code = jsx
    ? `export default function ${compName}(){return (<div className="p-6"><h1 className="text-xl font-bold">${titleKo}</h1></div>);}`
    : `export default function ${compName}(){return null}`;
  writeFileSafe(filePath, code + "\n");
}
