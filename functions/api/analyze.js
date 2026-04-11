export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.GEMINI_API_KEY;

  // ✅ 1단계: 토큰 존재 확인
  const authHeader = request.headers.get('Authorization') || '';
  const idToken = authHeader.replace('Bearer ', '').trim();
  if (!idToken) {
    return new Response(JSON.stringify({ error: { message: 'Login required.' } }), 
      { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

// ✅ 이걸로 교체
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

try {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
    audience: env.FIREBASE_PROJECT_ID,
  });
  // payload.uid, payload.email 등 유저 정보 사용 가능
} catch (e) {
  return new Response(JSON.stringify({ error: { message: 'Invalid token.' } }),
    { status: 403, headers: { 'Content-Type': 'application/json' } });
}
  
  // ✅ 3단계: 요청 바디 읽기 및 크기 제한
  const body = await request.arrayBuffer();
  if (body.byteLength > 4 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: { message: 'Image size exceeds 4MB limit.' } }), 
      { status: 413, headers: { 'Content-Type': 'application/json' } });
  }

  let requestBody;
  try {
    requestBody = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return new Response(JSON.stringify({ error: { message: 'Invalid JSON body.' } }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // ✅ 4단계: 프론트에서 받은 값 추출 (이미지 + 언어/국가만)
  const { imageData, mimeType, lang, country } = requestBody;

  if (!imageData || !mimeType) {
    return new Response(JSON.stringify({ error: { message: 'Missing image data.' } }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  // ✅ API 키 확인
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: 'API key is missing.' } }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  // ✅ 5단계: 프롬프트를 백엔드에서 직접 조립 (핵심 보안)
  const currentLang = lang || 'en';
  const userCountry = country || 'Unknown';

  const promptText = `
[You are an expert OCR and translation AI system for a restaurant menu app. Your task is to extract all data from the provided menu image and format it into strict JSON.]

[CONTEXT]
- User's language: ${currentLang}
- User's current country: ${userCountry}

[CRITICAL OUTPUT RULE: STRICT JSON ONLY]
You MUST output your response ONLY as a raw, valid JSON object.
Do NOT wrap the JSON in markdown blocks (e.g., do not use \`\`\`json or \`\`\`).
Do NOT output any other text, HTML, or explanations outside the JSON object.

[Exception Handling Rules] (Check this first)
If the photo uploaded is not a menu or unrelated to food:
Return EXACTLY this JSON: {"status": "error", "errorCode": "INVALID_IMAGE", "restaurantNotices": [], "categories": []}
If the photo is too blurry to read:
Return EXACTLY this JSON: {"status": "error", "errorCode": "BLURRY_IMAGE", "restaurantNotices": [], "categories": []}

[Output JSON Schema]
{
  "status": "success",
  "restaurantNotices": ["Notice 1", "Notice 2"],
  "categories": [
    {
      "categoryName": "Translated category name in ${currentLang}",
      "items": [
        {
          "originalName": "Original text exactly as written",
          "translatedName": "Short intuitive translation in ${currentLang}",
          "serving": "Weight or serving size",
          "prices": [
            {
              "label": "Translated label in ${currentLang} or empty string",
              "price": "Price with currency symbol"
            }
          ],
          "description": "Short description in ${currentLang}",
          "allergens": ["Allergen 1", "Allergen 2"],
          "isSoldOut": false,
          "options": [
            {
              "optionGroupName": "Translated option group name in ${currentLang}",
              "choices": [
                { "label": "Translated choice name in ${currentLang}", "additionalPrice": "+$1.00 or empty string if free" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

[Field Specific Guidelines]

1. OCR & Reading Rules
- Menus may be written in any language, script direction (left-to-right, right-to-left, vertical), or mixed scripts.
- Preserve all original characters exactly — never romanize, simplify, or substitute characters from the source script.
- Always match prices to their correct corresponding items accurately.
- Never fabricate or infer any information not explicitly written on the menu.
- Exception: The "description" field is the only field where AI-generated inference is permitted, as it is not OCR data but a user-facing summary.
- Use ${userCountry} to understand cultural context (e.g., course structure, menu conventions, price formats common in that country).
- If a menu item has a sold-out marking (e.g., sticker, crossed-out text, "품절", "売り切れ", "SOLD OUT"), set isSoldOut to true.

2. restaurantNotices
- Put ALL non-food text found anywhere on the menu here (e.g., minimum order, origin of ingredients, Wi-Fi password, tax info, business hours, surcharges).
- Translate each notice into a separate string in ${currentLang}.
- CRITICAL: If ordering rules or restrictions exist (e.g., minimum order, mandatory side dish charge), you MUST place them FIRST in the array (index 0).
- If no such restrictions exist, simply list notices in their original order.
- Return empty array [] ONLY if there are no non-food notices anywhere on the menu.

3. originalName
- DO NOT truncate or modify under any circumstances.
- Must contain the FULL exact raw text as written on the menu, including origin, weight, and options if written together (e.g., "갈비살 (호주산) 1인분 200g").

4. translatedName
- Write a short, intuitive translated name ONLY in ${currentLang}.
- Character-based scripts (Korean, Japanese, Chinese): within 10 characters.
- Other languages: within 4~5 words.
- DO NOT include weight, serving size, or origin here. Those go in the serving field.

5. serving
- Extract ONLY weight or serving size information (e.g., "200g", "1 serving / 200g", "2 portions").
- If no weight or serving size is written on the menu, return empty string "".

6. prices
- Output each price as an object with "label" and "price" fields.
- label: Translate the price type into ${currentLang} (e.g., "Small", "Lunch", "Set", "Add item"). If there is only one price and no specific condition, leave it as an empty string "".
- price: Preserve the original currency symbol exactly as written on the menu. Do NOT convert or reformat currency.
- If price is not listed (e.g., "시가", "時価", "MP", "Market Price", "문의"), translate "Market Price" into ${currentLang} and put it in the price field. Set label to "".

7. description
- Write ONLY 1 concise sentence in ${currentLang}. Maximum 15 words (for character-based scripts such as Korean, Japanese, Chinese, Arabic, Thai: within 30 characters).
- Focus on the main ingredient and cooking method only. No flowery rhetoric.
- MUST be an empty string "" for commercially mass-produced branded products (e.g., Soju, Beer, Makgeolli, Coca-Cola, canned/bottled drinks sold at convenience stores). Homemade or cafe-made drinks MUST have a description.

8. allergens
- Extract ONLY allergens that are EXPLICITLY written on the menu into the array.
- Translate all allergen names into ${currentLang} (e.g., "땅콩" → "peanuts" if currentLang is English).
- DO NOT infer, assume, or guess allergens that are not written.
- Return empty array [] if none are written.
- DO NOT include allergy information inside the description field.

9. isSoldOut
- Default is false.
- Set to true ONLY if a sold-out marking is explicitly visible on the menu item.

10. options
- Extract ONLY option groups explicitly written on the menu (e.g., size, sauce, toppings).
- Translate all labels and group names into ${currentLang}.
- additionalPrice: include only if an extra charge is explicitly written. Otherwise empty string "".
- Return empty array [] if no options are written on the menu.
`;

  // ✅ 6단계: Gemini 요청 바디를 백엔드에서 직접 조립
  const geminiBody = {
    contents: [{
      parts: [
        { text: promptText },
        { inline_data: { mime_type: mimeType, data: imageData } }
      ]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      maxOutputTokens: 8192
    }
  };

  // ✅ 7단계: Gemini API 호출
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody)
    });
    const rawText = await response.text();
    return new Response(rawText, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: { message: error.message || 'Server error' } }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
