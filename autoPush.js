import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const repoURL = `https://${process.env.GITHUB_TOKEN}@github.com/hanjihoon31-beep/erphan.git`;

function run(cmd) {
  console.log(`🟢 실행 중: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  run("git init");
  run("git add .");

  const date = new Date().toISOString();
  run(`git commit -m "자동 업로드 by Codex: ${date}"`);

  run("git branch -M main");
  run("git remote remove origin || true");
  run(`git remote add origin ${repoURL}`);
  run("git push -u origin main --force");

  console.log("✅ GitHub 자동 업로드 완료!");
} catch (err) {
  console.error("❌ 오류 발생:", err.message);
}
