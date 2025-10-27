import { execSync } from "child_process";
import dotenv from "dotenv";

dotenv.config();

const repoURL = `https://${process.env.GITHUB_TOKEN}@github.com/hanjihoon31-beep/erphan.git`;

function run(cmd) {
  console.log(`🟢 실행 중: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

try {
  // 1️⃣ Git 초기화
  run("git init");

  // 2️⃣ Git 원격 저장소 연결
  run("git remote remove origin || true");
  run(`git remote add origin ${repoURL}`);

  // 3️⃣ 파일 추가 및 커밋
  run("git add .");
  const date = new Date().toISOString();
  run(`git commit -m "자동 업로드: ${date}"`);

  // 4️⃣ 브랜치 설정 및 푸시
  run("git branch -M main");
  run("git push -u origin main --force");

  console.log("✅ GitHub 업로드 완료!");
} catch (err) {
  console.error("❌ 오류 발생:", err.message);
}
