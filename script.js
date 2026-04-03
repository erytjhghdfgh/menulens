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

// ... (위쪽 1, 2, 3번 환율 및 기본 설정 코드는 기존 그대로 유지) ...

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

    // 💡 프롬프트 다이어트 완료: 불필요한 설명 빼고 JSON 스키마로 강제
    const promptText = `
Analyze this menu image for a traveler. Target language: "${userLanguage}".
Output ONLY in valid JSON format.

{
  "menu_style": "choose one: small detailed menu | large menu with many items | course menu | photo-heavy menu | simple price-list menu",
  "items": [
    {
      "originalName": "Main local name",
      "subtitles": "Short supporting text or 'None'",
      "translatedName": "Natural translation in ${userLanguage}",
      "currencyCode": "3-letter code or 'Unknown'",
      "price": "Exact price number, 'Included', or 'None'",
      "description": "1-2 sentence appetizing description",
      "taste": "1 sentence taste/texture summary or 'None'",
      "recommendation": "Short traveler recommendation phrase or 'None'",
      "servingStyle": "How it's served or 'None'",
      "warning": "Allergy/religious warnings or 'None'",
      "tags": "1-3 relevant emojis"
    }
  ]
}`;

    const requestBody = {
        contents: [{
            parts: [
                { text: promptText },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
        }],
        // 💡 API에 JSON 형식으로만 답하라고 강제 (오류 방지 및 토큰 절약)
        generationConfig: { response_mime_type: "application/json" } 
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

        // AI가 준 텍스트가 이미 완벽한 JSON 오브젝트이므로 바로 파싱
        const menuData = JSON.parse(aiResultText);
        parseAndRender(menuData);

    } catch (error) {
        loading.style.display = 'none';
        resultContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#d9534f;">앗! 분석 중 오류가 발생했어요.<br>${error.message}</p>`;
        resultContainer.style.display = 'flex';
    }
}

// 💡 더 이상 텍스트를 자를 필요가 없으므로 extractField, getMenuStyle 등의 함수는 삭제되었습니다.

function cleanSubtitleText(subtitles) {
    if (!subtitles || subtitles === 'None') return 'None';
    let cleaned = subtitles.replace(/\s+/g, ' ').trim();
    if (cleaned.length > 70) cleaned = cleaned.slice(0, 70) + '...';
    
    const weirdMixCount = (cleaned.match(/[()]/g) || []).length;
    if (weirdMixCount >= 4 || cleaned.length > 90) return 'None';
    return cleaned;
}

function shouldShowBlock(text) {
    if (!text) return false;
    const value = text.trim();
    return value !== '' && value !== 'None';
}

// 🌍 환율 로직은 건드리지 않고 그대로 유지!
async function buildPriceDisplay(priceRaw, currencyCode) {
    let priceDisplay = `<div class="price" style="color:#999; font-size:0.9rem;">가격 정보 없음</div>`;

    if (priceRaw === 'None') return priceDisplay;

    const hasText = /[a-zA-Z가-힣\|]/.test(priceRaw);
    const localPrice = parseFloat(priceRaw.toString().replace(/[^0-9.]/g, ''));

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
    let infoBlocks = '<div class="info-blocks-wrap">'; // CSS 클래스 활용

    if (shouldShowBlock(desc)) {
        infoBlocks += `
            <div class="info-block">
                <div class="info-label">이 음식은?</div>
                <div class="info-text">${desc}</div>
            </div>`;
    }
    if (shouldShowBlock(taste)) {
        infoBlocks += `
            <div class="info-block">
                <div class="info-label">맛 / 식감</div>
                <div class="info-text">${taste}</div>
            </div>`;
    }
    if (shouldShowBlock(servingStyle)) {
        infoBlocks += `
            <div class="info-block">
                <div class="info-label">여행자 팁</div>
                <div class="info-text">${servingStyle}</div>
            </div>`;
    }

    infoBlocks += '</div>';
    return infoBlocks === '<div class="info-blocks-wrap"></div>' ? '' : infoBlocks;
}

async function parseAndRender(menuData) {
    loading.style.display = 'none';
    disclaimer.style.display = 'block';
    resultContainer.style.display = 'flex';
    resultContainer.innerHTML = '';

    const menuStyle = menuData.menu_style || 'small detailed menu';
    const compactMode = isCompactMenuStyle(menuStyle);

    for (const item of menuData.items) {
        const cleanedSubtitle = cleanSubtitleText(item.subtitles);
        const priceDisplay = await buildPriceDisplay(item.price, item.currencyCode);

        // 하드코딩된 스타일 대신 CSS 클래스 사용
        const subtitlesDisplay = cleanedSubtitle !== 'None'
            ? `<div class="menu-subtitle">${cleanedSubtitle}</div>`
            : '';

        const recommendationBadge = (item.recommendation && item.recommendation !== 'None')
            ? `<div class="recommend-badge">${item.recommendation}</div>`
            : '';

        const warningDisplay = (item.warning && item.warning !== 'None')
            ? `<div class="warning">⚠️ 주의: ${item.warning}</div>`
            : '';

        const compactDescription = buildCompactDescription(item.description, item.taste, item.servingStyle);
        // 검색 쿼리에 타겟 언어를 추가하여 더 정확한 이미지 검색 유도
        const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(item.originalName + ' dish ' + targetCurrency.slice(0,2))}`;

        const cardDiv = document.createElement('div');
        cardDiv.className = 'menu-card';

        if (compactMode) {
            cardDiv.innerHTML = `
                <div class="title-ko">${item.originalName || 'Unknown'}</div>
                ${subtitlesDisplay}
                ${item.translatedName && item.translatedName !== 'None' ? `<div class="title-translated">${item.translatedName}</div>` : ''}
                ${priceDisplay}
                ${recommendationBadge}
                ${warningDisplay}
                ${compactDescription ? `<div class="desc">${compactDescription}</div>` : ''}
                <div class="card-footer">
                    ${item.tags && item.tags !== 'None' ? `<div class="tags">${item.tags}</div>` : '<div></div>'}
                    <a href="${searchUrl}" target="_blank" class="search-image-btn">🔍 사진 보기</a>
                </div>
            `;
        } else {
            const infoBlocks = buildDetailedInfoBlocks(item.description, item.taste, item.servingStyle);

            cardDiv.innerHTML = `
                <div class="title-ko">${item.originalName || 'Unknown'}</div>
                ${subtitlesDisplay}
                ${item.translatedName && item.translatedName !== 'None' ? `<div class="title-translated">${item.translatedName}</div>` : ''}
                ${priceDisplay}
                ${recommendationBadge}
                ${warningDisplay}
                ${infoBlocks}
                <div class="card-footer">
                    ${item.tags && item.tags !== 'None' ? `<div class="tags">${item.tags}</div>` : '<div></div>'}
                    <a href="${searchUrl}" target="_blank" class="search-image-btn">🔍 사진 보기</a>
                </div>
            `;
        }

        resultContainer.appendChild(cardDiv);
    }
}

// ... (아래 4번 다국어 UI 코드는 기존 그대로 유지) ...

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
