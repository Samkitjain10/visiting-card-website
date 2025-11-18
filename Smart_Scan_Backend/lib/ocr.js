const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

/**
 * Extracts text from image using OCR Space API
 */
async function extractTextWithOCRSpace(imagePath) {
  try {
    console.log('Using OCR Space API for text extraction...');
    
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    
    const apiUrl = 'https://api.ocr.space/parse/imagebase64';
    
    const formData = new URLSearchParams();
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');
    
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OCR Space API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.OCRExitCode !== 1) {
      throw new Error(`OCR Space failed: ${result.ErrorMessage || 'Unknown error'}`);
    }

    let extractedText = '';
    if (result.ParsedResults && result.ParsedResults.length > 0) {
      extractedText = result.ParsedResults.map((block) => block.ParsedText).join('\n');
    }

    console.log('OCR Space extraction completed, text length:', extractedText.length);
    return extractedText.trim();
  } catch (error) {
    console.error('OCR Space API Error:', error);
    throw error;
  }
}

/**
 * Extracts structured contact information from a visiting card image
 */
async function extractContactInfo(imagePath) {
  let extractedText = '';
  let contactDataFromGeminiVision = null;

  // Step 1: Try Gemini Vision API
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log('Using Gemini Vision API for extraction...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      const imageData = fs.readFileSync(imagePath);
      const base64Image = imageData.toString('base64');
      
      let mimeType = 'image/jpeg';
      const ext = imagePath.toLowerCase().split('.').pop();
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'webp') mimeType = 'image/webp';

      const prompt = `Extract contact information from this visiting card image. The card may contain text in English, Hindi (Devanagari script), or both languages.

Return a JSON object with the following structure:
{
  "company": "company name (this is the most important field - extract the business/company name)",
  "name": "person's name (if visible, otherwise empty string)",
  "phones": ["phone1", "phone2", "phone3"] (array of up to 3 phone numbers, can be empty),
  "email": "email address (if present, otherwise empty string)",
  "website": "website URL (if present, otherwise empty string)",
  "address": "full address including street, city, state, zip code (if present, otherwise empty string)",
  "rawText": "all text extracted from the card in original format"
}

Important rules:
1. Extract the COMPANY NAME as the primary field (this is what will be saved in the "Name" column)
2. If the company name or person's name is in Hindi (Devanagari script), TRANSLITERATE it to English using standard Romanization (e.g., "रूप वर्षा ज्वैलरी" → "Roop Varsha Jewellery")
3. Use common English transliteration patterns for Hindi names
4. Extract up to 3 phone numbers in the phones array
5. Phone numbers can be in formats like: +91 98295 50499, 9829550499, +919829550499, etc.
6. If the card has multiple people, extract the company name and all phone numbers
7. Preserve the raw text for reference (keep original Hindi text in rawText)
8. Return ONLY valid JSON, no markdown, no code blocks

Return the JSON object now:`;

      const modelNames = [
        'models/gemini-2.5-flash',
        'models/gemini-2.5-pro',
        'models/gemini-2.0-flash-exp'
      ];
      
      let result;
      
      for (const modelName of modelNames) {
        try {
          console.log(`Trying model: ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          
          result = await model.generateContent([
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            },
            prompt
          ]);
          console.log(`✅ Successfully used model: ${modelName}`);
          break;
        } catch (err) {
          const errorMsg = err.message || err.toString();
          console.log(`❌ Model ${modelName} failed: ${errorMsg.substring(0, 100)}`);
          
          if (err.status === 404 || err.statusCode === 404 || errorMsg.includes('404') || errorMsg.includes('not found')) {
            continue;
          } else if (err.status === 429 || err.statusCode === 429 || errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('quota exceeded')) {
            console.error('⚠️  Gemini API quota exceeded for all models');
            if (modelName === modelNames[modelNames.length - 1]) {
              console.log('All Gemini models failed due to quota. Falling back to OCR Space...');
              break;
            }
            continue;
          } else if (err.status === 400 || err.statusCode === 400 || errorMsg.includes('API key not valid') || errorMsg.includes('API_KEY_INVALID')) {
            throw new Error('Gemini API key is invalid.');
          } else if (err.status === 403 || err.statusCode === 403 || errorMsg.includes('403') || errorMsg.includes('permission')) {
            throw new Error('Gemini API permission error. Please enable "Generative Language API" in Google Cloud Console.');
          } else {
            continue;
          }
        }
      }
      
      if (result) {
        const response = await result.response;
        let text = response.text();
        
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
          contactDataFromGeminiVision = JSON.parse(text);
          extractedText = contactDataFromGeminiVision.rawText || text;
        } catch (parseError) {
          console.error('Failed to parse Gemini Vision JSON response:', parseError);
          console.log('Will proceed to OCR Space fallback for raw text extraction.');
        }
      } else {
        console.log('No Gemini Vision result. Will try OCR Space fallback.');
      }
    } catch (error) {
      console.error('Gemini Vision API Error (initial extraction):', error);
      console.log('Falling back to OCR Space...');
    }
  }

  // Step 2: If Gemini Vision failed or no key, use OCR Space API
  if (!extractedText) {
    try {
      extractedText = await extractTextWithOCRSpace(imagePath);
    } catch (error) {
      console.error('OCR Space extraction failed:', error);
      return {
        company: '',
        name: '',
        phones: [],
        email: '',
        website: '',
        address: '',
        rawText: 'OCR extraction failed. Please check your API keys or try again later.'
      };
    }
  }

  // Step 3: Use Gemini to parse the extracted text if available and not already parsed by Gemini Vision
  if (extractedText && process.env.GEMINI_API_KEY && !contactDataFromGeminiVision) {
    try {
      console.log('Using Gemini to parse extracted text...');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      
      const parsePrompt = `Parse the following text extracted from a visiting card and extract contact information.

Extracted text:
${extractedText}

Return a JSON object with the following structure:
{
  "company": "company name",
  "name": "person's name (if visible, otherwise empty string)",
  "phones": ["phone1", "phone2", "phone3"],
  "email": "email address (if present, otherwise empty string)",
  "website": "website URL (if present, otherwise empty string)",
  "address": "full address including street, city, state, zip code (if present, otherwise empty string)",
  "rawText": "the original extracted text"
}

Important rules:
1. Extract the COMPANY NAME as the primary field
2. If the company name or person's name is in Hindi (Devanagari script), TRANSLITERATE it to English
3. Extract up to 3 phone numbers in the phones array
4. Return ONLY valid JSON, no markdown, no code blocks

Return the JSON object now:`;

      const modelNames = [
        'models/gemini-2.5-flash',
        'models/gemini-2.5-pro',
        'models/gemini-2.0-flash-exp'
      ];
      
      let result;
      
      for (const modelName of modelNames) {
        try {
          console.log(`Trying Gemini model for parsing: ${modelName}...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          result = await model.generateContent(parsePrompt);
          console.log(`✅ Successfully parsed with model: ${modelName}`);
          break;
        } catch (err) {
          const errorMsg = err.message || err.toString();
          console.log(`❌ Model ${modelName} parsing failed: ${errorMsg.substring(0, 100)}`);
          
          if (err.status === 429 || err.statusCode === 429 || errorMsg.includes('429') || errorMsg.includes('quota')) {
            console.log('Gemini quota exceeded for parsing. Will use basic regex parsing.');
            break;
          }
          
          if (modelName === modelNames[modelNames.length - 1]) {
            console.log('All Gemini models failed for parsing. Will use basic regex parsing.');
            break;
          }
          continue;
        }
      }

      if (result) {
        const response = await result.response;
        let text = response.text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        try {
          const contactData = JSON.parse(text);
          
          return {
            company: contactData.company || contactData.Company || '',
            name: contactData.name || contactData.Name || '',
            phones: Array.isArray(contactData.phones) ? contactData.phones.filter((p) => p && p.trim()) : [],
            email: contactData.email || contactData.Email || '',
            website: contactData.website || contactData.Website || '',
            address: contactData.address || contactData.Address || '',
            rawText: contactData.rawText || extractedText
          };
        } catch (parseError) {
          console.error('Failed to parse Gemini JSON response:', parseError);
          console.log('Falling back to basic regex parsing...');
        }
      } else {
        console.log('No Gemini model available for parsing. Using basic regex parsing...');
      }
    } catch (error) {
      console.error('Gemini parsing error:', error);
      console.log('Falling back to basic regex parsing...');
    }
  }

  // Step 4: Final fallback: If Gemini parsing failed or no Gemini API key, use basic regex parsing
  const emailMatch = extractedText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i);
  const email = emailMatch ? emailMatch[0] : '';
  
  const phonePatterns = [
    /\+\d{1,3}[\s.-]?\d{4,5}[\s.-]?\d{5,6}/,
    /\+\d{1,3}[\s]?\d{10,12}/,
    /\d{3}[\s.-]\d{3}[\s.-]\d{4}/,
    /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    /\d{10,12}/,
  ];
  
  let phoneMatches = [];
  for (const pattern of phonePatterns) {
    const matches = extractedText.matchAll(new RegExp(pattern.source, 'g'));
    for (const match of matches) {
      const phoneCandidate = match[0].trim();
      const digitsOnly = phoneCandidate.replace(/\D/g, '');
      if ((digitsOnly.length >= 10 && digitsOnly.length <= 15)) {
        phoneMatches.push(phoneCandidate);
      }
    }
  }
  
  const uniquePhones = [...new Set(phoneMatches)].slice(0, 3);
  
  // If we got data from Gemini Vision, return it
  if (contactDataFromGeminiVision) {
    return {
      company: contactDataFromGeminiVision.company || contactDataFromGeminiVision.Company || '',
      name: contactDataFromGeminiVision.name || contactDataFromGeminiVision.Name || '',
      phones: Array.isArray(contactDataFromGeminiVision.phones) ? contactDataFromGeminiVision.phones.filter((p) => p && p.trim()) : uniquePhones,
      email: contactDataFromGeminiVision.email || contactDataFromGeminiVision.Email || email,
      website: contactDataFromGeminiVision.website || contactDataFromGeminiVision.Website || '',
      address: contactDataFromGeminiVision.address || contactDataFromGeminiVision.Address || '',
      rawText: contactDataFromGeminiVision.rawText || extractedText
    };
  }
  
  return {
    company: '',
    name: '',
    phones: uniquePhones,
    email: email,
    website: '',
    address: '',
    rawText: extractedText
  };
}

module.exports = { extractContactInfo };

