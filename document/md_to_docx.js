const fs = require('fs');
const path = require('path');
const docx = require('docx');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType
} = docx;

function parseInlineFormatting(text) {
  const runs = [];
  const parts = text.split(/(\*\*.*?\*\*|\`.*?\`|\*.*?\*)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
        font: 'Times New Roman',
        size: 24, // 12pt
        color: '111827'
      }));
    } else if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        font: 'Consolas',
        size: 22, // 11pt
        color: '991B1B',
        shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' }
      }));
    } else if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      runs.push(new TextRun({
        text: part.slice(1, -1),
        italics: true,
        font: 'Times New Roman',
        size: 24,
        color: '4B5563'
      }));
    } else {
      runs.push(new TextRun({
        text: part,
        font: 'Times New Roman',
        size: 24,
        color: '1F2937'
      }));
    }
  }
  return runs.length > 0 ? runs : [new TextRun({ text, font: 'Times New Roman', size: 24 })];
}

function convertMarkdownToDocx(mdContent, title = 'Tài liệu CEO HN10') {
  const lines = mdContent.split(/\r?\n/);
  const children = [];

  let inTable = false;
  let tableRows = [];
  let inCodeBlock = false;
  let codeBlockLines = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;

    // Filter separator row (| :--- |)
    const validRows = tableRows.filter(r => !r.some(cell => /^:?-+:?$/.test(cell.trim())));
    if (validRows.length === 0) {
      tableRows = [];
      inTable = false;
      return;
    }

    const colCount = Math.max(...validRows.map(r => r.length));
    const tableWidthDxa = 9000;
    const colWidthDxa = Math.floor(tableWidthDxa / colCount);

    const docxRows = validRows.map((rowCells, rIdx) => {
      const isHeader = (rIdx === 0);
      const cells = [];
      for (let c = 0; c < colCount; c++) {
        const text = rowCells[c] ? rowCells[c].trim() : '';
        cells.push(new TableCell({
          width: { size: colWidthDxa, type: WidthType.DXA },
          shading: {
            type: ShadingType.CLEAR,
            fill: isHeader ? '8B0000' : (rIdx % 2 === 1 ? 'FFFFFF' : 'F9FAFB')
          },
          margins: { top: 120, bottom: 120, left: 160, right: 160 },
          children: [
            new Paragraph({
              alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
              children: [
                new TextRun({
                  text,
                  bold: isHeader,
                  color: isHeader ? 'FFFFFF' : '1F2937',
                  font: 'Times New Roman',
                  size: isHeader ? 22 : 20 // 11pt vs 10pt
                })
              ]
            })
          ]
        }));
      }
      return new TableRow({
        children: cells,
        tableHeader: isHeader
      });
    });

    children.push(new Table({
      width: { size: tableWidthDxa, type: WidthType.DXA },
      rows: docxRows
    }));
    children.push(new Paragraph({ spacing: { after: 120 } }));

    tableRows = [];
    inTable = false;
  };

  const flushCodeBlock = () => {
    if (codeBlockLines.length === 0) return;
    const text = codeBlockLines.join('\n');
    children.push(new Paragraph({
      spacing: { before: 80, after: 80 },
      shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
      children: [
        new TextRun({
          text,
          font: 'Consolas',
          size: 18, // 9pt
          color: '1E3A8A'
        })
      ]
    }));
    codeBlockLines = [];
    inCodeBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Check code blocks
    if (trimmed.startsWith('```')) {
      if (inTable) flushTable();
      if (inCodeBlock) {
        flushCodeBlock();
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
      flushTable();
    }

    // Check horizontal rule
    if (trimmed === '---' || trimmed === '***') {
      children.push(new Paragraph({
        border: {
          bottom: { color: 'B45309', size: 6, style: BorderStyle.SINGLE }
        },
        spacing: { before: 120, after: 180 }
      }));
      continue;
    }

    // Check headings
    if (trimmed.startsWith('# ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 300, after: 160 },
        children: [
          new TextRun({
            text: trimmed.slice(2).trim(),
            bold: true,
            size: 40, // 20pt
            font: 'Times New Roman',
            color: '8B0000'
          })
        ]
      }));
      continue;
    }

    if (trimmed.startsWith('## ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [
          new TextRun({
            text: trimmed.slice(3).trim(),
            bold: true,
            size: 32, // 16pt
            font: 'Times New Roman',
            color: 'B45309'
          })
        ]
      }));
      continue;
    }

    if (trimmed.startsWith('### ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: trimmed.slice(4).trim(),
            bold: true,
            size: 28, // 14pt
            font: 'Times New Roman',
            color: '1E3A8A'
          })
        ]
      }));
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      children.push(new Paragraph({
        heading: HeadingLevel.HEADING_4,
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({
            text: trimmed.slice(5).trim(),
            bold: true,
            size: 24, // 12pt
            font: 'Times New Roman',
            color: '374151'
          })
        ]
      }));
      continue;
    }

    // Check bullet list
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const bulletText = trimmed.slice(2).trim();
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
        children: parseInlineFormatting(bulletText)
      }));
      continue;
    }

    // Check numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      children.push(new Paragraph({
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({ text: `${numMatch[1]}. `, bold: true, font: 'Times New Roman', size: 24, color: '1E3A8A' }),
          ...parseInlineFormatting(numMatch[2])
        ]
      }));
      continue;
    }

    // Empty line
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 100 } }));
      continue;
    }

    // Normal paragraph
    children.push(new Paragraph({
      spacing: { before: 60, after: 60 },
      alignment: AlignmentType.JUSTIFIED,
      children: parseInlineFormatting(trimmed)
    }));
  }

  if (inTable) flushTable();
  if (inCodeBlock) flushCodeBlock();

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24,
            color: '1F2937'
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            bottom: 1440,
            left: 1440,
            right: 1440
          }
        }
      },
      children
    }]
  });

  return doc;
}

async function exportMarkdownToDocxFile(mdFilePath, outDocxPath, title) {
  const mdContent = fs.readFileSync(mdFilePath, 'utf8');
  const doc = convertMarkdownToDocx(mdContent, title);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outDocxPath, buffer);
  console.log(`SUCCESS: Exported DOCX -> ${outDocxPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

module.exports = {
  convertMarkdownToDocx,
  exportMarkdownToDocxFile
};
