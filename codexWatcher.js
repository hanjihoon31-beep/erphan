import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const watchDir = path.resolve("./");

function run(cmd) {
  console.log(`🟢 실행 중: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function logChange(type, filePath) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${type.toUpperCase()} 감지: ${filePath}`);

  // autoApply.js에 로그 업데이트
  const logPath = "./autoApply.js";
  const logContent = `// ${type} 감지됨: ${filePath} (${timestamp})\n`;
  fs.appendFileSync(logPath, logContent);

  // GitHub 자동 업로드
  run("npm run push");
}

// 프로젝트 전체 감시
fs.watch(
  watchDir,
  { recursive: true },
  (eventType, filename) => {
    if (!filename) return;
    if (filename.includes(".env")) return; // ✅ .env 파일 변경 무시

    const filePath = path.join(watchDir, filename);

    if (eventType === "change") logChange("수정", filePath);
    else if (eventType === "rename") {
      if (fs.existsSync(filePath)) logChange("생성", filePath);
      else logChange("삭제", filePath);
    }
  }
);

console.log("👀 Codex Watcher 실행 중... (파일 변경 시 자동 푸시됩니다)");
