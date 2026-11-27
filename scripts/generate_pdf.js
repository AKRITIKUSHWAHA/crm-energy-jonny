const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const mdPath = path.join(__dirname, '../EGOLYTICS_CLIENT_DELIVERY_MASTER_REPORT.md');
const htmlPath = path.join(__dirname, '../EGOLYTICS_CLIENT_DELIVERY_MASTER_REPORT.html');
const pdfWorkspacePath = path.join(__dirname, '../EGOLYTICS_CLIENT_DELIVERY_MASTER_REPORT.pdf');
const desktopPdfPath = '/Users/shivamahirwar/Desktop/EGOLYTICS_CLIENT_DELIVERY_MASTER_REPORT.pdf';

const mdContent = fs.readFileSync(mdPath, 'utf8');

// Custom Markdown to HTML Converter for Executive Reports
function convertMarkdownToHtml(md) {
  const lines = md.split('\n');
  let html = [];
  let inCode = false;
  let codeContent = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;
  let listType = null;

  function closeTable() {
    if (!inTable) return;
    if (tableRows.length > 0) {
      let tableHtml = '<table class="report-table">\n';
      // First row is header
      const headerCols = tableRows[0];
      tableHtml += '  <thead>\n    <tr>\n';
      headerCols.forEach((col) => {
        tableHtml += `      <th>${formatInline(col.trim())}</th>\n`;
      });
      tableHtml += '    </tr>\n  </thead>\n  <tbody>\n';

      // Remaining rows (skip index 1 if it's separator)
      const dataRows = tableRows.slice(1);
      dataRows.forEach((row, rIdx) => {
        tableHtml += '    <tr>\n';
        row.forEach((col) => {
          tableHtml += `      <td>${formatInline(col.trim())}</td>\n`;
        });
        tableHtml += '    </tr>\n';
      });

      tableHtml += '  </tbody>\n</table>\n';
      html.push(tableHtml);
    }
    tableRows = [];
    inTable = false;
  }

  function closeList() {
    if (!inList) return;
    html.push(listType === 'ol' ? '</ol>' : '</ul>');
    inList = false;
    listType = null;
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCode) {
        html.push(`<pre class="code-block"><code>${escapeHtml(codeContent.join('\n'))}</code></pre>`);
        codeContent = [];
        inCode = false;
      } else {
        closeTable();
        closeList();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeContent.push(line);
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      closeList();
      const rawCols = line.trim().split('|').slice(1, -1);
      const isSeparator = rawCols.every((c) => /^\s*[:-]+[-| :]*$/.test(c));
      if (!isSeparator) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(rawCols);
      }
      continue;
    } else {
      closeTable();
    }

    // Horizontal Rule
    if (/^\s*([*-_]){3,}\s*$/.test(line)) {
      closeList();
      html.push('<hr class="divider" />');
      continue;
    }

    // Headers
    if (line.startsWith('# ')) {
      closeList();
      html.push(`<h1 class="h1-title">${formatInline(line.substring(2).trim())}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      closeList();
      html.push(`<h2 class="h2-section">${formatInline(line.substring(3).trim())}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      closeList();
      html.push(`<h3 class="h3-sub">${formatInline(line.substring(4).trim())}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      closeList();
      html.push(`<h4 class="h4-sub">${formatInline(line.substring(5).trim())}</h4>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      closeList();
      html.push(`<blockquote class="quote">${formatInline(line.substring(2).trim())}</blockquote>`);
      continue;
    }

    // HTML pass-through (like <div align="center"> or <img ... />)
    if (line.trim().startsWith('<div') || line.trim().startsWith('</div') || line.trim().startsWith('<img')) {
      closeList();
      html.push(line);
      continue;
    }

    // Unordered List
    if (/^\s*[*+-]\s+/.test(line)) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        html.push('<ul class="report-list">');
      }
      const itemText = line.replace(/^\s*[*+-]\s+/, '');
      html.push(`  <li>${formatInline(itemText)}</li>`);
      continue;
    }

    // Ordered List
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        html.push('<ol class="report-list">');
      }
      const itemText = line.replace(/^\s*\d+\.\s+/, '');
      html.push(`  <li>${formatInline(itemText)}</li>`);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      closeList();
      continue;
    }

    // Paragraph
    closeList();
    html.push(`<p class="report-p">${formatInline(line)}</p>`);
  }

  closeTable();
  closeList();

  return html.join('\n');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatInline(str) {
  // Bold + Italic
  str = str.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline Code
  str = str.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Links
  str = str.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="report-link">$1</a>');
  // <br> handling
  str = str.replace(/<br\s*\/?>/gi, '<br />');

  return str;
}

const bodyHtml = convertMarkdownToHtml(mdContent);

const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>EgoLytics R&D Management Tool & BFOV Charts - Client Delivery Master Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');

    @page {
      size: A4 portrait;
      margin: 18mm 14mm 18mm 14mm;
      @bottom-right {
        content: counter(page) " / " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9.5pt;
      line-height: 1.55;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    .h1-title {
      font-size: 20pt;
      font-weight: 800;
      color: #0f2b5c;
      margin: 0 0 6px 0;
      letter-spacing: -0.5px;
      line-height: 1.2;
    }

    .h2-section {
      font-size: 13pt;
      font-weight: 700;
      color: #0f2b5c;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 22px;
      margin-bottom: 12px;
      page-break-after: avoid;
    }

    .h3-sub {
      font-size: 11pt;
      font-weight: 600;
      color: #1e3a8a;
      margin-top: 14px;
      margin-bottom: 6px;
      page-break-after: avoid;
    }

    .h4-sub {
      font-size: 10pt;
      font-weight: 600;
      color: #334155;
      margin-top: 10px;
      margin-bottom: 4px;
      page-break-after: avoid;
    }

    .report-p {
      margin: 0 0 8px 0;
      color: #334155;
    }

    .divider {
      border: 0;
      height: 1px;
      background: #cbd5e1;
      margin: 16px 0;
    }

    .quote {
      margin: 10px 0;
      padding: 8px 14px;
      background: #f8fafc;
      border-left: 3.5px solid #0284c7;
      border-radius: 0 6px 6px 0;
      font-style: italic;
      color: #1e293b;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 16px 0;
      font-size: 8.5pt;
      page-break-inside: auto;
    }

    .report-table tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    .report-table th {
      background-color: #0f2b5c;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #0f2b5c;
    }

    .report-table td {
      padding: 5.5px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      color: #1e293b;
    }

    .report-table tbody tr:nth-child(even) {
      background-color: #f8fafc;
    }

    .code-block {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 10px 0;
      page-break-inside: avoid;
    }

    .inline-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1.5px 4px;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    .report-link {
      color: #0284c7;
      text-decoration: none;
      font-weight: 500;
    }

    .report-list {
      margin: 4px 0 10px 0;
      padding-left: 20px;
      color: #334155;
    }

    .report-list li {
      margin-bottom: 3px;
    }

    strong {
      color: #0f172a;
      font-weight: 600;
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;

fs.writeFileSync(htmlPath, completeHtml, 'utf8');
console.log('HTML generated at:', htmlPath);

// Generate PDF using headless Chrome
try {
  const chromeBin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const cmd = `"${chromeBin}" --headless=new --disable-gpu --disable-crash-reporter --no-pdf-header-footer --user-data-dir=/tmp/chrome-pdf-user-data --print-to-pdf="${pdfWorkspacePath}" "${htmlPath}"`;
  console.log('Running Chrome PDF generator...');
  execSync(cmd, { stdio: 'inherit' });
  console.log('PDF successfully created in workspace at:', pdfWorkspacePath);

  // Copy to Desktop
  fs.copyFileSync(pdfWorkspacePath, desktopPdfPath);
  console.log('PDF successfully copied to Desktop at:', desktopPdfPath);
} catch (e) {
  console.error('Error generating PDF with Chrome:', e.message);
  process.exit(1);
}
