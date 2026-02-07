# 1단계: 빌드 환경 (Node.js)
FROM node:18-alpine AS build

# 작업 폴더 생성
WORKDIR /app

# 패키지 정보 복사
COPY package.json package-lock.json ./

# 필요한 프로그램(라이브러리) 설치
RUN npm install

# 소스 코드 전체 복사
COPY . .

# 앱 빌드 (최적화된 파일 생성)
RUN npm run build

# 2단계: 실행 환경 (Nginx 웹 서버)
FROM nginx:alpine

# 1단계에서 만든 빌드 결과물을 Nginx 웹 서버 폴더로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 커스텀 Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80번 포트 열기
EXPOSE 80

# Nginx 서버 실행
CMD ["nginx", "-g", "daemon off;"]
