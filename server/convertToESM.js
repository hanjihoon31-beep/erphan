// server/utils/convertToESM.js
import fs from "fs";
import path from "path";

const routesDir = path.resolve("./server/routes");

// ✅ 라우터 파일 목록
const files = fs.readdirSync(routesDir).filter(f => f.endsWith(".js"));

for (const file of files) {
  const fullPath = path.join(routesDir, file);
  let code = fs.readFileSync(fullPath, "utf-8");

  // ✅ require → import 변환
  code = code
    .replace(/const\s+(\w+)\s*=\s*require\(["']([^"']+)["']\);?/g, "import $1 from '$2';")
    .replace(/module\.exports\s*=\s*(\w+);?/g, "export default $1;");

  // ✅ express.Router()가 있다면 유지
  if (!code.includes("export default router")) {
    code += "\n\nexport default router;\n";
  }

  fs.writeFileSync(fullPath, code, "utf-8");
  console.log(`✅ 변환 완료: ${file}`);
}

console.log("\n🎉 모든 라우터가 ESM 형식으로 변환되었습니다!");
