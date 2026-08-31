import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';
import { callGeminiJSON } from '../services/gemini.service.js';

export async function parseResume(fileBuffer, mimeType) {
  let rawText = '';

  if (mimeType === 'application/pdf') {
    const data = await pdf(fileBuffer);
    rawText = data.text;
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    rawText = result.value;
  } else {
    rawText = fileBuffer.toString('utf-8');
  }

  if (!rawText || rawText.trim().length < 20) {
    return {
      skills: [],
      experience: [],
      projects: [],
      education: [],
      rawText: rawText.trim()
    };
  }

  const prompt = `Parse this resume text and extract structured data. Return JSON only:
{
  "skills": ["list of technical and soft skills"],
  "experience": [{"title": "Job Title", "company": "Company", "duration": "Duration", "description": "Brief description"}],
  "projects": [{"name": "Project Name", "description": "Brief description", "technologies": ["tech1"]}],
  "education": [{"degree": "Degree", "institution": "Institution", "year": "Year"}],
  "summary": "One paragraph professional summary"
}

Resume text:
${rawText.substring(0, 4000)}`;

  try {
    const parsed = await callGeminiJSON(prompt);
    return {
      ...parsed,
      rawText: rawText.substring(0, 2000)
    };
  } catch (e) {
    return {
      skills: rawText.match(/\b(JavaScript|Python|Java|React|Node|SQL|CSS|HTML|TypeScript|MongoDB|AWS|Docker|Git|C\+\+|Go|Rust|Ruby|PHP|Swift|Kotlin)\b/gi) || [],
      experience: [],
      projects: [],
      education: [],
      rawText: rawText.substring(0, 2000)
    };
  }
}

export default { parseResume };
