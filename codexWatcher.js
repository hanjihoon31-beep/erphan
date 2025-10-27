// codexWatcher.js
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { executeCodexCommand } from "./codexCommand.js";

const watchDir = path.resolve("./");

function run(cmd) {
  console.log(`🟢 실행 중: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

function logChange(type, filePath) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] ${type.toUpperCase()} 감지: ${filePath}`);

  // .env는 무시 (보안)
  if (filePath.includes(".env")) {
    console.log("⚠️ .env 관련 변경은 무시되었습니다.");
    return;
  }

  // ChatGPT 명령으로 전달
  const commandText = `${filePath} ${type}됨`;
  executeCodexCommand(commandText);
}

// 전체 프로젝트 감시
fs.watch(
  watchDir,
  { recursive: true },
  (eventType, filename) => {
    if (!filename) return;
    const filePath = path.join(watchDir, filename);
    if (!fs.existsSync(filePath)) return;

    if (eventType === "change") logChange("수정", filePath);
    else if (eventType === "rename") logChange("생성/이동", filePath);
  }
);

console.log("👀 Codex Watcher 실행 중... (VSCode 파일 변경 자동 반영)");
