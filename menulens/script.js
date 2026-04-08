
'script.js'
 
// 🌍 1. 브라우저 언어/국가 감지
const userLanguage = navigator.language || 'en-US';
const langPrefix = userLanguage.split('-')[0];
 
 
const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const preview = document.getElementById('preview');
const resultContainer = document.getElementById('resultContainer');
const loading = document.getElementById('loading');
const disclaimer = document.getElementById('disclaimer');
const feedbackContainer = document.getElementById('feedbackContainer'); // 추가된 변수

// ==========================================
// ⏳ 로딩 퍼센트 관련 변수 & 함수 (50초 버전)
// ==========================================
const stages = [
    { end: 20, dur: 4000 },  // 처음 4초: 0% -> 20% (빠른 시작으로 안도감 부여)
    { end: 50, dur: 8000 },  // 다음 8초: 20% -> 50% (안정적인 진행)
    { end: 80, dur: 15000 }, // 다음 15초: 50% -> 80% (본격적인 분석 중...)
    { end: 95, dur: 15000 }, // 다음 15초: 80% -> 95% (서서히 느려지며 시간 벌기)
    { end: 99, dur: 8000 },  // 다음 8초: 95% -> 99% (최후의 보루, 99%에서 대기)
];
 
let _raf, _stageIdx = 0, _stageStart = null, _curPct = 0;
 
function startLoading() {
    _stageIdx = 0;
    _stageStart = null;
    _curPct = 0;
    document.getElementById('loadingPct').textContent = '0%';
    loading.style.display = 'block';
    _raf = requestAnimationFrame(_loadTick);
}
 
function stopLoading() {
    cancelAnimationFrame(_raf);
    document.getElementById('loadingPct').textContent = '100%';
    setTimeout(() => { loading.style.display = 'none'; }, 300);
}
 
function _loadTick(ts) {
    if (!_stageStart) _stageStart = ts;
    const stage = stages[_stageIdx];
    const prev = _stageIdx > 0 ? stages[_stageIdx - 1].end : 0;
    const progress = Math.min((ts - _stageStart) / stage.dur, 1);
    _curPct = prev + (stage.end - prev) * progress;
 
    document.getElementById('loadingPct').textContent = Math.round(_curPct) + '%';
 
    if (progress >= 1 && _stageIdx < stages.length - 1) {
        _stageIdx++;
        _stageStart = null;
    }
    _raf = requestAnimationFrame(_loadTick);
}
 
 
// ==========================================
// 📷 이미지 선택 처리
// ==========================================
function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
 
    // ✅ 추가: 용량 제한 5MB
    if (file.size > 5 * 1024 * 1024) {
        alert("사진 용량이 너무 큽니다. 5MB 이하의 사진을 사용해 주세요.");
        event.target.value = '';
        return;
    }

    if (preview) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
    }
 
    resultContainer.innerHTML = '';
    resultContainer.style.display = 'none';
    disclaimer.style.display = 'none';
    feedbackContainer.style.display = 'none'; 
 
    startLoading();
 
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        const base64Image = reader.result.split(',')[1];
        // ✨ 여기서 원본 file 객체를 함께 넘겨줍니다.
        analyzeMenuWithAI(base64Image, file); 
    };
 
    event.target.value = '';
}
 
cameraInput.addEventListener('change', handleImageSelection);
galleryInput.addEventListener('change', handleImageSelection);
 
// ==========================================
// 🤖 메뉴 분석 (이미지 1회 전송)
// ==========================================
async function analyzeMenuWithAI(base64Data, file) {
 
    const promptText = `
You are the owner of the restaurant that uses this menu. A foreign tourist has entered your restaurant and is trying to order.
Your task is to analyze the photo provided by the tourist and explain the menu immediately, in a friendly manner but without any unnecessary greetings.

[Exception Handling Rules] (Check this first)

If the photo uploaded by the user is not a menu or is completely unrelated to food, output ONLY the following sentence without any other content:
"Cannot recognize the menu photo. Please upload a photo of the menu."

If the photo is too blurry or the quality is too poor to read the text, output ONLY the following sentence without any other content:
"The photo is too blurry to read the menu. Please take a clear photo again."

[Basic Writing Rules]

Never use greetings (e.g., "Welcome!", "Hello!") and start the analysis content immediately.
Never fabricate or make up information that is not on the menu.
You must output 'EVERY single item (including drinks)' on the menu without omitting anything, strictly using the provided HTML structure.
IMPORTANT: All final translated text, including dish names and descriptions, MUST be written in ${userLanguage}.

[Output Structure]
Output strictly in the order of 1, 2, and 3 below.

1. Explanation of Menu Format & Special Ordering Methods

Look at the entire photo and first explain the format of this restaurant's menu (e.g., mainly a la carte, course meals, set menus, etc.) in 1-2 sentences in ${userLanguage}.
If there are 'special ordering methods or restrictions unique to the restaurant', such as free extra rice, minimum order of 2 portions, or specific time discounts, you must explain them in this section.

2. Divider

After the format explanation, you must insert an <hr> tag to draw a dividing line.

3. Menu Explanation by Category (Use the specified HTML format)

Group and explain the menu by categories (e.g., Meals, Side dishes, Beverages). Write the translated category title as <h3>Category Name</h3>.

You must output each menu item strictly following the HTML structure below:

<div class="dish">
  <div class="dish-header">
    <div class="dish-title-group">
      <div class="dish-original">● [Original text exactly as written on the menu]</div>
      <div class="dish-translation">[Intuitive, short translated name in ${userLanguage} within 4~5 words]</div>
    </div>
<div class="dish-price-group">
      <span class="dish-price">[Price 1 (If price varies by size or quantity, write "Option + Price" e.g., "5pcs 390円")]</span>
      <span class="dish-price">[Price 2 (Add more <span class="dish-price"> tags if there are 3 or more options. Omit if there is only 1 price)]</span>
    </div>
  </div>
  <p class="dish-desc">[Menu description in ${userLanguage}]</p>
</div>

[Menu Description (<p class="dish-desc">) Writing Guide]

Length: Must be written in 2-3 natural sentences in {{user_language}}. (Should not be too long or too short).

Content: Naturally blend in what the food is, cooking methods, preparation style, key ingredients, taste characteristics, and factors that might be strongly liked or disliked. Even if the information is ambiguous, explain it in 2-3 sentences based on reasonable inference. Never use abstract, flowery rhetoric like "fantastic harmony" or "sun of Sicily".

Allergy Warning: If it is a dish containing lethal allergens like peanuts or crustaceans (shrimp, crab, etc.), you must explicitly write it in the description, such as "[Allergy Warning: Contains Peanuts]". If none, omit it entirely.

⭐️ Exception for Ready-made Drinks/Liquor: For 'commercially available ready-made products that taste the same anywhere in the world' such as Coca-Cola, Sprite, regular Soju, and regular bottled beer, leave the content inside the <p class="dish-desc"> tag completely empty. (So only the name and price appear). However, manufactured drinks at a cafe or homemade drinks made directly at the restaurant must have a normal 2-3 sentence description.
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
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });
 
        const rawText = await response.text();
        const data = JSON.parse(rawText);
        const aiResultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
 
        if (!aiResultText) throw new Error('AI 응답을 읽을 수 없습니다.');
 
        // ✨ 정상 메뉴판 판별 및 파이어베이스 자동 저장 로직
        const isInvalidMenu = aiResultText.includes("Cannot recognize the menu photo") || 
                              aiResultText.includes("The photo is too blurry");
        
        // 에러 문구가 없고(정상 메뉴판), 저장 함수가 존재한다면 파이어베이스에 저장
        if (!isInvalidMenu && typeof window.saveValidMenuToFirebase === 'function') {
            window.saveValidMenuToFirebase(file);
        }

        renderStoryMode(aiResultText.trim());
 
    } catch (error) {
        stopLoading();
        resultContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#d9534f;">앗! 분석 중 오류가 발생했어요.<br>${error.message}</p>`;
        resultContainer.style.display = 'block';
    }
}
 
// ==========================================
// 🎨 결과 렌더링
// ==========================================
function renderStoryMode(menuHTML) {
    stopLoading();
    disclaimer.style.display = 'block';
    resultContainer.style.display = 'block';
    feedbackContainer.style.display = 'block'; // ✨ 추가: 분석 완료 시 피드백 영역 표시
    resultContainer.innerHTML = `
        <div class="markdown-body">
            ${menuHTML}
        </div>
    `;
}
 
// ==========================================
// 🌍 다국어 UI (글로벌 Top 15 언어 지원)
// ==========================================
const uiTranslations = {
    'ko': {
        title: "MenuLens 🔍",
        slogan: "메뉴판을 카메라로 찍으면 정보를 알려드립니다.",
        btn: "카메라로 찍기",
        btnUpload: "사진 불러오기",
        loading: "AI가 메뉴를 분석하고 있어요... ",
        disclaimer: "💡 설명은 참고용이며, 실제 식당 요리와 다를 수 있습니다.",
        detailEmpty: "설명이 여기 표시됩니다."
    },
    'en': {
        title: "MenuLens 🔍",
        slogan: "Take a photo of the menu to get details.",
        btn: "Take a Photo",
        btnUpload: "Upload Photo",
        loading: "AI is analyzing the menu... ",
        disclaimer: "💡 Descriptions are for reference only and may vary.",
        detailEmpty: "Description will appear here."
    },
    'ja': {
        title: "MenuLens 🔍",
        slogan: "メニューの写真を撮ると情報が表示されます。",
        btn: "写真を撮る",
        btnUpload: "写真を読み込む",
        loading: "AIがメニューを分析しています... ",
        disclaimer: "💡 説明は参考用であり、実際の料理と異なる場合があります。",
        detailEmpty: "説明がここに表示されます。"
    },
    'zh': {
        title: "MenuLens 🔍",
        slogan: "拍下菜单照片即可获取详细信息。",
        btn: "拍下菜单",
        btnUpload: "上传照片",
        loading: "AI 正在分析菜单... ",
        disclaimer: "💡 说明仅供参考，可能与实际菜品有所不同。",
        detailEmpty: "说明将显示在此处。"
    },
    'es': {
        title: "MenuLens 🔍",
        slogan: "Toma una foto del menú para ver los detalles.",
        btn: "Tomar una foto",
        btnUpload: "Subir foto",
        loading: "La IA está analizando el menú... ",
        disclaimer: "💡 Las descripciones son solo de referencia.",
        detailEmpty: "La descripción aparecerá aquí."
    },
    'fr': {
        title: "MenuLens 🔍",
        slogan: "Prenez une photo du menu pour obtenir des détails.",
        btn: "Prendre une photo",
        btnUpload: "Importer une photo",
        loading: "L'IA analyse le menu... ",
        disclaimer: "💡 Les descriptions sont fournies à titre indicatif.",
        detailEmpty: "La description apparaîtra ici."
    },
    'de': {
        title: "MenuLens 🔍",
        slogan: "Machen Sie ein Foto der Speisekarte für Details.",
        btn: "Foto machen",
        btnUpload: "Foto hochladen",
        loading: "KI analysiert das Menü... ",
        disclaimer: "💡 Beschreibungen dienen nur als Referenz.",
        detailEmpty: "Die Beschreibung wird hier angezeigt."
    },
    'th': {
        title: "MenuLens 🔍",
        slogan: "ถ่ายรูปเมนูเพื่อดูรายละเอียด",
        btn: "ถ่ายรูปเมนู",
        btnUpload: "อัปโหลดรูปภาพ",
        loading: "AI กำลังวิเคราะห์เมนู... ",
        disclaimer: "💡 คำอธิบายมีไว้เพื่อการอ้างอิงเท่านั้น",
        detailEmpty: "คำอธิบายจะแสดงที่นี่"
    },
    'vi': {
        title: "MenuLens 🔍",
        slogan: "Chụp ảnh thực đơn để xem chi tiết.",
        btn: "Chụp ảnh",
        btnUpload: "Tải ảnh lên",
        loading: "AI đang phân tích thực đơn... ",
        disclaimer: "💡 Mô tả chỉ mang tính tham khảo.",
        detailEmpty: "Mô tả sẽ xuất hiện ở đây."
    },
    'id': {
        title: "MenuLens 🔍",
        slogan: "Ambil foto menu untuk melihat detail.",
        btn: "Ambil Foto",
        btnUpload: "Unggah Foto",
        loading: "AI sedang menganalisis menu... ",
        disclaimer: "💡 Deskripsi hanya untuk referensi.",
        detailEmpty: "Deskripsi akan muncul di sini."
    },
    'ar': {
        title: "MenuLens 🔍",
        slogan: "التقط صورة للقائمة للحصول على التفاصيل.",
        btn: "التقط صورة",
        btnUpload: "تحميل صورة",
        loading: "الذكاء الاصطناعي يحلل القائمة... ",
        disclaimer: "💡 الأوصاف للرجوع إليها فقط وقد تختلف.",
        detailEmpty: "سيظهر الوصف هنا."
    },
    'hi': {
        title: "MenuLens 🔍",
        slogan: "विवरण प्राप्त करने के लिए मेनू की एक तस्वीर लें।",
        btn: "तस्वीर लें",
        btnUpload: "फ़ोटो अपलोड करें",
        loading: "AI मेनू का विश्लेषण कर रहा है... ",
        disclaimer: "💡 विवरण केवल संदर्भ के लिए हैं।",
        detailEmpty: "विवरण यहाँ दिखाई देगा।"
    },
    'it': {
        title: "MenuLens 🔍",
        slogan: "Scatta una foto del menu per i dettagli.",
        btn: "Scatta una foto",
        btnUpload: "Carica foto",
        loading: "L'IA sta analizzando il menu... ",
        disclaimer: "💡 Le descrizioni sono solo di riferimento.",
        detailEmpty: "La descrizione apparirà qui."
    },
    'pt': {
        title: "MenuLens 🔍",
        slogan: "Tire uma foto do menu para ver os detalhes.",
        btn: "Tirar uma foto",
        btnUpload: "Carregar foto",
        loading: "A IA está analisando o menu... ",
        disclaimer: "💡 As descrições são apenas para referência.",
        detailEmpty: "A descrição aparecerá aqui."
    },
    'ru': {
        title: "MenuLens 🔍",
        slogan: "Сделайте фото меню, чтобы узнать подробности.",
        btn: "Сделать фото",
        btnUpload: "Загрузить фото",
        loading: "ИИ анализирует меню... ",
        disclaimer: "💡 Описания приведены только для справки.",
        detailEmpty: "Описание появится здесь."
    }
};
 
const currentLang = uiTranslations[langPrefix] ? langPrefix : 'en';
 
if (currentLang === 'ar') {
    document.body.style.direction = "rtl";
}
 
document.getElementById('appTitle').innerText = uiTranslations[currentLang].title;
document.getElementById('appSlogan').innerText = uiTranslations[currentLang].slogan;
document.getElementById('btnScan').innerText = uiTranslations[currentLang].btn;
document.getElementById('btnUpload').innerText = uiTranslations[currentLang].btnUpload;
 
document.getElementById('loading').innerHTML =
    uiTranslations[currentLang].loading + ' <span id="loadingPct"></span>';
 
document.getElementById('disclaimer').innerText = uiTranslations[currentLang].disclaimer;
//document.getElementById('detailEmpty').innerText = uiTranslations[currentLang].detailEmpty;

// ==========================================
// ✨ 새로 추가: 피드백 폼 동작 처리 부분 (파일 맨 아래에 추가)
// ==========================================
document.getElementById('btnToggleFeedback').addEventListener('click', function() {
    const formArea = document.getElementById('feedbackFormArea');
    if (formArea.style.display === 'none' || formArea.style.display === '') {
        formArea.style.display = 'flex'; // 폼 열기
        this.style.display = 'none'; // '불편한 점 남기기' 버튼은 숨김
    }
});

document.getElementById('feedbackImgInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    if (files.length > 3) {
        alert("사진은 최대 3장까지 첨부 가능합니다.");
        this.value = '';
        return;
    }

    for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
            alert(`"${f.name}" 파일이 5MB를 초과합니다.`);
            this.value = '';
            document.getElementById('feedbackImgPreview').innerHTML = '';
            return;
        }
    }

    // 썸네일 렌더링
    const preview = document.getElementById('feedbackImgPreview');
    preview.innerHTML = '';
    files.forEach(f => {
        const reader = new FileReader();
        reader.onload = function(ev) {
            const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
            const div = document.createElement('div');
            div.style.cssText = 'position:relative; text-align:center;';
            div.innerHTML = `
                <img src="${ev.target.result}" 
                     style="width:70px; height:70px; object-fit:cover; border-radius:8px; border:1px solid #ddd;">
                <div style="font-size:0.7rem; color:#888; margin-top:2px;">${sizeMB}MB</div>
            `;
            preview.appendChild(div);
        };
        reader.readAsDataURL(f);
    });
});

// 보내기 버튼 클릭 (나중에 파이어베이스 연동할 부분)
// script.js 내의 전송 버튼 부분
document.getElementById('btnSubmitFeedback').addEventListener('click', function() {
    // index.html에 정의된 함수 호출
    if (typeof window.submitFeedback === 'function') {
        window.submitFeedback();
    }
});