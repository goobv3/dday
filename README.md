# 🚀 2026 빅데이터 분석기사 D-Day 대시보드 (Big Data Analyst D-Day Dashboard)

React(Vite)와 Node.js(Express) 기반으로 제작된 맞춤형 D-Day 및 학습 진도 관리 대시보드입니다. 사이버펑크 네온 스타일의 UI가 적용되어 몰입감 있는 학습 환경을 제공합니다.

## ✨ 주요 기능 (Features)

1. **멀티 프로젝트 관리**
   - 여러 개의 목표(프로젝트)를 생성하고 개별적으로 관리할 수 있습니다.
   - 프로젝트별 타이틀, D-Day, 체크리스트 데이터가 독립적으로 유지됩니다.

2. **D-Day 카운트다운**
   - 다가오는 시험일(필기, 실기 등)을 등록하고 남은 일수를 한눈에 확인할 수 있습니다.
   - 각 D-Day마다 개별적인 네온 컬러(Cyan, Pink, Green, Purple, Yellow) 지정이 가능합니다.

3. **동적 학습 체크리스트 (Checklist)**
   - 카테고리 분류 및 하위 항목(Sub-items) 추가를 지원합니다.
   - 목표 날짜(Target Date) 설정 및 토글 기능.
   - 편집 모드를 통한 직관적인 항목 추가, 수정 및 삭제.

4. **자동 저장 (Auto-save) 및 데이터 영속성**
   - 모든 수정 사항은 즉시 Node.js 백엔드 API를 통해 `server-data/data.json` 파일로 자동 저장됩니다. (새로고침을 해도 데이터가 유지됨)

5. **매일 바뀌는 동기 부여 명언 (Daily Quotes)**
   - 매일 접속할 때마다 변화하는 새로운 학습 동기 부여 명언(Quote)을 제공합니다.

6. **네온 다크 웹 디자인 (Neon Cyberpunk UI)**
   - 다크 모드 기반의 부드러운 애니메이션과 글래스모피즘(Glassmorphism) 네온 빛 효과.
   - 모바일 및 데스크탑 기기를 모두 지원하는 반응형(Responsive) 레이아웃.

## 🛠 기술 스택 (Tech Stack)

- **Frontend**: React 19, Vite, CSS3 (Vanilla Custom Properties & Neon Effects)
- **Backend**: Node.js, Express, File System (`fs`) 기반 JSON Storage
- **Deployment**: Docker, Docker Compose, Nginx

## 🚀 설치 및 실행 방법 (Getting Started)

### 1. 로컬 환경에서 실행 (개발용)

**백엔드 서버 실행 (포트: 3000)**
```bash
npm install # 최초 1회 (루트 디렉토리에서 실행)
node server.js
```

**프론트엔드 개발 서버 실행 (포트: 5173 등)**
```bash
npm run dev
```
> 편리한 실행을 위해 루트 폴더에 포함된 `run-all.bat` 또는 `run-dday.bat` 배치 스크립트를 사용할 수도 있습니다.

### 2. Docker를 이용한 배포 (운영 환경용)

이 프로젝트는 Docker 컨테이너를 통해 프론트엔드(Nginx)와 백엔드(Node.js)를 쉽게 배포할 수 있도록 구성되어 있습니다. (더 자세한 배포 가이드는 `DEPLOY.md` 파일을 참조하세요.)

```bash
# 이미지 빌드 및 컨테이너 백그라운드 실행
docker-compose up --build -d
```
- **데이터 보존**: `server-data` 폴더가 Docker 볼륨(`dday-data`)으로 마운트되어 있어, 컨테이너가 재시작되어도 사용자의 체크리스트 데이터가 안전하게 보존됩니다.
- 접속 방법: 서버 주소 `http://localhost:9697` 또는 `http://<서버아이피>:9697` 으로 접속.

## 📁 디렉토리 구조 (Folder Structure)

```text
bigdata-dday/
├── public/                 # 정적 리소스 파일
├── src/
│   ├── components/         # React 기능 컴포넌트 (Countdown, Checklist, Quote 등)
│   ├── styles/             # 전역 및 테마 CSS (theme.css)
│   ├── App.jsx             # 메인 애플리케이션 컴포넌트
│   └── main.jsx            # React 진입점
├── server-data/            # (서버 자동 생성) user data 저장소 
├── server.js               # Node.js Express 백엔드 서버 (REST API 및 파일 저장 로직)
├── package.json            # Node 의존성 패키지 관리
├── Dockerfile              # 프론트엔드 Production 빌드 및 Nginx 이미지 설정
├── Dockerfile.server       # 백엔드 Node.js 서버 Docker 이미지 설정
├── docker-compose.yml      # 멀티 컨테이너 환경 구성 파일
├── nginx.conf              # Nginx 리버스 프록시 및 정적 파일 라우팅 설정
└── DEPLOY.md               # 서비스 배포 상세 가이드 문서
```
