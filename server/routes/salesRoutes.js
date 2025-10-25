// server/routes/salesRoutes.js
const express = require("express");
const Sales = require("../models/Sales");
const Store = require("../models/Store");

const router = express.Router();

// ✅ 매출 기록 등록
router.post("/", async (req, res) => {
  try {
    const {
      date,
      storeId,
      storeName,
      dailySales,
      maxTemperature,
      maxHumidity,
      avgHumidity,
      visitors,
      isClosingStore,
      notes,
    } = req.body;

    if (!date || !storeId || !storeName || dailySales === undefined) {
      return res.status(400).json({ message: "필수 정보를 입력해주세요." });
    }

    // 요일 계산
    const dateObj = new Date(date);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = days[dateObj.getDay()];

    const sales = await Sales.create({
      date,
      storeId,
      storeName,
      dailySales,
      maxTemperature,
      maxHumidity,
      avgHumidity,
      visitors,
      isClosingStore: isClosingStore || false,
      dayOfWeek,
      notes,
    });

    res.status(201).json({ message: "매출이 등록되었습니다.", sales });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "해당 날짜에 이미 매출이 등록되어 있습니다." });
    }
    res.status(500).json({ message: "매출 등록 중 오류 발생" });
  }
});

// ✅ 매출 조회 (날짜 범위)
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (storeId) {
      query.storeId = storeId;
    }

    const sales = await Sales.find(query).sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매출 조회 중 오류 발생" });
  }
});

// ✅ 일별 전체 매장 매출 합계 조회
router.get("/daily-total", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "날짜를 입력해주세요." });
    }

    const dateObj = new Date(date);
    const nextDate = new Date(dateObj);
    nextDate.setDate(nextDate.getDate() + 1);

    const sales = await Sales.find({
      date: { $gte: dateObj, $lt: nextDate },
    });

    const totalSales = sales.reduce((sum, s) => sum + s.dailySales, 0);
    const avgTemperature = sales.length > 0
      ? sales.reduce((sum, s) => sum + (s.maxTemperature || 0), 0) / sales.length
      : 0;
    const avgMaxHumidity = sales.length > 0
      ? sales.reduce((sum, s) => sum + (s.maxHumidity || 0), 0) / sales.length
      : 0;
    const avgAvgHumidity = sales.length > 0
      ? sales.reduce((sum, s) => sum + (s.avgHumidity || 0), 0) / sales.length
      : 0;
    const totalVisitors = sales.reduce((sum, s) => sum + (s.visitors || 0), 0);

    const days = ["일", "월", "화", "수", "목", "금", "토"];
    const dayOfWeek = days[dateObj.getDay()];

    res.json({
      date,
      dayOfWeek,
      totalSales,
      avgTemperature: avgTemperature.toFixed(1),
      avgMaxHumidity: avgMaxHumidity.toFixed(1),
      avgAvgHumidity: avgAvgHumidity.toFixed(1),
      totalVisitors,
      storeCount: sales.length,
      stores: sales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "일별 매출 조회 중 오류 발생" });
  }
});

// ✅ 주간 매출 통계
router.get("/weekly-stats", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "시작일과 종료일을 입력해주세요." });
    }

    const sales = await Sales.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: 1 });

    // 날짜별로 그룹화
    const dailyTotals = {};
    sales.forEach((s) => {
      const dateStr = s.date.toISOString().split("T")[0];
      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = {
          date: dateStr,
          dayOfWeek: s.dayOfWeek,
          totalSales: 0,
          storeCount: 0,
        };
      }
      dailyTotals[dateStr].totalSales += s.dailySales;
      dailyTotals[dateStr].storeCount++;
    });

    const dailyData = Object.values(dailyTotals);
    const weeklyTotal = dailyData.reduce((sum, d) => sum + d.totalSales, 0);
    const weeklyAvg = dailyData.length > 0 ? weeklyTotal / dailyData.length : 0;

    res.json({
      dailyData,
      weeklyTotal,
      weeklyAvg: weeklyAvg.toFixed(0),
      daysCount: dailyData.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "주간 매출 통계 조회 중 오류 발생" });
  }
});

// ✅ 월간 매출 통계
router.get("/monthly-stats", async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM 형식

    if (!month) {
      return res.status(400).json({ message: "월을 입력해주세요. (YYYY-MM)" });
    }

    const [year, monthNum] = month.split("-");
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);

    const sales = await Sales.find({
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // 날짜별로 그룹화
    const dailyTotals = {};
    sales.forEach((s) => {
      const dateStr = s.date.toISOString().split("T")[0];
      if (!dailyTotals[dateStr]) {
        dailyTotals[dateStr] = {
          date: dateStr,
          dayOfWeek: s.dayOfWeek,
          totalSales: 0,
          storeCount: 0,
        };
      }
      dailyTotals[dateStr].totalSales += s.dailySales;
      dailyTotals[dateStr].storeCount++;
    });

    const dailyData = Object.values(dailyTotals);
    const monthlyTotal = dailyData.reduce((sum, d) => sum + d.totalSales, 0);
    const monthlyAvg = dailyData.length > 0 ? monthlyTotal / dailyData.length : 0;

    res.json({
      month,
      dailyData,
      monthlyTotal,
      monthlyAvg: monthlyAvg.toFixed(0),
      daysCount: dailyData.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "월간 매출 통계 조회 중 오류 발생" });
  }
});

// ✅ 매장별 매출 통계
router.get("/store-stats", async (req, res) => {
  try {
    const { startDate, endDate, storeId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "시작일과 종료일을 입력해주세요." });
    }

    let query = {
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (storeId) {
      query.storeId = storeId;
    }

    const sales = await Sales.find(query).sort({ date: 1 });

    // 매장별로 그룹화
    const storeStats = {};
    sales.forEach((s) => {
      if (!storeStats[s.storeId]) {
        storeStats[s.storeId] = {
          storeId: s.storeId,
          storeName: s.storeName,
          totalSales: 0,
          daysCount: 0,
          avgSales: 0,
        };
      }
      storeStats[s.storeId].totalSales += s.dailySales;
      storeStats[s.storeId].daysCount++;
    });

    const storeData = Object.values(storeStats).map((stat) => ({
      ...stat,
      avgSales: stat.daysCount > 0 ? (stat.totalSales / stat.daysCount).toFixed(0) : 0,
    }));

    res.json(storeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매장별 매출 통계 조회 중 오류 발생" });
  }
});

// ✅ 매출 수정
router.put("/:id", async (req, res) => {
  try {
    const {
      dailySales,
      maxTemperature,
      maxHumidity,
      avgHumidity,
      visitors,
      isClosingStore,
      notes,
    } = req.body;

    const sales = await Sales.findByIdAndUpdate(
      req.params.id,
      {
        dailySales,
        maxTemperature,
        maxHumidity,
        avgHumidity,
        visitors,
        isClosingStore,
        notes,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!sales) {
      return res.status(404).json({ message: "매출 기록을 찾을 수 없습니다." });
    }

    res.json({ message: "매출이 수정되었습니다.", sales });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매출 수정 중 오류 발생" });
  }
});

// ✅ 매출 삭제
router.delete("/:id", async (req, res) => {
  try {
    const sales = await Sales.findByIdAndDelete(req.params.id);

    if (!sales) {
      return res.status(404).json({ message: "매출 기록을 찾을 수 없습니다." });
    }

    res.json({ message: "매출이 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "매출 삭제 중 오류 발생" });
  }
});

module.exports = router;
