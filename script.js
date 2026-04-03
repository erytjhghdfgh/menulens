// 🌍 1. 브라우저 언어/국가 감지
const userLanguage = navigator.language || 'en-US';
const langPrefix = userLanguage.split('-')[0];

// 🌍 2. 글로벌 화폐 매핑 사전 (제가 실수로 지웠던 부분입니다 😭)
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

    // 💡 에러의 주범이었던 백틱 닫기 완료 + 비용 절감 & 친절한 가이드 프롬프트

    const promptText = `
You are a friendly local food guide helping a foreign traveler.
Look at the menu image and explain it to the traveler in "${userLanguage}". 

[Rules to save tokens and keep it friendly]
1. Do not write long paragraphs. Be conversational but extremely concise.

2. Start your response with a 1-2 sentence overview of how this menu works under the heading "### 📖 메뉴판 읽는 법". 
   - Explain if it is an à la carte menu, a set course (e.g., choose 1 appetizer + 1 main), tapas style for sharing, or a daily special board.

3. Extract ONLY the actual food/drink items explicitly visible on the menu. For each item, use this exact format:

### 🍽️ [Original Name] 
* **어떤 요리인가요?**: [Translated Name] / [Brief 1-sentence description including main ingredients]
* **맛과 식감**: [1 sentence summarizing taste and texture]
* **가격**: [Original Price and Currency] ([환율 계산해보기](https://www.google.com/search?q=[Original+Price]+[Original+Currency]+to+${targetCurrency}))
* **여행자 팁**: [Include ONLY IF there is a unique way to eat it or cultural context. If ordinary, completely OMIT this line]
* **⚠️ 주의 사항**: [Include ONLY IF there are allergens, organ meats, strong spices, or polarizing ingredients. If none, completely OMIT this line]

[Important Constraint] Only list items clearly visible on the menu. Do not invent items. Output the response ONLY in Markdown format. 
`;


    const requestBody = {
        contents: [{
            parts: [
                { text: promptText },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
            ]
        }]
        // 💡 JSON이 아니라 자연스러운 글(Markdown)로 받아야 하므로 강제 옵션을 삭제했습니다.
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

        // 💡 복잡한 JSON 파싱 대신 마크다운 렌더링 함수 호출
        renderStoryMode(aiResultText);

    } catch (error) {
        loading.style.display = 'none';
        resultContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#d9534f;">앗! 분석 중 오류가 발생했어요.<br>${error.message}</p>`;
        resultContainer.style.display = 'block';
    }
}

// 💡 마크다운을 화면에 예쁘게 그려주는 함수
function renderStoryMode(markdownText) {
    loading.style.display = 'none';
    disclaimer.style.display = 'block';
    resultContainer.style.display = 'block';
    
    // marked.js 라이브러리가 AI의 글을 HTML로 자동 변환해 줍니다.
    resultContainer.innerHTML = `
        <div class="markdown-body">
            ${marked.parse(markdownText)}
        </div>
    `;
}

// ==========================================
// 🌍 4. 다국어 UI (글로벌 Top 15 언어 지원)
// ==========================================
const uiTranslations = {
    'ko': { title: "MenuLens 🔍", slogan: "메뉴판을 카메라로 찍으면 정보를 알려드립니다.", btn: "메뉴 사진 찍기", loading: "AI가 메뉴를 분석하고 있어요... ⏳", disclaimer: "💡 설명은 참고용이며, 실제 식당 요리와 다를 수 있습니다." },
    'en': { title: "MenuLens 🔍", slogan: "Take a photo of the menu to get details.", btn: "Take a Photo", loading: "AI is analyzing the menu... ⏳", disclaimer: "💡 Descriptions are for reference only and may vary." },
    'ja': { title: "MenuLens 🔍", slogan: "メニューの写真を撮ると情報が表示されます。", btn: "写真を撮る", loading: "AIがメニューを分析しています... ⏳", disclaimer: "💡 説明は参考用であり、実際の料理と異なる場合があります。" },
    'zh': { title: "MenuLens 🔍", slogan: "拍下菜单照片即可获取详细信息。", btn: "拍下菜单", loading: "AI 正在分析菜单... ⏳", disclaimer: "💡 说明仅供参考，可能与实际菜品有所不同。" },
    'es': { title: "MenuLens 🔍", slogan: "Toma una foto del menú para ver los detalles.", btn: "Tomar una foto", loading: "La IA está analizando el menú... ⏳", disclaimer: "💡 Las descripciones son solo de referencia." },
    'fr': { title: "MenuLens 🔍", slogan: "Prenez une photo du menu pour obtenir des détails.", btn: "Prendre une photo", loading: "L'IA analyse le menu... ⏳", disclaimer: "💡 Les descriptions sont fournies à titre indicatif." },
    'de': { title: "MenuLens 🔍", slogan: "Machen Sie ein Foto der Speisekarte für Details.", btn: "Foto machen", loading: "KI analysiert das Menü... ⏳", disclaimer: "💡 Beschreibungen dienen nur als Referenz." },
    'th': { title: "MenuLens 🔍", slogan: "ถ่ายรูปเมนูเพื่อดูรายละเอียด", btn: "ถ่ายรูปเมนู", loading: "AI กำลังวิเคราะห์เมนู... ⏳", disclaimer: "💡 คำอธิบายมีไว้เพื่อการอ้างอิงเท่านั้น" },
    'vi': { title: "MenuLens 🔍", slogan: "Chụp ảnh thực đơn để xem chi tiết.", btn: "Chụp ảnh", loading: "AI đang phân tích thực đơn... ⏳", disclaimer: "💡 Mô tả chỉ mang tính tham khảo." },
    'id': { title: "MenuLens 🔍", slogan: "Ambil foto menu untuk melihat detail.", btn: "Ambil Foto", loading: "AI sedang menganalisis menu... ⏳", disclaimer: "💡 Deskripsi hanya untuk referensi." },
    'ar': { title: "MenuLens 🔍", slogan: "التقط صورة للقائمة للحصول على التفاصيل.", btn: "التقط صورة", loading: "الذكاء الاصطناعي يحلل القائمة... ⏳", disclaimer: "💡 الأوصاف للرجوع إليها فقط وقد تختلف." },
    'hi': { title: "MenuLens 🔍", slogan: "विवरण प्राप्त करने के लिए मेनू की एक तस्वीर लें।", btn: "तस्वीर लें", loading: "AI मेनू का विश्लेषण कर रहा है... ⏳", disclaimer: "💡 विवरण केवल संदर्भ के लिए हैं。" },
    'it': { title: "MenuLens 🔍", slogan: "Scatta una foto del menu per i dettagli.", btn: "Scatta una foto", loading: "L'IA sta analizzando il menu... ⏳", disclaimer: "💡 Le descrizioni sono solo di riferimento." },
    'pt': { title: "MenuLens 🔍", slogan: "Tire uma foto do menu para ver os detalhes.", btn: "Tirar uma foto", loading: "A IA está analisando o menu... ⏳", disclaimer: "💡 As descrições são apenas para referência." },
    'ru': { title: "MenuLens 🔍", slogan: "Сделайте фото меню, чтобы узнать подробности.", btn: "Сделать фото", loading: "ИИ анализирует меню... ⏳", disclaimer: "💡 Описания приведены только для справки." }
};

const currentLang = uiTranslations[langPrefix] ? langPrefix : 'en';

if (currentLang === 'ar') {
    document.body.style.direction = "rtl";
}

document.getElementById('appTitle').innerText = uiTranslations[currentLang].title;
document.getElementById('appSlogan').innerText = uiTranslations[currentLang].slogan;
document.getElementById('btnScan').innerText = uiTranslations[currentLang].btn;
document.getElementById('loading').innerText = uiTranslations[currentLang].loading;
document.getElementById('disclaimer').innerText = uiTranslations[currentLang].disclaimer;
