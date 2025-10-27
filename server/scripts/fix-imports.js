// server/scripts/fix-imports.js
import fs from "fs";
import path from "path";

const ROUTES_DIR = path.join(process.cwd(), "server", "routes");
const BACKUP_DIR = path.join(ROUTES_DIR, "_backup_" + Date.now());

// ✅ 백업 폴더 생성
fs.mkdirSync(BACKUP_DIR, { recursive: true });
console.log("📦 백업 폴더 생성 완료:", BACKUP_DIR);

// ✅ 모든 .js 파일 찾기
const jsFiles = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".js"));

for (const file of jsFiles) {
  const filePath = path.join(ROUTES_DIR, file);
  const backupPath = path.join(BACKUP_DIR, file);

  // 원본 백업
  fs.copyFileSync(filePath, backupPath);

  let content = fs.readFileSync(filePath, "utf8");

  // --- 1. require() → import 변환 ---
  content = content.replace(
    /const\s*{\s*([\w,\s]+)\s*}\s*=\s*require\(["'](.+?)["']\);?/g,
    (m, vars, mod) => `import { ${vars.trim()} } from "${mod}.js";`
  );
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\(["'](.+?)["']\);?/g,
    (m, name, mod) => `import ${name} from "${mod}.js";`
  );

  // --- 2. ../models, ../middleware 등 상대경로에 .js 확장자 추가 ---
  content = content.replace(
    /from\s+["'](\.\.\/(?:models|routes|middleware|utils)\/[A-Za-z0-9_-]+)(["'])/g,
    'from "$1.js"$2'
  );

  // --- 3. 누락된 슬래시 복원 ("..models" → "../models") ---
  content = content.replace(
    /from\s+["']\.\.([^/])/g,
    'from "../$1'
  );

  // --- 4. 중복 따옴표/공백 정리 ---
  content = content.replace(/["']{2,}/g, '"');
  content = content.replace(/\s{2,}/g, " ");

  // 저장
  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ 수정 완료: ${file}`);
}

console.log("\n✨ 모든 라우터 파일의 import 경로가 교정되었습니다!");
console.log("🗂  백업 위치:", BACKUP_DIR);
