
# Quartz v5 PDF Indexer Plugin

A custom plugin for **Quartz v5** that parses and extracts full text from PDF files located in your `content/` folder, making their text content searchable through Quartz's built-in search bar (`contentIndex.json`).

Project inspired in [MaelImhof/quartz-pdfindex](https://github.com/MaelImhof/quartz-pdfindex), but on v5.

---

## 🌟 Features

* 📄 **Full-text PDF Search:** Automatically extracts text from all `.pdf` files.
---

## 📦 Installation

1. Install `pdf2json`:
```bash
npm install pdf2json
```

2. Run the following command in the root directory of your Quartz v5 project:

```bash
npx quartz plugin add github:nlimeres/quartz-pdfindex
```

nano ~/quartz/quartz/plugins/emitters/index.ts

export { PDFIndex } from "./pdfIndex"

## 🚀 Usage
Once installed and configured, build your Quartz site as usual:
```bash
npx quartz build && node index-pdf.js
```

<video controls src="example.mp4" title="Title"></video>