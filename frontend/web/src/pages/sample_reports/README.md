# Sample Reports (static HTML)

This folder contains static sample report HTML files copied from:
`/Users/alex_1/Desktop/chess_report_page/website/sample report/`

Files:
- `xuehaowen_report.html`
- `hikaru_report.html`
- `yuyaochen_report.html`

## How to open

### 1) Direct file open
You can open a file directly in the browser with its file path:
`/Users/alex_1/Desktop/catachess备份/frontend/web/src/pages/sample_reports/xuehaowen_report.html`

Note: when opened via `file://`, absolute asset links like `/assets/reports_css/report.css` will NOT resolve.

### 2) Serve with Vite (recommended)
These HTML files reference:
- `/assets/reports_css/report.css`
- `/assets/reports_css/report_viz.css`
- `/assets/report_viz.js`
- `/assets/gm_photos/*`

To make those work under the Vite dev server, copy the assets from:
`/Users/alex_1/Desktop/chess_report_page/assets/`
into:
`/Users/alex_1/Desktop/catachess备份/frontend/web/public/assets/`

Then the reports are available at:
- `http://localhost:5173/sample_reports/xuehaowen_report.html`
- `http://localhost:5173/sample_reports/hikaru_report.html`
- `http://localhost:5173/sample_reports/yuyaochen_report.html`

(Port may differ if your Vite dev server is configured differently.)

## Notes
- These files are plain HTML, not React components.
- If you want to embed them in the React app, use an `<iframe>` that points to the served URL.
