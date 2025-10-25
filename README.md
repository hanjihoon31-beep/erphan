# ERP 시스템

매장 및 창고 관리를 위한 통합 ERP 시스템입니다.

## 주요 기능

### 1. 회원 관리
- 사번, 이메일, 비밀번호, 이름으로 회원가입
- 사번을 아이디로 사용하는 로그인 시스템
- 이메일 인증코드를 통한 비밀번호 찾기
- 최초 가입시 근무자로 등록, 관리자가 승인 후 활성화

### 2. 권한 관리
- **최고관리자**: 모든 시스템 접근 및 관리
- **관리자**: 제한적 관리 기능
- **근무자**: 기본 기능만 사용
- 최고관리자가 시스템별 접근권한 부여/제거 가능

### 3. 근무자 관리
- 근무자 현황 조회
- 근무시간, 휴게시간, 추가근무시간 기록
- 근무자별/기간별 통계

### 4. 매장/창고 관리
- 매장 12개, 창고 4개 기본 설정
- 매장/창고 추가, 수정, 삭제 기능
- 매장별 판매량 및 재고 관리

### 5. 재고 관리
- 식품, 비품 등 카테고리별 재고 관리
- 매장별/창고별 재고 현황
- 재고 입출고 관리
- 최소 재고량 설정 및 알림

### 6. 매출 관리
- 일별 매장별 매출 등록
- 온도(최고온도), 습도(11-20시 최고/평균) 기록
- 마감 매장 입장객수 기록
- 일/주/월 매출 통계 및 평균 계산
- 요일별 매출 분석

## 기술 스택

### Frontend
- React 19 + Vite
- React Router DOM
- Tailwind CSS
- Framer Motion
- Recharts (차트)
- Axios

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT 인증
- Bcrypt 암호화
- Nodemailer (이메일 발송)

## 설치 및 실행

### 1. 프로젝트 클론
```bash
git clone <repository-url>
cd erphan
```

### 2. 백엔드 설정 및 실행

```bash
cd server
npm install

# .env 파일 생성 (.env.example 참고)
cp .env.example .env

# 초기 데이터 생성
node scripts/initData.js

# 서버 실행
npm run dev
```

### 3. 프론트엔드 설정 및 실행

```bash
# 루트 디렉토리에서
npm install
npm run dev
```

## 초기 로그인 정보

초기 데이터 생성 후 다음 계정으로 로그인하세요:

- **사번**: ADMIN001
- **비밀번호**: admin1234

## 프로젝트 구조

```
erphan/
├── server/                 # 백엔드
│   ├── models/            # MongoDB 모델
│   ├── routes/            # API 라우터
│   ├── scripts/           # 유틸리티 스크립트
│   └── server.js          # 서버 진입점
├── src/                   # 프론트엔드
│   ├── components/        # React 컴포넌트
│   ├── pages/            # 페이지 컴포넌트
│   ├── context/          # Context API
│   └── App.jsx           # 앱 진입점
└── README.md             # 프로젝트 문서
```

## API 문서

자세한 API 엔드포인트는 [server/README.md](server/README.md)를 참고하세요.

## 라이선스

MIT
