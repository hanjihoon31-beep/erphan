// server/utils/convertToESM.js
import fs from "fs";
import path from "path";

const routesDir = path.resolve("./server/routes");

if (!fs.existsSync(routesDir)) {
  console.error("❌ routes 폴더를 찾을 수 없습니다:", routesDir);
  process.exit(1);
}

const files = fs.readdirSync(routesDir).filter(f => f.endsWith(".js"));

for (const file of files) {
  const fullPath = path.join(routesDir, file);
  let code = fs.readFileSync(fullPath, "utf-8");

  code = code
    .replace(/const\s+(\w+)\s*=\s*require\(["']([^"']+)["']\);?/g, "import $1 from '$2';")
    .replace(/module\.exports\s*=\s*(\w+);?/g, "export default $1;");

  if (!code.includes("export default router")) {
    code += "\n\nexport default router;\n";
  }

  fs.writeFileSync(fullPath, code, "utf-8");
  console.log(`✅ 변환 완료: ${file}`);
}

console.log("\n🎉 모든 라우터가 ESM 형식으로 변환되었습니다!");
