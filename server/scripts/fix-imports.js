// server/scripts/fix-imports.js
import fs from "fs";
import path from "path";

const rootDir = path.resolve("./server");
const folders = ["routes", "models", "middleware"];

for (const folder of folders) {
  const dirPath = path.join(rootDir, folder);
  if (!fs.existsSync(dirPath)) continue;

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    let code = fs.readFileSync(filePath, "utf-8");

    // require → import
    code = code.replace(/const (.*?) = require\(["'](.*?)["']\);?/g, (match, name, modulePath) => {
      if (modulePath.startsWith(".")) {
        // 로컬 모듈에는 .js 확장자 추가
        if (!modulePath.endsWith(".js")) modulePath += ".js";
      }
      return `import ${name} from "${modulePath}";`;
    });

    // module.exports → export default
    code = code.replace(/module\.exports\s*=\s*(\w+);?/g, "export default $1;");

    // CommonJS에서 import 구문 누락 시 자동 삽입 (보조)
    if (!code.includes("export default") && !code.includes("export ")) {
      const routerMatch = code.match(/const router\s*=\s*express\.Router\(\)/);
      if (routerMatch) {
        code += `\n\nexport default router;`;
      }
    }

    fs.writeFileSync(filePath, code, "utf-8");
    console.log(`✅ Updated ${filePath}`);
  }
}

console.log("✨ 모든 파일이 ESM 형식으로 변환되었습니다!");
