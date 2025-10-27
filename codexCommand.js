import fs from "fs";
import path from "path";
import { execSync } from "child_process";

function run(cmd) {
  console.log(`🟢 실행 중: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// ✳️ Codex 명령 처리
export function executeCodexCommand(commandText) {
  console.log(`🧠 Codex 명령 수신: "${commandText}"`);

  // 단순 패턴 인식 기반 파일명 감지
  const fileMatch = commandText.match(/(src|server|client|models|routes)\/[^\s]+\.js/);
  const filePath = fileMatch ? path.join("./", fileMatch[0]) : null;

  if (!filePath || !fs.existsSync(filePath)) {
    console.error("❌ 파일을 찾을 수 없습니다:", filePath);
    return;
  }

  // 단순 수정 예시: “console.log(”가 포함된 명령어면 추가
  if (commandText.includes("로그") || commandText.includes("console")) {
    let content = fs.readFileSync(filePath, "utf-8");
    content += `\nconsole.log("🧩 Codex 자동 로그: ${new Date().toISOString()}");\n`;
    fs.writeFileSync(filePath, content);
    console.log("✅ 로그 코드 자동 추가 완료!");
  }

  // GitHub 반영
  run("npm run push");
}
