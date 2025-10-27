import { execSync } from "child_process";
import fs from "fs";

function run(cmd) {
  console.log(`▶ 실행: ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
}

// ✅ 예시 1: 파일 수정 (server.js 내 URI 변경)
const serverPath = "./server/server.js";
if (fs.existsSync(serverPath)) {
  let content = fs.readFileSync(serverPath, "utf-8");
  content = content.replace(
    /mongodb:\/\/localhost:\d+\/\w+/,
    "mongodb://localhost:27017/erphan_db"
  );
  fs.writeFileSync(serverPath, content);
  console.log("✅ server.js MongoDB URI 수정 완료");
}

// ✅ 예시 2: 불필요한 파일 삭제
const oldFile = "./server/routes/tempRouter.js";
if (fs.existsSync(oldFile)) {
  fs.unlinkSync(oldFile);
  console.log("🗑️ tempRouter.js 삭제 완료");
}

// ✅ GitHub에 자동 푸시
run("node autoPush.js");
// 수정 감지됨: C:\Users\thsut\erphan\src\pages\Erphan.css (2025-10-27T04:19:39.388Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:20:52.164Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:21:18.365Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:30:26.727Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:30:31.891Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:30:37.044Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:30:42.188Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:30:47.332Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:30:52.467Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:30:57.607Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:02.746Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:07.894Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:13.029Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:18.183Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:23.322Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:28.462Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:33.611Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:38.754Z)
// 수정 감지됨: C:\Users\thsut\erphan\.git\refs\remotes (2025-10-27T04:31:43.898Z)
