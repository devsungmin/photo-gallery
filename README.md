# 📸 사진 갤러리 (Photo Gallery)

🌐 **[Read this in English](README_en.md)**

✨ **React, Vite, TypeScript** 기반으로 제작된 모던하고 빠른 정적 사진 갤러리 웹 애플리케이션입니다.

---

## 🌟 주요 기능 (Features)

- 🔍 **자동 메타데이터 추출**: 사진의 EXIF 데이터를 자동으로 분석하여 **카메라 기종, 렌즈, 조리개, 셔터 스피드, ISO, 초점 거리** 등의 정보를 추출합니다.
- ⚡ **이미지 자동 최적화**: 썸네일과 WebP 포맷의 최적화된 이미지를 자동으로 생성하여 빠른 렌더링 속도와 대역폭 절감 효과를 제공합니다.
- 🖼️ **다양한 이미지 포맷 지원**: 기본 포맷(JPG, PNG, WebP) 외에도 카메라의 RAW 포맷(`.arw`, `.cr2`, `.nef` 등)과 스마트폰의 **HEIC** 사진을 완벽하게 지원합니다.
- 📁 **폴더 기반 카테고리**: `public/photos` 디렉토리 내에 생성한 폴더 구조를 기반으로 카테고리가 자동으로 분류됩니다.
- 🔎 **검색 및 필터링 기능**: 파일명, 카메라 모델명, 렌즈명 등으로 사진을 검색할 수 있으며 카테고리 탭으로 쉽게 모아볼 수 있습니다.
- 🌗 **반응형 디자인 및 다크 모드**: 다양한 화면 크기에 맞춰 동작하는 완벽한 반응형 그리드 UI와 Lightbox 뷰어, 그리고 눈이 편안한 **다크 모드**를 지원합니다.

---

## 🛠️ 사전 준비 사항 (Prerequisites)

초기 빌드를 진행할 때 RAW 파일과 HEIC 이미지를 처리하기 위해 운영 체제의 네이티브 시스템 도구를 사용합니다.

### 🍎 macOS 
macOS는 기본 내장된 `sips` 도구를 사용하므로 HEIC/RAW 처리를 위한 별도의 추가 프로그램 **설치가 필요하지 않습니다.**

### 🐧 Linux 
RAW 파일의 EXIF 처리를 위한 `exiftool`과, HEIC 로드를 위한 `heif-convert`가 필요합니다.
```bash
sudo apt-get install libimage-exiftool-perl libheif-examples
```

---

## 🚀 시작하기 (Getting Started)

### 1️⃣ 패키지 설치
```bash
npm install
```

### 2️⃣ 사진 파일 추가하기
사진이나 RAW/HEIC 파일들을 `public/photos` 디렉토리 안에 넣어주세요. 하위 폴더별로 사진을 모아두면, 그 폴더 이름이 **카테고리로 자동 인식**됩니다.
```text
public/
└── photos/
    ├── 🌿 nature/
    │   └── DSC0001.ARW
    └── 🏙️ street/
        └── IMG_1234.HEIC
```

### 3️⃣ 메타데이터 추출 및 이미지 최적화
스크립트를 실행하여 모든 사진의 WebP 썸네일과 고해상도 이미지를 생성하고, EXIF 데이터를 추출해 `src/data/photos.json` 파일을 만듭니다.
```bash
npm run generate
```
> 💡 *참고: 원본 사진의 개수와 크기에 따라 스크립트 실행 시간이 다소 소요될 수 있습니다.*

### 4️⃣ 개발용 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173` 으로 접속해 방금 생성된 갤러리를 확인할 수 있습니다! 🎉

### 5️⃣ 운영 환경 빌드 (Production)
```bash
npm run build
```
배포에 사용할 최적화된 정적 파일들이 `dist` 폴더에 생성됩니다.

---

## 💻 기술 스택 (Tech Stack)

- **Frontend**: [React 19](https://react.dev/) ⚛️, [TypeScript](https://www.typescriptlang.org/) 📘, [Vite](https://vitejs.dev/) ⚡, CSS Modules 🎨
- **Image Processing**: Node.js 🟩, [Sharp](https://sharp.pixelplumbing.com/) 🔪, [exifr](https://github.com/MikeKovarik/exifr) 📷
- **Deployment**: 완전한 정적 파일 형태로 빌드되므로 Vercel, Netlify, GitHub Pages 및 일반 웹 서버 등 어디든지 쉽게 배포할 수 있습니다. 🌐

---

## 📄 라이선스 (License)

이 프로젝트는 **MIT 라이선스**를 따릅니다.
