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
 
function generateFilePath(filePath) {
  const relative = path.relative(CONTENT_DIR, filePath);
  return relative.replace(/\\/g, '/');
}
 
function sanitizeText(text) {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
 
async function processPDFs() {
  console.log('📚 Searching and indexing PDFs...');
 
  if (!fs.existsSync(INDEX_PATH)) {
    console.error('❌ Error: Run "npx quartz build" first.');
    return;
  }
 
  let contentIndex = {};
  try {
    const rawData = fs.readFileSync(INDEX_PATH, 'utf8');
    contentIndex = JSON.parse(rawData);
  } catch (e) {
    console.error('❌ Could not parse existing contentIndex.json:', e.message);
    console.error('   Aborting to avoid overwriting a corrupted index.');
    return;
  }
 
  const pdfFiles = getAllPdfs(CONTENT_DIR);
  console.log(`🔍 Found ${pdfFiles.length} PDFs.`);
 
  let indexed = 0;
  let failed = 0;
 
  for (const pdfPath of pdfFiles) {
    const slug = generateSlug(pdfPath);
    const filePath = generateFilePath(pdfPath);
    const fileName = path.basename(pdfPath, '.pdf');
 
    try {
      const rawText = await new Promise((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on('pdfParser_dataError', (err) =>
          reject(err.parserError || err)
        );
        pdfParser.on('pdfParser_dataReady', () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.loadPDF(pdfPath);
      });
 
      const text = sanitizeText(rawText);
 
      contentIndex[slug] = {
        slug,
        filePath,
        title: fileName,
        links: [],
        tags: [],
        content: text,
      };
 
      indexed++;
      console.log(`✅ Indexed: ${fileName}`);
    } catch (err) {
      failed++;
      console.error(`❌ Error processing ${fileName}:`, err?.message || err);
    }
  }
 
  const broken = Object.entries(contentIndex).filter(
    ([, v]) => !v || typeof v.filePath !== 'string' || typeof v.slug !== 'string'
  );
 
  if (broken.length > 0) {
    console.error(
      `❌ Found ${broken.length} entries without a valid "slug"/"filePath". Skipping write to avoid breaking the Explorer:`
    );
    broken.forEach(([k]) => console.error('   -', k));
    return;
  }
 
  fs.writeFileSync(INDEX_PATH, JSON.stringify(contentIndex, null, 2), 'utf8');
  console.log(`🚀 Done. ${indexed} PDFs indexed, ${failed} failed.`);
}
 
processPDFs();