// server/seedTestAccounts.js
// 테스트 계정을 데이터베이스에 생성하는 스크립트

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

const testAccounts = [
  {
    employeeId: "1",
    password: "1",
    name: "최고관리자",
    email: "superadmin@test.com",
    role: "superadmin",
    isApproved: true,
    isActive: true
  },
  {
    employeeId: "2",
    password: "2",
    name: "관리자",
    email: "admin@test.com",
    role: "admin",
    isApproved: true,
    isActive: true
  },
  {
    employeeId: "3",
    password: "3",
    name: "근무자",
    email: "employee@test.com",
    role: "employee",
    isApproved: true,
    isActive: true
  }
];

async function seedTestAccounts() {
  try {
    console.log("🔍 MongoDB 연결 시도 중...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB 연결 성공!");

    // 기존 테스트 계정 삭제
    console.log("\n🗑️  기존 테스트 계정 삭제 중...");
    const deletedCount = await User.deleteMany({
      employeeId: { $in: ["1", "2", "3"] }
    });
    console.log(`   삭제된 계정: ${deletedCount.deletedCount}개`);

    // 새 테스트 계정 생성
    console.log("\n📝 테스트 계정 생성 중...");

    for (const account of testAccounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);

      const user = new User({
        ...account,
        password: hashedPassword
      });

      await user.save();
      console.log(`   ✅ ${account.name} (ID: ${account.employeeId}, 역할: ${account.role}) 생성 완료`);
    }

    console.log("\n🎉 테스트 계정 생성 완료!");
    console.log("\n📋 로그인 정보:");
    console.log("=" .repeat(50));
    testAccounts.forEach(acc => {
      console.log(`${acc.name.padEnd(10)} | ID: ${acc.employeeId} | PW: ${acc.password} | 역할: ${acc.role}`);
    });
    console.log("=" .repeat(50));

  } catch (error) {
    console.error("❌ 오류 발생:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 MongoDB 연결 종료");
    process.exit(0);
  }
}

seedTestAccounts();
