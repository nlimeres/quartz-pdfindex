import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFParser from 'pdf2json';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.join(__dirname, 'content');
const INDEX_PATH = path.join(__dirname, 'public', 'static', 'contentIndex.json');

function getAllPdfs(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllPdfs(fullPath, arrayOfFiles);
    } else if (file.toLowerCase().endsWith('.pdf')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function generateSlug(filePath) {
  const relative = path.relative(CONTENT_DIR, filePath);
  return relative.replace(/\\/g, '/').replace(/\.pdf$/i, '');
}

async function processPDFs() {
  console.log('📚 Searching and indexing PDFs...');

  if (!fs.existsSync(INDEX_PATH)) {
    console.error('❌ Error: Execute first "npx quartz build".');
    return;
  }

  let contentIndex = {};
  try {
    const rawData = fs.readFileSync(INDEX_PATH, 'utf8');
    contentIndex = JSON.parse(rawData);
  } catch (e) {
    console.warn('⚠️ A new contentIndex.json will be created');
  }

  const pdfFiles = getAllPdfs(CONTENT_DIR);
  console.log(`🔍 ${pdfFiles.length} PDFs were found.`);

  for (const pdfPath of pdfFiles) {
    const slug = generateSlug(pdfPath);
    const fileName = path.basename(pdfPath);

    try {
      const text = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on('pdfParser_dataError', (err) => reject(err));
        pdfParser.on('pdfParser_dataReady', () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.loadPDF(pdfPath);
      });

      contentIndex[slug] = {
        title: fileName,
        links: [],
        tags: [],
        content: text
      };

      console.log(`✅ Indexing: ${fileName}`);
    } catch (err) {
      console.error(`❌ Error while procesando ${fileName}:`, err);
    }
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(contentIndex, null, 2), 'utf8');
  console.log('🚀 All the pdfs are indexed!');
}

processPDFs();