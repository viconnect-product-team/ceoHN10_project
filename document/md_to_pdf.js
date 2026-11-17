const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

function convertMarkdownToPdf(mdContent, outPdfPath, docTitle = 'TÀI LIỆU CEO HN10') {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  // Load Arial fonts for Vietnamese unicode support
  const arialNormal = fs.readFileSync('C:/Windows/Fonts/arial.ttf').toString('base64');
  const arialBold = fs.readFileSync('C:/Windows/Fonts/arialbd.ttf').toString('base64');
  const arialItalic = fs.readFileSync('C:/Windows/Fonts/ariali.ttf').toString('base64');

  doc.addFileToVFS('arial.ttf', arialNormal);
  doc.addFont('arial.ttf', 'Arial', 'normal');

  doc.addFileToVFS('arialbd.ttf', arialBold);
  doc.addFont('arialbd.ttf', 'Arial', 'bold');

  doc.addFileToVFS('ariali.ttf', arialItalic);
  doc.addFont('ariali.ttf', 'Arial', 'italic');

  doc.setFont('Arial', 'normal');

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 20;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let y = marginTop;

  function checkPageBreak(neededHeight) {
    if (y + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      y = marginTop;
      return true;
    }
    return false;
  }

  const lines = mdContent.split(/\r?\n/);
  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  function drawTable() {
    if (tableRows.length === 0) return;
    const validRows = tableRows.filter(r => !r.some(cell => /^:?-+:?$/.test(cell.trim())));
    if (validRows.length === 0) {
      tableRows = [];
      inTable = false;
      return;
    }

    const colCount = Math.max(...validRows.map(r => r.length));
    const colWidth = contentWidth / colCount;

    checkPageBreak(15);

    validRows.forEach((row, rIdx) => {
      const isHeader = (rIdx === 0);
      const rowHeight = 7.5;
      checkPageBreak(rowHeight + 2);

      // Background
      if (isHeader) {
        doc.setFillColor(139, 0, 0); // Burgundy #8B0000
        doc.rect(marginLeft, y, contentWidth, rowHeight, 'F');
      } else if (rIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252); // Slate #F8FAFC
        doc.rect(marginLeft, y, contentWidth, rowHeight, 'F');
      }

      // Border lines
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.rect(marginLeft, y, contentWidth, rowHeight, 'S');

      // Cell texts
      doc.setFont('Arial', isHeader ? 'bold' : 'normal');
      doc.setFontSize(isHeader ? 8 : 7.5);
      if (isHeader) {
        doc.setTextColor(255, 255, 255);
      } else {
        doc.setTextColor(31, 41, 55);
      }

      for (let c = 0; c < colCount; c++) {
        const rawCell = row[c] ? row[c].trim() : '';
        const cellX = marginLeft + c * colWidth + 2;
        const textLines = doc.splitTextToSize(rawCell, colWidth - 4);
        doc.text(textLines[0] || '', cellX, y + 5);
      }

      y += rowHeight;
    });

    y += 4;
    tableRows = [];
    inTable = false;
  }

  function drawCodeBlock() {
    if (codeBlockLines.length === 0) return;
    const text = codeBlockLines.join('\n');
    doc.setFont('Arial', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);

    const splitLines = doc.splitTextToSize(text, contentWidth - 8);
    const boxHeight = splitLines.length * 4 + 6;

    checkPageBreak(Math.min(boxHeight, 40));

    doc.setFillColor(243, 244, 246);
    doc.setDrawColor(209, 213, 219);
    doc.rect(marginLeft, y, contentWidth, boxHeight, 'FD');

    let textY = y + 4;
    for (const cl of splitLines) {
      if (textY > pageHeight - marginBottom - 4) {
        doc.addPage();
        y = marginTop;
        textY = y + 4;
      }
      doc.text(cl, marginLeft + 4, textY);
      textY += 4;
    }

    y = textY + 4;
    codeBlockLines = [];
    inCodeBlock = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code blocks
    if (trimmed.startsWith('```')) {
      if (inTable) drawTable();
      if (inCodeBlock) {
        drawCodeBlock();
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine);
      continue;
    }

    // Check tables
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      inTable = true;
      const cells = trimmed.slice(1, -1).split('|');
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      drawTable();
    }

    // Horizontal line
    if (trimmed === '---' || trimmed === '***') {
      checkPageBreak(8);
      doc.setDrawColor(180, 83, 9); // Gold #B45309
      doc.setLineWidth(0.5);
      doc.line(marginLeft, y + 2, marginLeft + contentWidth, y + 2);
      y += 6;
      continue;
    }

    // Heading 1
    if (trimmed.startsWith('# ')) {
      checkPageBreak(18);
      const text = trimmed.slice(2).trim();
      doc.setFont('Arial', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(139, 0, 0); // Burgundy
      const wrapped = doc.splitTextToSize(text, contentWidth);
      doc.text(wrapped, marginLeft + contentWidth / 2, y + 6, { align: 'center' });
      y += wrapped.length * 7 + 4;
      continue;
    }

    // Heading 2
    if (trimmed.startsWith('## ')) {
      checkPageBreak(14);
      const text = trimmed.slice(3).trim();
      doc.setFont('Arial', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(180, 83, 9); // Gold
      // Accent bar
      doc.setFillColor(180, 83, 9);
      doc.rect(marginLeft, y + 2, 2.5, 6, 'F');
      const wrapped = doc.splitTextToSize(text, contentWidth - 6);
      doc.text(wrapped, marginLeft + 5, y + 6.5);
      y += wrapped.length * 6 + 3;
      continue;
    }

    // Heading 3
    if (trimmed.startsWith('### ')) {
      checkPageBreak(10);
      const text = trimmed.slice(4).trim();
      doc.setFont('Arial', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(30, 58, 138); // Navy
      const wrapped = doc.splitTextToSize(text, contentWidth);
      doc.text(wrapped, marginLeft, y + 5);
      y += wrapped.length * 5 + 2;
      continue;
    }

    // Heading 4
    if (trimmed.startsWith('#### ')) {
      checkPageBreak(8);
      const text = trimmed.slice(5).trim();
      doc.setFont('Arial', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      const wrapped = doc.splitTextToSize(text, contentWidth);
      doc.text(wrapped, marginLeft, y + 4.5);
      y += wrapped.length * 4.5 + 2;
      continue;
    }

    // Bullet point
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      checkPageBreak(6);
      const bulletText = trimmed.slice(2).trim().replace(/\*\*(.*?)\*\*/g, '$1').replace(/\`(.*?)\`/g, '$1');
      doc.setFont('Arial', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(31, 41, 55);

      // Bullet dot
      doc.setFillColor(180, 83, 9);
      doc.circle(marginLeft + 2, y + 3.2, 0.8, 'F');

      const wrapped = doc.splitTextToSize(bulletText, contentWidth - 6);
      doc.text(wrapped, marginLeft + 6, y + 4);
      y += wrapped.length * 4.5 + 1;
      continue;
    }

    // Numbered item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      checkPageBreak(6);
      const numPrefix = `${numMatch[1]}. `;
      const itemText = numMatch[2].trim().replace(/\*\*(.*?)\*\*/g, '$1').replace(/\`(.*?)\`/g, '$1');
      doc.setFont('Arial', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 58, 138);
      doc.text(numPrefix, marginLeft, y + 4);

      doc.setFont('Arial', 'normal');
      doc.setTextColor(31, 41, 55);
      const wrapped = doc.splitTextToSize(itemText, contentWidth - 8);
      doc.text(wrapped, marginLeft + 7, y + 4);
      y += wrapped.length * 4.5 + 1;
      continue;
    }

    // Empty line
    if (!trimmed) {
      y += 2.5;
      continue;
    }

    // Regular paragraph
    checkPageBreak(6);
    const cleanText = trimmed.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\`(.*?)\`/g, '$1');
    doc.setFont('Arial', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(31, 41, 55);
    const wrapped = doc.splitTextToSize(cleanText, contentWidth);
    doc.text(wrapped, marginLeft, y + 4);
    y += wrapped.length * 4.5 + 1.5;
  }

  if (inTable) drawTable();
  if (inCodeBlock) drawCodeBlock();

  // Add Headers & Footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Header (pages > 1)
    if (p > 1) {
      doc.setFont('Arial', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.text('CLB DOANH NHÂN CEO HN10 (HANOIBA) — HỆ THỐNG QUẢN TRỊ SỐ', marginLeft, 10);
      doc.setDrawColor(229, 231, 235);
      doc.line(marginLeft, 12, marginLeft + contentWidth, 12);
    }

    // Footer
    doc.setFont('Arial', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(156, 163, 175);
    doc.setDrawColor(229, 231, 235);
    doc.line(marginLeft, pageHeight - 12, marginLeft + contentWidth, pageHeight - 12);
    doc.text('VICONNECT - Nền tảng Chuyển đổi số Doanh nhân', marginLeft, pageHeight - 8);
    doc.text(`Trang ${p} / ${totalPages}`, marginLeft + contentWidth, pageHeight - 8, { align: 'right' });
  }

  doc.save(outPdfPath);
  const stats = fs.statSync(outPdfPath);
  console.log(`SUCCESS: Exported PDF -> ${outPdfPath} (${(stats.size / 1024).toFixed(1)} KB, ${totalPages} trang)`);
}

module.exports = {
  convertMarkdownToPdf
};
