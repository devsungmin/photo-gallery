# Photo Gallery

EXIF 메타데이터를 자동 추출하여 촬영 정보를 표시하는 사진 갤러리 웹사이트.

## 기능

- EXIF 메타데이터 자동 추출 (카메라, 렌즈, 조리개, 셔터스피드, ISO, 촬영일시)
- 썸네일 자동 생성
- 카테고리 필터링 (폴더 기반)
- 검색 (파일명, 카메라, 렌즈)
- 정렬 (촬영일시, 카메라, 초점거리, ISO)
- 다크모드 (시스템 테마 감지 + 수동 전환)
- Lightbox (원본 이미지 + EXIF 정보 패널)
- 반응형 디자인

## Tech Stack

- React 19 + TypeScript
- Vite
- CSS Modules
- exifr (EXIF 파싱)
- sharp (썸네일 생성)

## 시작하기

### 설치

```bash
npm install
```

### 사진 추가

`public/photos/` 하위에 카테고리 폴더를 만들고 사진을 넣습니다.

```
public/photos/
├── nature/
│   ├── sunset.jpg
│   └── forest.jpg
├── city/
│   └── night-view.jpg
└── people/
    └── portrait.jpg
```

폴더명이 카테고리로 자동 사용됩니다.

### 메타데이터 생성

```bash
npm run generate
```

사진의 EXIF 데이터를 추출하고 썸네일을 생성합니다.
사진을 추가하거나 변경한 후 다시 실행해 주세요.

### 개발 서버

```bash
npm run dev
```

### 프로덕션 빌드

```bash
npm run build
```

### 빌드 미리보기

```bash
npm run preview
```

## 명령어 요약

| 명령어 | 설명 |
|--------|------|
| `npm run generate` | EXIF 추출 + 썸네일 생성 |
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | ESLint 검사 |

## 프로젝트 구조

```
├── public/
│   ├── photos/           # 원본 사진 (사용자가 직접 넣는 곳)
│   └── thumbnails/       # 자동 생성된 썸네일
├── scripts/
│   └── generate-metadata.ts   # EXIF 추출 + 썸네일 생성 스크립트
├── src/
│   ├── components/       # React 컴포넌트
│   ├── data/
│   │   ├── photos.ts     # 데이터 로더
│   │   └── photos.json   # 자동 생성된 메타데이터
│   ├── hooks/            # 커스텀 훅 (useDarkMode)
│   └── types/            # TypeScript 타입 정의
└── package.json
```
