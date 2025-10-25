# ERP 시스템 백엔드

## 설치 및 실행

### 1. 환경 설정

`.env` 파일을 생성하고 아래 내용을 입력하세요:

```env
MONGO_URI=mongodb://localhost:27017/erphan
JWT_SECRET=your_secret_key_here
PORT=3001
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
NODE_ENV=development
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 초기 데이터 생성

```bash
node scripts/initData.js
```

이 스크립트는 다음을 생성합니다:
- 최고관리자 계정 (사번: ADMIN001, 비밀번호: admin1234)
- 12개 매장
- 4개 창고

### 4. 서버 실행

개발 모드 (nodemon):
```bash
npm run dev
```

프로덕션 모드:
```bash
npm start
```

## API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/register` - 회원가입 (사번, 이름, 이메일, 비밀번호)
- `POST /api/auth/login` - 로그인 (사번, 비밀번호)
- `POST /api/auth/forgot-password` - 비밀번호 찾기 (인증코드 발송)
- `POST /api/auth/reset-password` - 비밀번호 재설정

### 관리자 (Admin)
- `GET /api/admin/users` - 모든 사용자 목록
- `GET /api/admin/pending` - 승인 대기 사용자 목록
- `PUT /api/admin/approve/:id` - 계정 승인
- `PUT /api/admin/reject/:id` - 계정 거절
- `PUT /api/admin/update-role/:id` - 권한 레벨 변경
- `PUT /api/admin/update-permissions/:id` - 시스템별 접근 권한 설정
- `GET /api/admin/users/:id` - 특정 사용자 정보 조회
- `DELETE /api/admin/users/:id` - 사용자 삭제

### 매장/창고 (Stores/Warehouses)
- `GET /api/stores` - 모든 매장 조회
- `GET /api/stores/active` - 활성화된 매장만 조회
- `POST /api/stores` - 매장 추가
- `PUT /api/stores/:id` - 매장 수정
- `DELETE /api/stores/:id` - 매장 삭제 (비활성화)
- `GET /api/warehouses` - 모든 창고 조회
- `GET /api/warehouses/active` - 활성화된 창고만 조회
- `POST /api/warehouses` - 창고 추가
- `PUT /api/warehouses/:id` - 창고 수정
- `DELETE /api/warehouses/:id` - 창고 삭제 (비활성화)

### 근무 관리 (Attendance)
- `POST /api/attendance` - 근무 기록 등록
- `GET /api/attendance` - 근무 기록 조회 (날짜 범위, 사번, 매장별)
- `GET /api/attendance/employee/:employeeId` - 특정 근무자 현황 조회
- `GET /api/attendance/summary` - 전체 근무자 현황 요약
- `PUT /api/attendance/:id` - 근무 기록 수정
- `DELETE /api/attendance/:id` - 근무 기록 삭제

### 매출 관리 (Sales)
- `POST /api/sales` - 매출 기록 등록
- `GET /api/sales` - 매출 조회 (날짜 범위, 매장별)
- `GET /api/sales/daily-total` - 일별 전체 매장 매출 합계
- `GET /api/sales/weekly-stats` - 주간 매출 통계
- `GET /api/sales/monthly-stats` - 월간 매출 통계
- `GET /api/sales/store-stats` - 매장별 매출 통계
- `PUT /api/sales/:id` - 매출 수정
- `DELETE /api/sales/:id` - 매출 삭제

### 재고 관리 (Inventory)
- `GET /api/inventory` - 재고 목록 조회
- `GET /api/inventory/summary` - 재고 현황 요약
- `POST /api/inventory` - 재고 추가
- `PUT /api/inventory/:id` - 재고 수정
- `PATCH /api/inventory/:id/adjust` - 재고 수량 조정 (입출고)
- `DELETE /api/inventory/:id` - 재고 삭제

## 데이터 모델

### User (사용자)
- employeeId: 사번 (아이디로 사용)
- name: 이름
- email: 이메일
- password: 비밀번호 (암호화)
- role: 권한 레벨 (superadmin, admin, employee)
- status: 계정 상태 (pending, active, rejected)
- permissions: 시스템별 접근 권한

### Store (매장)
- storeId: 매장 코드
- name: 매장명
- address: 주소
- phone: 전화번호
- manager: 매장 관리자
- isActive: 운영 상태

### Warehouse (창고)
- warehouseId: 창고 코드
- name: 창고명
- address: 주소
- phone: 전화번호
- manager: 창고 관리자
- isActive: 운영 상태

### Attendance (근무 기록)
- employeeId: 사번
- employeeName: 근무자명
- date: 근무일
- workStart: 출근시간
- workEnd: 퇴근시간
- breakTime: 휴게시간 (분)
- overtimeHours: 추가근무시간 (시간)
- totalWorkHours: 총 근무시간 (자동 계산)
- storeId: 근무 매장
- notes: 비고

### Sales (매출)
- date: 날짜
- storeId: 매장 코드
- storeName: 매장명
- dailySales: 일일 매출
- maxTemperature: 최고온도
- maxHumidity: 최고습도 (11-20시)
- avgHumidity: 평균습도 (11-20시)
- visitors: 입장객수
- isClosingStore: 마감 매장 여부
- dayOfWeek: 요일 (자동 계산)

### Inventory (재고)
- itemId: 품목 코드
- itemName: 품목명
- category: 카테고리 (food, supplies, equipment, other)
- unit: 단위
- storeId/warehouseId: 매장/창고 코드
- quantity: 재고량
- minQuantity: 최소 재고량
- unitPrice: 단가
- updatedBy: 업데이트한 사용자

## 권한 시스템

### 권한 레벨
- **superadmin**: 최고관리자 - 모든 권한
- **admin**: 관리자 - 일부 관리 기능
- **employee**: 근무자 - 기본 기능만

### 시스템별 접근 권한
최고관리자가 각 사용자에게 개별적으로 부여할 수 있는 권한:
- attendance: 근무관리 접근
- sales: 매출관리 접근
- inventory: 재고관리 접근
- store: 매장관리 접근
- user: 사용자관리 접근
