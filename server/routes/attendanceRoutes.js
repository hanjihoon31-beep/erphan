// server/routes/attendanceRoutes.js
const express = require("express");
const Attendance = require("../models/Attendance");
const User = require("../models/User");

const router = express.Router();

// ✅ 근무 기록 등록
router.post("/", async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      date,
      workStart,
      workEnd,
      breakTime,
      overtimeHours,
      storeId,
      notes,
    } = req.body;

    if (!employeeId || !employeeName || !date) {
      return res.status(400).json({ message: "필수 정보를 입력해주세요." });
    }

    // 총 근무시간 계산
    let totalWorkHours = 0;
    if (workStart && workEnd) {
      const [startHour, startMin] = workStart.split(":").map(Number);
      const [endHour, endMin] = workEnd.split(":").map(Number);
      const workMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      totalWorkHours = (workMinutes - (breakTime || 0)) / 60;
    }

    const attendance = await Attendance.create({
      employeeId,
      employeeName,
      date,
      workStart,
      workEnd,
      breakTime: breakTime || 0,
      overtimeHours: overtimeHours || 0,
      totalWorkHours,
      storeId,
      notes,
    });

    res.status(201).json({ message: "근무 기록이 등록되었습니다.", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "근무 기록 등록 중 오류 발생" });
  }
});

// ✅ 근무 기록 조회 (날짜 범위)
router.get("/", async (req, res) => {
  try {
    const { startDate, endDate, employeeId, storeId } = req.query;

    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (employeeId) {
      query.employeeId = employeeId;
    }

    if (storeId) {
      query.storeId = storeId;
    }

    const attendances = await Attendance.find(query).sort({ date: -1 });
    res.json(attendances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "근무 기록 조회 중 오류 발생" });
  }
});

// ✅ 특정 근무자의 근무 현황 조회
router.get("/employee/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { month } = req.query; // YYYY-MM 형식

    let query = { employeeId };

    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await Attendance.find(query).sort({ date: -1 });

    // 통계 계산
    const totalDays = attendances.length;
    const totalHours = attendances.reduce((sum, a) => sum + (a.totalWorkHours || 0), 0);
    const totalOvertime = attendances.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);

    res.json({
      attendances,
      statistics: {
        totalDays,
        totalHours: totalHours.toFixed(2),
        totalOvertime: totalOvertime.toFixed(2),
        avgHoursPerDay: totalDays > 0 ? (totalHours / totalDays).toFixed(2) : 0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "근무 현황 조회 중 오류 발생" });
  }
});

// ✅ 근무 기록 수정
router.put("/:id", async (req, res) => {
  try {
    const {
      workStart,
      workEnd,
      breakTime,
      overtimeHours,
      storeId,
      notes,
    } = req.body;

    // 총 근무시간 재계산
    let totalWorkHours = 0;
    if (workStart && workEnd) {
      const [startHour, startMin] = workStart.split(":").map(Number);
      const [endHour, endMin] = workEnd.split(":").map(Number);
      const workMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      totalWorkHours = (workMinutes - (breakTime || 0)) / 60;
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        workStart,
        workEnd,
        breakTime,
        overtimeHours,
        totalWorkHours,
        storeId,
        notes,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!attendance) {
      return res.status(404).json({ message: "근무 기록을 찾을 수 없습니다." });
    }

    res.json({ message: "근무 기록이 수정되었습니다.", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "근무 기록 수정 중 오류 발생" });
  }
});

// ✅ 근무 기록 삭제
router.delete("/:id", async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);

    if (!attendance) {
      return res.status(404).json({ message: "근무 기록을 찾을 수 없습니다." });
    }

    res.json({ message: "근무 기록이 삭제되었습니다." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "근무 기록 삭제 중 오류 발생" });
  }
});

// ✅ 전체 근무자 현황 조회
router.get("/summary", async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM 형식

    let query = {};
    if (month) {
      const [year, monthNum] = month.split("-");
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      query.date = { $gte: startDate, $lte: endDate };
    }

    const attendances = await Attendance.find(query);

    // 근무자별 집계
    const employeeStats = {};
    attendances.forEach((att) => {
      if (!employeeStats[att.employeeId]) {
        employeeStats[att.employeeId] = {
          employeeId: att.employeeId,
          employeeName: att.employeeName,
          totalDays: 0,
          totalHours: 0,
          totalOvertime: 0,
        };
      }
      employeeStats[att.employeeId].totalDays++;
      employeeStats[att.employeeId].totalHours += att.totalWorkHours || 0;
      employeeStats[att.employeeId].totalOvertime += att.overtimeHours || 0;
    });

    const summary = Object.values(employeeStats).map((stat) => ({
      ...stat,
      totalHours: stat.totalHours.toFixed(2),
      totalOvertime: stat.totalOvertime.toFixed(2),
      avgHoursPerDay: stat.totalDays > 0 ? (stat.totalHours / stat.totalDays).toFixed(2) : 0,
    }));

    res.json(summary);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "근무자 현황 조회 중 오류 발생" });
  }
});

module.exports = router;
