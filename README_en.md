# 📸 Photo Gallery

🌐 **[한국어로 읽기 (Korean)](README.md)**

✨ A modern, fast, and static photo gallery web application built with **React, Vite, and TypeScript**.

---

## 🌟 Features

- 🔍 **Automated Metadata Extraction**: Automatically parses EXIF data from your photos, extracting information like **Camera Make & Model, Lens, Aperture, Shutter Speed, ISO, and Focal Length**.
- ⚡ **Automated Image Optimization**: Automatically generates responsive thumbnails and WebP optimized images for fast rendering and bandwidth savings.
- 🖼️ **Broad Format Support**: Supports standard formats (JPG, PNG, WebP) as well as camera RAW formats (`.arw`, `.cr2`, `.nef`, etc.) and smartphone **HEIC** photos.
- 📁 **Folder-based Categories**: Categories are automatically classified based on the folder structure created within the `public/photos` directory.
- 🔎 **Search & Filter**: Find photos easily using file names, camera models, or lenses, and view them categorized via tabs.
- 🌗 **Responsive Design & Dark Mode**: Features a completely responsive grid UI with a built-in Lightbox viewer tailored for various screen sizes, alongside comfortable **Dark Mode** support.

---

## 🛠️ Prerequisites

To handle RAW and HEIC image formats during the initial build, native system tools of your operating system are utilized.

### 🍎 macOS
macOS uses the built-in `sips` tool, so **no extra installations are required** for HEIC/RAW processing.

### 🐧 Linux
You will need `exiftool` for EXIF processing of RAW files and `heif-convert` for handling HEIC files.
```bash
sudo apt-get install libimage-exiftool-perl libheif-examples
```

---

## 🚀 Getting Started

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Add Your Photos
Place your high-resolution photos or RAW/HEIC files into the `public/photos` directory. Grouping photos into subfolders will **automatically recognize the folder names as categories**.
```text
public/
└── photos/
    ├── 🌿 nature/
    │   └── DSC0001.ARW
    └── 🏙️ street/
        └── IMG_1234.HEIC
```

### 3️⃣ Generate Metadata & Optimize Images
Run the script to generate WebP thumbnails and high-resolution images for all photos, extract EXIF data, and create the `src/data/photos.json` file.
```bash
npm run generate
```
> 💡 *Note: The script execution time may vary depending on the number and size of the original photos.*

### 4️⃣ Start Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to see your newly generated gallery! 🎉

### 5️⃣ Build for Production
```bash
npm run build
```
Optimized static files for deployment will be generated in the `dist` folder.

---

## 💻 Tech Stack

- **Frontend**: [React 19](https://react.dev/) ⚛️, [TypeScript](https://www.typescriptlang.org/) 📘, [Vite](https://vitejs.dev/) ⚡, CSS Modules 🎨
- **Image Processing**: Node.js 🟩, [Sharp](https://sharp.pixelplumbing.com/) 🔪, [exifr](https://github.com/MikeKovarik/exifr) 📷
- **Deployment**: Highly portable and easily deployable anywhere since it's built as purely static files. Host it easily on Vercel, Netlify, GitHub Pages, or any standard web server. 🌐

---

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
