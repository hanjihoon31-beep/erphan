// codexAutoPush.js
import { execSync } from "child_process";

function run(cmd) {
  console.log(`🟢 실행 중: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  console.log("🚀 Codex 자동 커밋 및 푸시 실행 시작...");

  // 변경된 파일 추가
  run("git add .");

  // 자동 커밋 메시지
  const timestamp = new Date().toISOString();
  run(`git commit -m "🤖 자동 업데이트 by Codex: ${timestamp}" || echo '⚠️ 커밋할 변경 없음'`);

  // GitHub 푸시
  run("git push origin main");
  console.log("✅ GitHub 자동 업로드 완료!");
} catch (err) {
  console.error("❌ 자동 푸시 중 오류:", err.message);
}
