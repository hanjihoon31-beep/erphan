// server/scripts/fix-imports.js
import fs from "fs";
import path from "path";

const ROUTES_DIR = path.join(process.cwd(), "server", "routes");
const BACKUP_DIR = path.join(ROUTES_DIR, "_backup_" + Date.now());

// 백업 폴더 생성
fs.mkdirSync(BACKUP_DIR, { recursive: true });

console.log("📦 백업 폴더 생성 완료:", BACKUP_DIR);

// 모든 JS 파일 순회
const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".js"));

for (const file of files) {
  const filePath = path.join(ROUTES_DIR, file);
  const backupPath = path.join(BACKUP_DIR, file);

  // 백업
  fs.copyFileSync(filePath, backupPath);

  let content = fs.readFileSync(filePath, "utf8");

  // require() → import 변환
  content = content.replace(
    /const\s*{\s*([\w,\s]+)\s*}\s*=\s*require\(["'](.+?)["']\);?/g,
    (m, vars, mod) => `import { ${vars.trim()} } from "${mod}.js";`
  );

  // require('something') → import something from "something.js"
  content = content.replace(
    /const\s+(\w+)\s*=\s*require\(["'](.+?)["']\);?/g,
    (m, name, mod) => `import ${name} from "${mod}.js";`
  );

  // models, routes, middleware 등 상대경로 import에 .js 확장자 자동 추가
  content = content.replace(
    /from\s+["'](\.\.\/(?:models|routes|middleware|utils)\/[A-Za-z0-9_-]+)(["'])/g,
    'from "$1.js"$2'
  );

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`✅ 변환 완료: ${file}`);
}

console.log("\n✨ 모든 라우터 파일의 import 경로가 수정되었습니다!");
console.log("🗂  백업 경로:", BACKUP_DIR);
