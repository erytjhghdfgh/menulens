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

First, determine the menu style:
- small detailed menu
- large menu with many items
- course menu
- photo-heavy menu
- simple price-list menu

Then adapt the output style:
- For small menus: detailed traveler-friendly cards
- For large menus: short list format
- For photo-heavy menus: short list format
- For course menus: detailed traveler-friendly cards
- For simple price-list menus: short list format

Before listing menu items, output menu metadata in this exact format:

---MENU_META_START---
**MenuStyle:** one of the following only
- small detailed menu
- large menu with many items
- course menu
- photo-heavy menu
- simple price-list menu
---MENU_META_END---

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
**Taste:** Summarize the likely taste and texture in one short sentence in "${userLanguage}". If unclear or unnecessary, write "None".
**Recommendation:** Classify for a traveler in one short phrase in "${userLanguage}". Examples: "무난한 편", "현지 느낌 강함", "도전적인 메뉴", "처음 먹는 사람은 호불호 가능".
**ServingStyle:** Explain briefly how it is usually served or eaten in "${userLanguage}". If unclear or unnecessary, write "None".
**Warning:** Mention important allergy risks, religious concerns, alcohol-based sauce possibility, unusual ingredients, or strong preference issues. If none, write "None".
**Tags:** Relevant emojis that match the dish and its vibe.
---CARD_END---

Extra guidance:
- Good description example: what it is + how it tastes + whether it is beginner-friendly.
- For unusual local dishes like frog legs, snails, organ meat, very strong cheese, jellyfish, or fermented dishes, mention that they may feel adventurous for some travelers.
- For familiar dishes, say they are relatively approachable.
- Do not repeat the same kind of explanation too mechanically across every item.
- For large menus, keep each item shorter and simpler.
- Only mention Taste or ServingStyle if it adds real value.
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

function extractField(text, fieldName, fallback = 'None') {
    const match = text.match(new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.*)`));
    return match?.[1]?.trim() || fallback;
}

function cleanSubtitleText(subtitles) {
    if (!subtitles || subtitles === 'None') return 'None';

    let cleaned = subtitles.replace(/\s+/g, ' ').trim();

    if (cleaned.length > 70) {
        cleaned = cleaned.slice(0, 70) + '...';
    }

    const weirdMixCount = (cleaned.match(/[()]/g) || []).length;
    if (weirdMixCount >= 4 || cleaned.length > 90) {
        return 'None';
    }

    return cleaned;
}

function shouldShowBlock(text) {
    if (!text) return false;
    const value = text.trim();
    return value !== '' && value !== 'None';
}

async function buildPriceDisplay(priceRaw, currencyCode) {
    let priceDisplay = `<div class="price" style="color:#999; font-size:0.9rem;">가격 정보 없음</div>`;

    if (priceRaw === 'None') return priceDisplay;

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

    return priceDisplay;
}

function getMenuStyle(rawText) {
    const menuMetaMatch = rawText.match(/---MENU_META_START---([\s\S]*?)---MENU_META_END---/);
    if (!menuMetaMatch) return 'small detailed menu';

    const metaText = menuMetaMatch[1];
    return extractField(metaText, 'MenuStyle', 'small detailed menu');
}

function isCompactMenuStyle(menuStyle) {
    return (
        menuStyle === 'large menu with many items' ||
        menuStyle === 'photo-heavy menu' ||
        menuStyle === 'simple price-list menu'
    );
}

function buildCompactDescription(desc, taste, servingStyle) {
    const pieces = [];

    if (shouldShowBlock(desc)) pieces.push(desc);
    if (shouldShowBlock(taste)) pieces.push(taste);
    if (shouldShowBlock(servingStyle)) pieces.push(servingStyle);

    if (pieces.length === 0) return '';

    return pieces[0];
}

function buildDetailedInfoBlocks(desc, taste, servingStyle) {
    let infoBlocks = '';

    if (shouldShowBlock(desc)) {
        infoBlocks += `
            <div style="background:#f8f9fa; border-radius:10px; padding:12px 14px; margin-top:10px;">
                <div style="font-size:0.78rem; font-weight:800; color:#666; margin-bottom:6px;">이 음식은?</div>
                <div style="font-size:0.92rem; color:#444; line-height:1.6;">${desc}</div>
            </div>
        `;
    }

    if (shouldShowBlock(taste)) {
        infoBlocks += `
            <div style="background:#f8f9fa; border-radius:10px; padding:12px 14px; margin-top:10px;">
                <div style="font-size:0.78rem; font-weight:800; color:#666; margin-bottom:6px;">맛 / 식감</div>
                <div style="font-size:0.92rem; color:#444; line-height:1.6;">${taste}</div>
            </div>
        `;
    }

    if (shouldShowBlock(servingStyle)) {
        infoBlocks += `
            <div style="background:#f8f9fa; border-radius:10px; padding:12px 14px; margin-top:10px;">
                <div style="font-size:0.78rem; font-weight:800; color:#666; margin-bottom:6px;">여행자 팁</div>
                <div style="font-size:0.92rem; color:#444; line-height:1.6;">${servingStyle}</div>
            </div>
        `;
    }

    return infoBlocks;
}

async function parseAndRender(rawText) {
    loading.style.display = 'none';
    disclaimer.style.display = 'block';
    resultContainer.style.display = 'flex';
    resultContainer.innerHTML = '';

    const menuStyle = getMenuStyle(rawText);
    const compactMode = isCompactMenuStyle(menuStyle);

    const cardTexts = rawText.split('---CARD_START---').filter(text => text.trim() !== '');

    for (const cardText of cardTexts) {
        const cleanedText = cardText.split('---CARD_END---')[0].trim();

        const titleOriginal = extractField(cleanedText, 'OriginalName', 'Unknown');
        const subtitles = extractField(cleanedText, 'Subtitles', 'None');
        const titleTranslated = extractField(cleanedText, 'TranslatedName', '');
        const currencyCode = extractField(cleanedText, 'CurrencyCode', 'Unknown');
        const priceRaw = extractField(cleanedText, 'Price', 'None');
        const desc = extractField(cleanedText, 'Description', 'None');
        const taste = extractField(cleanedText, 'Taste', 'None');
        const recommendation = extractField(cleanedText, 'Recommendation', 'None');
        const servingStyle = extractField(cleanedText, 'ServingStyle', 'None');
        const warning = extractField(cleanedText, 'Warning', 'None');
        const tags = extractField(cleanedText, 'Tags', '');

        const cleanedSubtitle = cleanSubtitleText(subtitles);
        const priceDisplay = await buildPriceDisplay(priceRaw, currencyCode);

        const subtitlesDisplay = cleanedSubtitle !== 'None'
            ? `<div style="font-size:0.82rem; color:#888; margin-bottom:8px; line-height:1.4;">${cleanedSubtitle}</div>`
            : '';

        const recommendationBadge = recommendation !== 'None'
            ? `<div style="display:inline-block; background-color:#fff3e0; color:#e65100; font-size:0.82rem; font-weight:700; padding:6px 10px; border-radius:999px; margin-bottom:12px;">${recommendation}</div>`
            : '';

        const warningDisplay = warning !== 'None'
            ? `<div class="warning">⚠️ 주의: ${warning}</div>`
            : '';

        const compactDescription = buildCompactDescription(desc, taste, servingStyle);
        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(titleOriginal + ' dish')}`;

        const cardDiv = document.createElement('div');
        cardDiv.className = 'menu-card';

        if (compactMode) {
            cardDiv.innerHTML = `
                <div class="title-ko">${titleOriginal}</div>
                ${subtitlesDisplay}
                ${titleTranslated ? `<div class="title-translated">${titleTranslated}</div>` : ''}
                ${priceDisplay}
                ${recommendationBadge}
                ${warningDisplay}
                ${compactDescription ? `<div class="desc" style="margin-top:6px;">${compactDescription}</div>` : ''}
                <div class="card-footer">
                    ${tags ? `<div class="tags">${tags}</div>` : '<div></div>'}
                    <a href="${searchUrl}" target="_blank" class="search-image-btn">🔍 사진 보기</a>
                </div>
            `;
        } else {
            const infoBlocks = buildDetailedInfoBlocks(desc, taste, servingStyle);

            cardDiv.innerHTML = `
                <div class="title-ko">${titleOriginal}</div>
                ${subtitlesDisplay}
                ${titleTranslated ? `<div class="title-translated">${titleTranslated}</div>` : ''}
                ${priceDisplay}
                ${recommendationBadge}
                ${warningDisplay}
                ${infoBlocks}
                <div class="card-footer">
                    ${tags ? `<div class="tags">${tags}</div>` : '<div></div>'}
                    <a href="${searchUrl}" target="_blank" class="search-image-btn">🔍 사진 보기</a>
                </div>
            `;
        }

        resultContainer.appendChild(cardDiv);
    }
}

// ==========================================
// 🌍 4. 다국어 UI (글로벌 Top 15 언어 지원)
// ==========================================
const uiTranslations = {
    'ko': {
        title: "MenuLens 🔍",
        slogan: "메뉴판을 카메라로 찍으면 정보를 알려드립니다.",
        btn: "메뉴 사진 찍기",
        loading: "AI가 메뉴를 분석하고 있어요... ⏳",
        disclaimer: "💡 설명은 참고용이며, 실제 식당 요리와 다를 수 있습니다."
    },
    'en': {
        title: "MenuLens 🔍",
        slogan: "Take a photo of the menu to get details.",
        btn: "Take a Photo",
        loading: "AI is analyzing the menu... ⏳",
        disclaimer: "💡 Descriptions are for reference only and may vary."
    },
    'ja': {
        title: "MenuLens 🔍",
        slogan: "メニューの写真を撮ると情報が表示されます。",
        btn: "写真を撮る",
        loading: "AIがメニューを分析しています... ⏳",
        disclaimer: "💡 説明は参考用であり、実際の料理と異なる場合があります。"
    },
    'zh': {
        title: "MenuLens 🔍",
        slogan: "拍下菜单照片即可获取详细信息。",
        btn: "拍下菜单",
        loading: "AI 正在分析菜单... ⏳",
        disclaimer: "💡 说明仅供参考，可能与实际菜品有所不同。"
    },
    'es': {
        title: "MenuLens 🔍",
        slogan: "Toma una foto del menú para ver los detalles.",
        btn: "Tomar una foto",
        loading: "La IA está analizando el menú... ⏳",
        disclaimer: "💡 Las descripciones son solo de referencia."
    },
    'fr': {
        title: "MenuLens 🔍",
        slogan: "Prenez une photo du menu pour obtenir des détails.",
        btn: "Prendre une photo",
        loading: "L'IA analyse le menu... ⏳",
        disclaimer: "💡 Les descriptions sont fournies à titre indicatif."
    },
    'de': {
        title: "MenuLens 🔍",
        slogan: "Machen Sie ein Foto der Speisekarte für Details.",
        btn: "Foto machen",
        loading: "KI analysiert das Menü... ⏳",
        disclaimer: "💡 Beschreibungen dienen nur als Referenz."
    },
    'th': {
        title: "MenuLens 🔍",
        slogan: "ถ่ายรูปเมนูเพื่อดูรายละเอียด",
        btn: "ถ่ายรูปเมนู",
        loading: "AI กำลังวิเคราะห์เมนู... ⏳",
        disclaimer: "💡 คำอธิบายมีไว้เพื่อการอ้างอิงเท่านั้น"
    },
    'vi': {
        title: "MenuLens 🔍",
        slogan: "Chụp ảnh thực đơn để xem chi tiết.",
        btn: "Chụp ảnh",
        loading: "AI đang phân tích thực đơn... ⏳",
        disclaimer: "💡 Mô tả chỉ mang tính tham khảo."
    },
    'id': {
        title: "MenuLens 🔍",
        slogan: "Ambil foto menu untuk melihat detail.",
        btn: "Ambil Foto",
        loading: "AI sedang menganalisis menu... ⏳",
        disclaimer: "💡 Deskripsi hanya untuk referensi."
    },
    'ar': {
        title: "MenuLens 🔍",
        slogan: "التقط صورة للقائمة للحصول على التفاصيل.",
        btn: "التقط صورة",
        loading: "الذكاء الاصطناعي يحلل القائمة... ⏳",
        disclaimer: "💡 الأوصاف للرجوع إليها فقط وقد تختلف."
    },
    'hi': {
        title: "MenuLens 🔍",
        slogan: "विवरण प्राप्त करने के लिए मेनू की एक तस्वीर लें।",
        btn: "तस्वीर लें",
        loading: "AI मेनू का विश्लेषण कर रहा है... ⏳",
        disclaimer: "💡 विवरण केवल संदर्भ के लिए हैं।"
    },
    'it': {
        title: "MenuLens 🔍",
        slogan: "Scatta una foto del menu per i dettagli.",
        btn: "Scatta una foto",
        loading: "L'IA sta analizzando il menu... ⏳",
        disclaimer: "💡 Le descrizioni sono solo di riferimento."
    },
    'pt': {
        title: "MenuLens 🔍",
        slogan: "Tire uma foto do menu para ver os detalhes.",
        btn: "Tirar uma foto",
        loading: "A IA está analisando o menu... ⏳",
        disclaimer: "💡 As descrições são apenas para referência."
    },
    'ru': {
        title: "MenuLens 🔍",
        slogan: "Сделайте фото меню, чтобы узнать подробности.",
        btn: "Сделать фото",
        loading: "ИИ анализирует меню... ⏳",
        disclaimer: "💡 Описания приведены только для справки."
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
