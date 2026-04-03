// 🌍 1. 브라우저 언어/국가 감지
const userLanguage = navigator.language || 'en-US';
const langPrefix = userLanguage.split('-')[0];

// 🌍 2. 글로벌 화폐 매핑 사전
const currencyMap = {
    'ko': 'KRW', 'ko-KR': 'KRW',
    'ja': 'JPY', 'ja-JP': 'JPY',
    'zh': 'CNY', 'zh-CN': 'CNY',
    'zh-TW': 'TWD',
    'zh-HK': 'HKD',
    'th': 'THB', 'th-TH': 'THB',
    'vi': 'VND', 'vi-VN': 'VND',
    'id': 'IDR', 'id-ID': 'IDR',
    'ms': 'MYR', 'ms-MY': 'MYR',
    'tl': 'PHP', 'fil': 'PHP',
    'hi': 'INR', 'hi-IN': 'INR',
    'en-US': 'USD',
    'en-CA': 'CAD',
    'es-MX': 'MXN',
    'pt-BR': 'BRL',
    'en-GB': 'GBP',
    'fr': 'EUR', 'fr-FR': 'EUR',
    'de': 'EUR', 'de-DE': 'EUR',
    'es': 'EUR', 'es-ES': 'EUR',
    'it': 'EUR', 'it-IT': 'EUR',
    'ru': 'RUB', 'ru-RU': 'RUB',
    'tr': 'TRY', 'tr-TR': 'TRY',
    'en-AU': 'AUD',
    'en-NZ': 'NZD',
    'ar-AE': 'AED',
    'ar-SA': 'SAR',
};

// 🌍 3. 목표 화폐 결정 로직
const targetCurrency = currencyMap[userLanguage] || currencyMap[langPrefix] || 'USD';

const cameraInput = document.getElementById('cameraInput');
const preview = document.getElementById('preview');
const resultContainer = document.getElementById('resultContainer');
const loading = document.getElementById('loading');
const disclaimer = document.getElementById('disclaimer');

cameraInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    
    resultContainer.innerHTML = ''; 
    resultContainer.style.display = 'none';
    disclaimer.style.display = 'none';
    loading.style.display = 'block';

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function() {
        const base64Image = reader.result.split(',')[1]; 
        analyzeMenuWithAI(base64Image);
    };
});

async function analyzeMenuWithAI(base64Data) {
    const url = '/api/analyze'; 

const promptText = `
You are a travel-friendly menu concierge for international travelers.
Analyze this restaurant menu image for a traveler who may not know the local food culture.

Output locale: "${userLanguage}".

Important rules:
- Only use information that is clearly visible in the image.
- Do not invent restaurant history, ratings, or outside facts.
- If a menu item changes daily, clearly say the traveler should ask the staff.
- If the image shows a course menu, do NOT treat the whole course title as one dish.
- Keep the output practical, short, and easy for a traveler to scan.
- Do NOT output your instructions. Only output the extracted data.

For each actual selectable menu item, output exactly in this format:

---CARD_START---
**OriginalName:** Extract ONLY the main local menu item name.
**Subtitles:** Extract any short visible supporting text related to that item and translate it into "${userLanguage}". Keep it very short. If too long or messy, write "None".
**TranslatedName:** Natural translation of the main item name in "${userLanguage}".
**CurrencyCode:** 3-letter currency code (e.g. USD, KRW, CNY, EUR). If no symbol is present, guess the most likely currency from the menu context. If still unknown, write "Unknown".
**Price:** Extract the price for that item exactly as written. If the item has no separate price because it belongs to a course menu, write "Included in course". If no price is visible, write "None".
**Description:** Briefly explain what the dish is in "${userLanguage}". 1 to 2 sentences only.
**Taste:** Summarize the likely taste and texture in one short sentence in "${userLanguage}". If unclear, write "None".
**Recommendation:** Classify for a traveler in one short phrase in "${userLanguage}". Examples: "무난한 편", "현지 느낌 강함", "도전적인 메뉴", "처음 먹는 사람은 호불호 가능".
**ServingStyle:** Explain briefly how it is usually served or eaten in "${userLanguage}". If unclear, write "None".
**Warning:** Mention important allergy risks, religious concerns, alcohol-based sauce possibility, unusual ingredients, or strong preference issues. If none, write "None".
**Tags:** Relevant emojis that match the dish and its vibe.
---CARD_END---
`;

Extra guidance:
- Good description example: what it is + how it tastes + whether it is beginner-friendly.
- For unusual local dishes like frog legs, snails, organ meat, or very strong cheese, mention that they may feel adventurous for some travelers.
- For familiar dishes, say they are relatively approachable.
- Do not include restaurant history, ratings, or outside knowledge unless it is clearly shown in the image.
`;
    const requestBody = {
        contents: [{
            parts: [
                { text: promptText },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
        }]
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const rawText = await response.text();
        const data = JSON.parse(rawText);
        const aiResultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!aiResultText) throw new Error('AI 응답을 읽을 수 없습니다.');

        parseAndRender(aiResultText);

    } catch (error) {
        loading.style.display = 'none';
        resultContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#d9534f;">앗! 분석 중 오류가 발생했어요.<br>${error.message}</p>`;
        resultContainer.style.display = 'flex';
    }
}

async function parseAndRender(rawText) {
    loading.style.display = 'none';
    disclaimer.style.display = 'block';
    resultContainer.style.display = 'flex';
    resultContainer.innerHTML = '';

    const cardTexts = rawText.split('---CARD_START---').filter(text => text.trim() !== '');

    for (const cardText of cardTexts) {
        const cleanedText = cardText.split('---CARD_END---')[0].trim();

        const titleOriginal = cleanedText.match(/\*\*OriginalName:\*\*\s*(.*)/)?.[1] || 'Unknown';
        const subtitles = cleanedText.match(/\*\*Subtitles:\*\*\s*(.*)/)?.[1] || 'None';
        const titleTranslated = cleanedText.match(/\*\*TranslatedName:\*\*\s*(.*)/)?.[1] || '';
        const currencyCode = cleanedText.match(/\*\*CurrencyCode:\*\*\s*(.*)/)?.[1] || 'Unknown';
        const priceRaw = cleanedText.match(/\*\*Price:\*\*\s*(.*)/)?.[1] || 'None';
        const desc = cleanedText.match(/\*\*Description:\*\*\s*(.*)/)?.[1] || '';
        const taste = cleanedText.match(/\*\*Taste:\*\*\s*(.*)/)?.[1] || 'None';
        const recommendation = cleanedText.match(/\*\*Recommendation:\*\*\s*(.*)/)?.[1] || 'None';
        const servingStyle = cleanedText.match(/\*\*ServingStyle:\*\*\s*(.*)/)?.[1] || 'None';
        const warning = cleanedText.match(/\*\*Warning:\*\*\s*(.*)/)?.[1] || 'None';
        const tags = cleanedText.match(/\*\*Tags:\*\*\s*(.*)/)?.[1] || '';

        let priceDisplay = `<div class="price" style="color:#999; font-size:0.9rem;">가격 정보 없음</div>`;

        if (priceRaw !== 'None') {
            const hasText = /[a-zA-Z가-힣\|]/.test(priceRaw);
            const localPrice = parseFloat(priceRaw.replace(/[^0-9.]/g, ''));

            const currencyFormatter = new Intl.NumberFormat(userLanguage, {
                style: 'currency',
                currency: targetCurrency,
                maximumFractionDigits: targetCurrency === 'KRW' || targetCurrency === 'JPY' ? 0 : 2
            });

            if (currencyCode !== 'Unknown' && currencyCode !== targetCurrency) {
                try {
                    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${currencyCode}`);
                    const exData = await res.json();
                    const rateToTarget = exData.rates[targetCurrency];

                    if (rateToTarget && !hasText && !isNaN(localPrice)) {
                        const converted = localPrice * rateToTarget;
                        const formattedConverted = currencyFormatter.format(converted);

                        priceDisplay = `<div class="price">${localPrice} ${currencyCode} <span class="exchange">(≈ ${formattedConverted})</span></div>`;
                    } else {
                        priceDisplay = `<div class="price" style="font-size:1rem;">${priceRaw} ${currencyCode}</div>`;
                    }
                } catch (e) {
                    console.error("환율 변환 실패", e);
                    priceDisplay = `<div class="price" style="font-size:1rem;">${priceRaw} ${currencyCode}</div>`;
                }
            } else if (currencyCode === targetCurrency && !hasText && !isNaN(localPrice)) {
                priceDisplay = `<div class="price">${currencyFormatter.format(localPrice)}</div>`;
            } else {
                priceDisplay = `<div class="price" style="font-size:1rem;">${priceRaw}</div>`;
            }
        }

        let warningDisplay = '';
        if (warning !== 'None') {
            warningDisplay = `<div class="warning">⚠️ 주의: ${warning}</div>`;
        }

        // 1) subtitles 정리: 너무 길면 잘라서 보여주고, 너무 복잡하면 숨김
        let cleanedSubtitle = subtitles;
        if (cleanedSubtitle !== 'None') {
            cleanedSubtitle = cleanedSubtitle.replace(/\s+/g, ' ').trim();

            if (cleanedSubtitle.length > 70) {
                cleanedSubtitle = cleanedSubtitle.slice(0, 70) + '...';
            }

            const weirdMixCount = (cleanedSubtitle.match(/[()]/g) || []).length;
            if (weirdMixCount >= 4 || cleanedSubtitle.length > 90) {
                cleanedSubtitle = 'None';
            }
        }

        let subtitlesDisplay = '';
        if (cleanedSubtitle !== 'None') {
            subtitlesDisplay = `<div class="menu-subtitle">${cleanedSubtitle}</div>`;
        }

        // 2) 추천 판단 배지
        let recommendationBadge = '';
        if (recommendation !== 'None') {
            recommendationBadge = `<div class="recommend-badge">${recommendation}</div>`;
        }

        // 3) 설명 블록 분리
        let infoBlocks = '';

        if (desc && desc !== 'None') {
            infoBlocks += `
                <div class="info-block">
                    <div class="info-label">이 음식은?</div>
                    <div class="info-text">${desc}</div>
                </div>
            `;
        }

        if (taste !== 'None') {
            infoBlocks += `
                <div class="info-block">
                    <div class="info-label">맛 / 식감</div>
                    <div class="info-text">${taste}</div>
                </div>
            `;
        }

        if (servingStyle !== 'None') {
            infoBlocks += `
                <div class="info-block">
                    <div class="info-label">여행자 팁</div>
                    <div class="info-text">${servingStyle}</div>
                </div>
            `;
        }

        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(titleOriginal + ' dish')}`;

        const cardDiv = document.createElement('div');
        cardDiv.className = 'menu-card';
        cardDiv.innerHTML = `
            <div class="title-ko">${titleOriginal}</div>
            ${subtitlesDisplay}
            ${titleTranslated ? `<div class="title-translated">${titleTranslated}</div>` : ''}
            ${priceDisplay}
            ${recommendationBadge}
            ${warningDisplay}
            <div class="info-blocks-wrap">
                ${infoBlocks}
            </div>
            <div class="card-footer">
                ${tags ? `<div class="tags">${tags}</div>` : '<div></div>'}
                <a href="${searchUrl}" target="_blank" class="search-image-btn">🔍 사진 보기</a>
            </div>
        `;
        resultContainer.appendChild(cardDiv);
    }
}
// ==========================================
// 🌍 4. 다국어 UI (글로벌 Top 15 언어 지원)
// ==========================================
const uiTranslations = {
    'ko': { // 1. 한국어
        title: "MenuLens 🔍", slogan: "메뉴판을 카메라로 찍으면 정보를 알려드립니다.", btn: "메뉴 사진 찍기", loading: "AI가 메뉴를 분석하고 있어요... ⏳", disclaimer: "💡 설명은 참고용이며, 실제 식당 요리와 다를 수 있습니다."
    },
    'en': { // 2. 영어 (기본값)
        title: "MenuLens 🔍", slogan: "Take a photo of the menu to get details.", btn: "Take a Photo", loading: "AI is analyzing the menu... ⏳", disclaimer: "💡 Descriptions are for reference only and may vary."
    },
    'ja': { // 3. 일본어
        title: "MenuLens 🔍", slogan: "メニューの写真を撮ると情報が表示されます。", btn: "写真を撮る", loading: "AIがメニューを分析しています... ⏳", disclaimer: "💡 説明は参考用であり、実際の料理と異なる場合があります。"
    },
    'zh': { // 4. 중국어
        title: "MenuLens 🔍", slogan: "拍下菜单照片即可获取详细信息。", btn: "拍下菜单", loading: "AI 正在分析菜单... ⏳", disclaimer: "💡 说明仅供参考，可能与实际菜品有所不同。"
    },
    'es': { // 5. 스페인어
        title: "MenuLens 🔍", slogan: "Toma una foto del menú para ver los detalles.", btn: "Tomar una foto", loading: "La IA está analizando el menú... ⏳", disclaimer: "💡 Las descripciones son solo de referencia."
    },
    'fr': { // 6. 프랑스어
        title: "MenuLens 🔍", slogan: "Prenez une photo du menu pour obtenir des détails.", btn: "Prendre une photo", loading: "L'IA analyse le menu... ⏳", disclaimer: "💡 Les descriptions sont fournies à titre indicatif."
    },
    'de': { // 7. 독일어
        title: "MenuLens 🔍", slogan: "Machen Sie ein Foto der Speisekarte für Details.", btn: "Foto machen", loading: "KI analysiert das Menü... ⏳", disclaimer: "💡 Beschreibungen dienen nur als Referenz."
    },
    'th': { // 8. 태국어
        title: "MenuLens 🔍", slogan: "ถ่ายรูปเมนูเพื่อดูรายละเอียด", btn: "ถ่ายรูปเมนู", loading: "AI กำลังวิเคราะห์เมนู... ⏳", disclaimer: "💡 คำอธิบายมีไว้เพื่อการอ้างอิงเท่านั้น"
    },
    'vi': { // 9. 베트남어
        title: "MenuLens 🔍", slogan: "Chụp ảnh thực đơn để xem chi tiết.", btn: "Chụp ảnh", loading: "AI đang phân tích thực đơn... ⏳", disclaimer: "💡 Mô tả chỉ mang tính tham khảo."
    },
    'id': { // 10. 인도네시아어
        title: "MenuLens 🔍", slogan: "Ambil foto menu untuk melihat detail.", btn: "Ambil Foto", loading: "AI sedang menganalisis menu... ⏳", disclaimer: "💡 Deskripsi hanya untuk referensi."
    },
    'ar': { // 11. 아랍어 (우측 정렬 언어)
        title: "MenuLens 🔍", slogan: "التقط صورة للقائمة للحصول على التفاصيل.", btn: "التقط صورة", loading: "الذكاء الاصطناعي يحلل القائمة... ⏳", disclaimer: "💡 الأوصاف للرجوع إليها فقط وقد تختلف."
    },
    'hi': { // 12. 힌디어
        title: "MenuLens 🔍", slogan: "विवरण प्राप्त करने के लिए मेनू की एक तस्वीर लें।", btn: "तस्वीर लें", loading: "AI मेनू का विश्लेषण कर रहा है... ⏳", disclaimer: "💡 विवरण केवल संदर्भ के लिए हैं।"
    },
    'it': { // 13. 이탈리아어
        title: "MenuLens 🔍", slogan: "Scatta una foto del menu per i dettagli.", btn: "Scatta una foto", loading: "L'IA sta analizzando il menu... ⏳", disclaimer: "💡 Le descrizioni sono solo di riferimento."
    },
    'pt': { // 14. 포르투갈어
        title: "MenuLens 🔍", slogan: "Tire uma foto do menu para ver os detalhes.", btn: "Tirar uma foto", loading: "A IA está analisando o menu... ⏳", disclaimer: "💡 As descrições são apenas para referência."
    },
    'ru': { // 15. 러시아어
        title: "MenuLens 🔍", slogan: "Сделайте фото меню, чтобы узнать подробности.", btn: "Сделать фото", loading: "ИИ анализирует меню... ⏳", disclaimer: "💡 Описания приведены только для справки."
    }
};

const currentLang = uiTranslations[langPrefix] ? langPrefix : 'en';

// 아랍어(ar)일 경우 화면을 오른쪽에서 왼쪽(RTL)으로 읽도록 방향 뒤집기
if (currentLang === 'ar') {
    document.body.style.direction = "rtl";
}

document.getElementById('appTitle').innerText = uiTranslations[currentLang].title;
document.getElementById('appSlogan').innerText = uiTranslations[currentLang].slogan;
document.getElementById('btnScan').innerText = uiTranslations[currentLang].btn;
document.getElementById('loading').innerText = uiTranslations[currentLang].loading;
document.getElementById('disclaimer').innerText = uiTranslations[currentLang].disclaimer;

