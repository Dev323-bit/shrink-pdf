# SHRINK

**Compress PDFs without losing clarity.**

SHRINK is a privacy-first, client-side PDF compression tool — part of the Aura 30-Day Utility Challenge (Tool #17/30). Every file is processed entirely in your browser. Nothing is ever uploaded to a server.


---

## ✨ Features

- **Drag & drop or click to upload** — supports multiple PDF files at once
- **100% client-side processing** — your files never leave your device, no backend, no data collection
- **Adjustable compression levels** — choose Low, Medium, or High compression depending on your needs
- **Before/after comparison** — see original size, compressed size, and % reduction for each file
- **Batch downloads** — download files individually or grab everything at once as a ZIP
- **Graceful error handling** — clear inline messages for corrupted or invalid files, no jarring browser alerts
- **Zero dependencies on a server** — works offline once loaded

---

## 🛠️ Tech Stack

- **HTML / CSS / JavaScript** — no frameworks, no build step
- **[pdf-lib](https://pdf-lib.js.org/)** — in-browser PDF parsing and compression
- **[JSZip](https://stuk.github.io/jszip/)** — bundling multiple compressed files into a single download
- **Vercel** — static hosting and deployment

---

## 📁 Project Structure
