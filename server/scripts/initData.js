// server/scripts/initData.js
// 초기 데이터 생성 스크립트
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const User = require("../models/User");
const Store = require("../models/Store");
const Warehouse = require("../models/Warehouse");

dotenv.config();

async function initializeData() {
  try {
    // MongoDB 연결
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // 기존 데이터 삭제 (선택사항 - 주석 처리됨)
    // await User.deleteMany({});
    // await Store.deleteMany({});
    // await Warehouse.deleteMany({});
    // console.log("✅ Existing data cleared");

    // 1. 최고관리자 계정 생성
    const adminExists = await User.findOne({ employeeId: "ADMIN001" });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin1234", 10);
      await User.create({
        employeeId: "ADMIN001",
        name: "최고관리자",
        email: "admin@example.com",
        password: hashedPassword,
        role: "superadmin",
        status: "active",
        permissions: {
          attendance: true,
          sales: true,
          inventory: true,
          store: true,
          user: true,
        },
      });
      console.log("✅ 최고관리자 계정 생성 완료 (사번: ADMIN001, 비밀번호: admin1234)");
    } else {
      console.log("⚠️ 최고관리자 계정이 이미 존재합니다.");
    }

    // 2. 매장 생성 (12개)
    const storeCount = await Store.countDocuments();
    if (storeCount === 0) {
      const stores = [
        { storeId: "S001", name: "강남점", address: "서울 강남구", phone: "02-1111-1111", manager: "김매니저" },
        { storeId: "S002", name: "홍대점", address: "서울 마포구", phone: "02-2222-2222", manager: "이매니저" },
        { storeId: "S003", name: "명동점", address: "서울 중구", phone: "02-3333-3333", manager: "박매니저" },
        { storeId: "S004", name: "신촌점", address: "서울 서대문구", phone: "02-4444-4444", manager: "최매니저" },
        { storeId: "S005", name: "잠실점", address: "서울 송파구", phone: "02-5555-5555", manager: "정매니저" },
        { storeId: "S006", name: "강북점", address: "서울 강북구", phone: "02-6666-6666", manager: "윤매니저" },
        { storeId: "S007", name: "부산점", address: "부산 해운대구", phone: "051-7777-7777", manager: "한매니저" },
        { storeId: "S008", name: "대전점", address: "대전 서구", phone: "042-8888-8888", manager: "조매니저" },
        { storeId: "S009", name: "대구점", address: "대구 중구", phone: "053-9999-9999", manager: "오매니저" },
        { storeId: "S010", name: "광주점", address: "광주 서구", phone: "062-1010-1010", manager: "서매니저" },
        { storeId: "S011", name: "인천점", address: "인천 남동구", phone: "032-1111-1111", manager: "강매니저" },
        { storeId: "S012", name: "수원점", address: "경기 수원시", phone: "031-1212-1212", manager: "임매니저" },
      ];
      await Store.insertMany(stores);
      console.log("✅ 12개 매장 생성 완료");
    } else {
      console.log("⚠️ 매장 데이터가 이미 존재합니다.");
    }

    // 3. 창고 생성 (4개)
    const warehouseCount = await Warehouse.countDocuments();
    if (warehouseCount === 0) {
      const warehouses = [
        { warehouseId: "W001", name: "서울 중앙창고", address: "서울 구로구", phone: "02-8888-0001", manager: "창고관리자1" },
        { warehouseId: "W002", name: "경기 물류창고", address: "경기 이천시", phone: "031-8888-0002", manager: "창고관리자2" },
        { warehouseId: "W003", name: "부산 물류창고", address: "부산 강서구", phone: "051-8888-0003", manager: "창고관리자3" },
        { warehouseId: "W004", name: "대전 물류창고", address: "대전 대덕구", phone: "042-8888-0004", manager: "창고관리자4" },
      ];
      await Warehouse.insertMany(warehouses);
      console.log("✅ 4개 창고 생성 완료");
    } else {
      console.log("⚠️ 창고 데이터가 이미 존재합니다.");
    }

    console.log("\n✅ 초기 데이터 생성이 완료되었습니다!");
    console.log("\n📝 로그인 정보:");
    console.log("   사번: ADMIN001");
    console.log("   비밀번호: admin1234\n");

    mongoose.connection.close();
  } catch (error) {
    console.error("❌ 초기 데이터 생성 중 오류:", error);
    mongoose.connection.close();
    process.exit(1);
  }
}

initializeData();
