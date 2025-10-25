// server/middleware/validation.js

// 이메일 형식 검증
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 입력값 sanitize (NoSQL Injection 방지)
const sanitizeInput = (input) => {
  if (typeof input === "string") {
    return input.replace(/[<>]/g, "");
  }
  if (typeof input === "object" && input !== null) {
    // MongoDB operator injection 방지 ($gt, $lt 등)
    const sanitized = {};
    for (const key in input) {
      if (!key.startsWith("$")) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }
    return sanitized;
  }
  return input;
};

// 회원가입 입력 검증
const validateRegistration = (req, res, next) => {
  const { name, email, password, role } = req.body;

  // 필수 필드 체크
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "이름, 이메일, 비밀번호는 필수 입력 항목입니다."
    });
  }

  // 이름 길이 체크
  if (name.length < 2 || name.length > 50) {
    return res.status(400).json({
      message: "이름은 2자 이상 50자 이하여야 합니다."
    });
  }

  // 이메일 형식 체크
  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "올바른 이메일 형식이 아닙니다."
    });
  }

  // 비밀번호 강도 체크
  if (password.length < 6) {
    return res.status(400).json({
      message: "비밀번호는 최소 6자 이상이어야 합니다."
    });
  }

  // Role 검증 (허용된 role만 가능, 기본값은 employee)
  const allowedRoles = ["employee", "admin", "superadmin"];
  if (role && !allowedRoles.includes(role)) {
    return res.status(400).json({
      message: "유효하지 않은 역할입니다.",
      allowedRoles
    });
  }

  // 일반 사용자는 employee만 선택 가능 (관리자만 admin/superadmin 생성 가능)
  // 회원가입 시에는 무조건 employee로 설정
  req.body.role = "employee";

  // 입력값 sanitize
  req.body.name = sanitizeInput(name);
  req.body.email = sanitizeInput(email);

  next();
};

// 로그인 입력 검증
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "이메일과 비밀번호를 입력해주세요."
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "올바른 이메일 형식이 아닙니다."
    });
  }

  // 입력값 sanitize
  req.body.email = sanitizeInput(email);

  next();
};

// Role 업데이트 검증
const validateRoleUpdate = (req, res, next) => {
  const { role } = req.body;

  const allowedRoles = ["employee", "admin", "superadmin"];
  if (!role || !allowedRoles.includes(role)) {
    return res.status(400).json({
      message: "유효하지 않은 역할입니다.",
      allowedRoles
    });
  }

  next();
};

// MongoDB ObjectId 형식 검증
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;

  if (!objectIdRegex.test(id)) {
    return res.status(400).json({
      message: "유효하지 않은 ID 형식입니다."
    });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateRoleUpdate,
  validateObjectId,
  sanitizeInput
};
