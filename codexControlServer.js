// codexControlServer.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { exec } from "child_process";

const app = express();
const PORT = 5051;

// ✅ JSON 요청을 파싱할 수 있게 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ POST 요청 수신
app.post("/command", (req, res) => {
  console.log("📩 요청 수신:", req.body);

  const { command } = req.body;
  if (!command || command.trim() === "") {
    console.log("⚠️ 명령이 비어 있습니다.");
    return res.status(400).json({ success: false, error: "명령이 비어 있음" });
  }

  console.log(`🧠 Codex 명령 수신: ${command}`);

  // 실제 실행
  exec(`node codexCommand.js "${command}"`, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ 명령 실행 오류:", stderr);
      return res.status(500).json({ success: false, error: stderr });
    }

    console.log("✅ 명령 실행 완료:", stdout);
    res.json({ success: true, message: stdout });
  });
});

// ✅ 서버 실행
app.listen(PORT, () => {
  console.log(`🚀 Codex Control Server 실행 중 (http://localhost:${PORT})`);
});
