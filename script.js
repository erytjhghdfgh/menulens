// ✅ 하단 바 터치 이벤트 처리
document.querySelector('.bottom-sticky-bar').addEventListener('touchmove', function(e) {
    e.stopPropagation();
}, { passive: true });

// ============================================================
// 🌍 1. 브라우저 언어/국가 감지
// ============================================================
const userLanguage = navigator.language || 'en-US';
const langPrefix = userLanguage.split('-')[0];
const currentLang = uiTranslations[langPrefix] ? langPrefix : 'en';
const t = uiTranslations[currentLang]; // 단축 참조

// ============================================================
// 🔤 2. UI 텍스트 일괄 적용
// ============================================================
document.getElementById('appTitle').innerText = t.title;
document.getElementById('appSlogan').innerText = t.slogan;
document.getElementById('btnScan').innerText = t.btn;
document.getElementById('btnUpload').innerText = t.btnUpload;
document.getElementById('loading').innerHTML = t.loading + ' <span id="loadingPct"></span>';
document.getElementById('disclaimer').innerText = t.disclaimer;

// 로그인 영역
document.querySelector('#loggedOutView p').innerHTML = t.loginPromo;
document.getElementById('btnLogout').innerText = t.logout;
document.getElementById('btnWithdraw').innerText = t.withdraw;
// ✅ 추가: 사용자 환영 메시지 접미사 번역 적용
if (document.getElementById('welcomeSuffix')) {
    document.getElementById('welcomeSuffix').innerText = t.welcomeSuffix;
}

// 피드백 영역
document.querySelector('.feedback-header p').innerHTML = t.feedbackHeader;
document.getElementById('btnToggleFeedback').innerText = t.feedbackToggle;
document.getElementById('feedbackText').placeholder = t.feedbackPlaceholder;
document.querySelector('.feedback-img-label').innerText = t.feedbackAttach;
document.getElementById('btnSubmitFeedback').innerText = t.feedbackSend;

// 아랍어 RTL 처리
if (currentLang === 'ar') {
    document.body.style.direction = "rtl";
}
// ============================================================
// DOM 변수 선언
// ============================================================
const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const preview = document.getElementById('preview');
const resultContainer = document.getElementById('resultContainer');
const loading = document.getElementById('loading');
const disclaimer = document.getElementById('disclaimer');
const feedbackContainer = document.getElementById('feedbackContainer');


// ============================================================
// 🗂 3. 동의 모달 동적 생성 (JS로 번역 텍스트 주입)
// ============================================================
function buildConsentModal() {
    const modal = document.getElementById('consentModal');
    modal.innerHTML = `
        <div style="background:#fff; width:100%; max-width:480px; margin:0 auto;
                    border-radius:20px 20px 0 0; padding:28px 24px 40px; box-shadow:0 -8px 30px rgba(0,0,0,0.15);">
            
            <!-- 헤더 -->
            <div style="text-align:center; margin-bottom:20px;">
                <div style="font-size:2rem; margin-bottom:8px;">🔍</div>
                <h2 style="font-size:1.15rem; font-weight:800; color:#1a1a1a; margin-bottom:6px;">
                    ${t.consentTitle}
                </h2>
                <p style="font-size:0.85rem; color:#888; line-height:1.5;">
                    ${t.consentSubtitle}
                </p>
            </div>

            <!-- 전체 동의 -->
            <label style="display:flex; align-items:center; gap:12px;
                   background:#fff4eb; border:1.5px solid #FF7300; border-radius:12px;
                   padding:14px 16px; cursor:pointer; margin-bottom:12px;">
                <input type="checkbox" id="agreeAll" style="width:20px; height:20px; accent-color:#FF7300; cursor:pointer;">
                <span style="font-size:0.95rem; font-weight:700; color:#FF7300;">${t.consentAll}</span>
            </label>

            <div style="border-top:1px solid #eee; margin-bottom:12px;"></div>

            <!-- 개별 동의 항목들 -->
            <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px;">

                <!-- 이용약관 -->
                <label style="display:flex; align-items:center; gap:12px;
                       background:#fafafa; border:1px solid #e8e8e8; border-radius:10px;
                       padding:12px 14px; cursor:pointer;">
                    <input type="checkbox" id="agreeTerms" style="width:18px; height:18px; accent-color:#FF7300; cursor:pointer;">
                    <div style="flex:1;">
                        <span style="font-size:0.88rem; font-weight:600; color:#333;">
                            <span style="color:#FF7300; font-size:0.75rem; font-weight:700;
                                   background:#fff4eb; padding:2px 6px; border-radius:4px; margin-right:6px;">${t.requiredBadge}</span>
                            ${t.consentTerms}
                        </span>
                    </div>
                    <a href="terms.html" target="_blank"
                       style="font-size:0.78rem; color:#aaa; text-decoration:none; white-space:nowrap;"
                       onclick="event.stopPropagation()">${t.consentTermsLink}</a>
                </label>

                <!-- 개인정보처리방침 -->
                <label style="display:flex; align-items:center; gap:12px;
                       background:#fafafa; border:1px solid #e8e8e8; border-radius:10px;
                       padding:12px 14px; cursor:pointer;">
                    <input type="checkbox" id="agreePrivacy" style="width:18px; height:18px; accent-color:#FF7300; cursor:pointer;">
                    <div style="flex:1;">
                        <span style="font-size:0.88rem; font-weight:600; color:#333;">
                            <span style="color:#FF7300; font-size:0.75rem; font-weight:700;
                                   background:#fff4eb; padding:2px 6px; border-radius:4px; margin-right:6px;">${t.requiredBadge}</span>
                            ${t.consentPrivacy}
                        </span>
                    </div>
                    <a href="privacy-policy.html" target="_blank"
                       style="font-size:0.78rem; color:#aaa; text-decoration:none; white-space:nowrap;"
                       onclick="event.stopPropagation()">${t.consentPrivacyLink}</a>
                </label>

                <!-- ✅ AI 학습 동의 (선택으로 변경) -->
                <label style="display:flex; align-items:center; gap:12px;
                       background:#fafafa; border:1px solid #e8e8e8; border-radius:10px;
                       padding:12px 14px; cursor:pointer;">
                    <input type="checkbox" id="agreeAI" style="width:18px; height:18px; accent-color:#FF7300; cursor:pointer;">
                    <div style="flex:1;">
                        <div style="font-size:0.88rem; font-weight:600; color:#333; margin-bottom:3px;">
                            <span style="color:#888; font-size:0.75rem; font-weight:700;
                                   background:#f0f0f0; padding:2px 6px; border-radius:4px; margin-right:6px;">${t.optionalBadge}</span>
                            ${t.consentAI}
                        </div>
                        <div style="font-size:0.78rem; color:#aaa; line-height:1.4;">
                            ${t.consentAIDesc}
                        </div>
                        <div style="font-size:0.78rem; color:#FF7300; line-height:1.4; margin-top:3px;">
                            ${t.consentAIPromo}
                        </div>
                    </div>
                </label>
            </div>

            <!-- 동의 후 로그인 버튼 -->
            <button id="btnConsentConfirm"
                    style="width:100%; padding:16px; background:#FF7300; color:#fff;
                           border:none; border-radius:12px; font-size:1rem; font-weight:700;
                           cursor:pointer; opacity:0.4; pointer-events:none; transition:all 0.2s;">
<img src="google-signin-btn.svg" alt="" 
     style="width:20px; height:20px; object-fit:contain; 
            filter:brightness(0) invert(1); margin-right:8px; vertical-align:middle;">
${t.consentBtn}
            </button>

            <button id="btnConsentCancel"
                    style="width:100%; margin-top:10px; padding:10px; background:none;
                           border:none; color:#aaa; font-size:0.85rem; cursor:pointer;">
                ${t.consentCancel}
            </button>
        </div>
    `;

    // 모달 재생성 후 이벤트 다시 등록
    document.getElementById('btnConsentCancel').addEventListener('click', () => {
        document.getElementById('consentModal').style.display = 'none';
    });

    document.getElementById('agreeAll').addEventListener('change', function() {
        ['agreeTerms', 'agreePrivacy', 'agreeAI'].forEach(id => {
            document.getElementById(id).checked = this.checked;
        });
        updateConsentButton();
    });

    ['agreeTerms', 'agreePrivacy', 'agreeAI'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            const all = ['agreeTerms', 'agreePrivacy', 'agreeAI'].every(i =>
                document.getElementById(i).checked
            );
            document.getElementById('agreeAll').checked = all;
            updateConsentButton();
        });
    });

    document.getElementById('btnConsentConfirm').addEventListener('click', () => {
        const agreedAI = document.getElementById('agreeAI').checked;
        localStorage.setItem('menulens_agreed_ai', agreedAI ? 'true' : 'false');
        localStorage.setItem('menulens_agreed_terms', 'true');
        document.getElementById('consentModal').style.display = 'none';
        window.triggerGoogleLogin();
    });
}

// ✅ agreeAI는 선택이므로 Terms + Privacy만 체크되면 버튼 활성화
function updateConsentButton() {
    const required = document.getElementById('agreeTerms').checked &&
                     document.getElementById('agreePrivacy').checked;
    const btn = document.getElementById('btnConsentConfirm');
    btn.style.opacity = required ? '1' : '0.4';
    btn.style.pointerEvents = required ? 'auto' : 'none';
}

// 기존 코드 (549~553줄) → 아래로 교체
document.getElementById('btnGoogleLogin').addEventListener('click', () => {
    // ✅ 이미 동의한 경우 바로 로그인
    if (localStorage.getItem('menulens_agreed_terms') === 'true') {
        window.triggerGoogleLogin();
        return;
    }
    // 동의 안 한 경우만 모달 표시
    buildConsentModal();
    document.getElementById('consentModal').style.display = 'flex';
});


function cleanJsonString(str) {
    return str.replace(/```json\n?|```\n?/g, '').trim();
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}


// ============================================================
// 로딩 퍼센트 관련 변수 & 함수
// ============================================================
const stages = [
    { end: 20, dur: 4000 },
    { end: 50, dur: 8000 },
    { end: 80, dur: 15000 },
    { end: 95, dur: 15000 },
    { end: 99, dur: 8000 },
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

// ============================================================
// 📷 이미지 선택 처리
// ============================================================
function handleImageSelection(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert(t.alertFileSize);
        event.target.value = '';
        return;
    }

if (preview) {
    if (preview.src.startsWith('blob:')) {
        URL.revokeObjectURL(preview.src);  // ← 이전 것 해제
    }
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
        analyzeMenuWithAI(base64Image, file);
    };

    event.target.value = '';
}

cameraInput.addEventListener('change', handleImageSelection);
galleryInput.addEventListener('change', handleImageSelection);

// ============================================================
// 🔑 로그인 체크
// ============================================================

// ✅ 수정
function checkLoginAndAct(targetInputId) {
    if (window.isUserLoggedIn) {
        document.getElementById(targetInputId).click();
    } else {
        alert(t.alertLoginRequired);
        document.getElementById('authContainer').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
// ============================================================
// 🤖 메뉴 분석
// ============================================================
async function analyzeMenuWithAI(base64Data, file) {

const promptText = `
[You are the owner of the restaurant that uses this menu. A foreign tourist has entered your restaurant and is trying to order.
Your task is to analyze the photo provided by the tourist and explain the menu immediately, in a friendly manner but without any unnecessary greetings.

[CRITICAL OUTPUT RULE: STRICT JSON ONLY]
You MUST output your response ONLY as a raw, valid JSON object.
Do NOT wrap the JSON in markdown blocks (e.g., do not use \`\`\`json or \`\`\`).
Do NOT output any other text, HTML, or explanations outside the JSON object.

[Output JSON Schema]
{
  "status": "success", // Use "error" only if the exception handling rules apply
  "errorMessage": "", // Leave empty if status is "success". If "error", put the error message here.
  "restaurantInfo": "", // Explanation of Menu Format & Special Ordering Methods
  "categories": [
    {
      "categoryName": "Translated Category Name (e.g., Meals, Beverages)",
      "items": [
        {
          "originalName": "Original text exactly as written on the menu",
          "translatedName": "Intuitive, short translated name in ${currentLang} within 4~5 words",
          "prices": ["Price 1", "Price 2"], // Array of strings. Use "Option + Price" if multiple.
          "description": "Menu description in ${currentLang}" // Empty string if ready-made drink
        }
      ]
    }
  ]
}

[Exception Handling Rules] (Check this first)
If the photo uploaded is not a menu or unrelated to food:
Return JSON with status "error" and errorMessage: "Cannot recognize the menu photo. Please upload a photo of the menu."
If the photo is too blurry to read:
Return JSON with status "error" and errorMessage: "The photo is too blurry to read the menu. Please take a clear photo again."

[Basic Writing Rules]
- Never use greetings (e.g., "Welcome!", "Hello!").
- Never fabricate information not on the menu.
- Output 'EVERY single item (including drinks)' without omitting anything.
- All translated text MUST be written in ${currentLang} at a Native Speaker level. Strictly avoid awkward literal translations.

[Field Specific Guidelines]
1. restaurantInfo: Explain the format of the menu (e.g., a la carte, course) and any special ordering methods/restrictions (free extra rice, minimum order, etc.) in 1-2 sentences in ${currentLang}.
2. items.prices: If price varies by size/quantity, write as "Option + Price" (e.g., "5pcs 390円"). If there is only 1 price, put it as a single item array.
3. items.description: 
   - Write in 2-3 natural sentences in ${currentLang}.
   - Blend what the food is, cooking methods, ingredients, taste, and liked/disliked factors. Use reasonable inference. No flowery rhetoric.
   - [Allergy Warning]: If it contains lethal allergens (peanuts, crustaceans), explicitly write "[Allergy Warning: Contains XXX]". If none, omit the warning.
   - ⭐️ Exception: For commercially available ready-made products (Coca-Cola, regular bottled beer, etc.), leave the description as an empty string "". Homemade/Cafe drinks must have a 2-3 sentence description.
`;

    const requestBody = {
        contents: [{
            parts: [
                { text: promptText },
                { inline_data: { mime_type: file.type || "image/jpeg", data: base64Data } }
            ]
        }]
    };

    try {


if (!window.auth) {
    throw new Error(t.alertLoginRequired);
}
const currentUser = window.auth?.currentUser;
if (!currentUser) throw new Error(t.alertLoginRequired);

        const idToken = await currentUser.getIdToken();

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`            
             },
            body: JSON.stringify(requestBody)
        });

        const rawText = await response.text();
        const data = JSON.parse(rawText);
        const aiResultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiResultText) throw new Error(t.alertAiReadError);


const parsedResult = (() => {
    try { return JSON.parse(cleanJsonString(aiResultText)); }
    catch(e) { return null; }
})();

const isInvalidMenu = parsedResult?.status === "error";
if (!isInvalidMenu && typeof window.saveValidMenuToFirebase === 'function') {
    window.saveValidMenuToFirebase(file, aiResultText);
}

renderStoryMode(parsedResult); // ← 이미 뜯어놓은 객체 전달

    } catch (error) {
        stopLoading();
        resultContainer.innerHTML = `<p style="text-align:center; padding:20px; color:#d9534f;">${t.alertAnalyzeError}<br>${error.message}</p>`;
        resultContainer.style.display = 'block';
    }
}

// ============================================================
// 🎨 결과 렌더링
// ============================================================
function renderStoryMode(data) {  // 이미 파싱된 객체 받음
    stopLoading();
    disclaimer.style.display = 'block';
    resultContainer.style.display = 'block';
    feedbackContainer.style.display = 'block';

        document.getElementById('btnToggleFeedback').style.display = 'block';
    document.getElementById('feedbackFormArea').style.display = 'none';
    document.getElementById('feedbackHeaderText').innerHTML = t.feedbackHeader;

    try {
        if (!data) throw new Error("파싱 실패");
        
        // 바로 data 사용 (JSON.parse 필요 없음!)
        if (data.status === "error") {
            resultContainer.innerHTML = `
                <div class="markdown-body">
                    <p style="color: red; font-weight: bold;">${data.errorMessage}</p>
                </div>
            `;
            return;
        }

        // 성공 시 HTML 동적 생성
        let htmlContent = '';

        // 1. 식당 포맷 및 특별 주문 방식 설명
        if (data.restaurantInfo) {
            htmlContent += `<p>${esc(data.restaurantInfo)}</p>`;
        }

        // 2. 구분선 추가
        htmlContent += `<hr>`;

        // 3. 카테고리별 메뉴 설명 렌더링
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                // 카테고리 이름
                htmlContent += `<h3>${esc(category.categoryName)}</h3>`;

                // 해당 카테고리의 메뉴 아이템들
                category.items.forEach(item => {
                    // 가격 배열을 HTML span 태그로 변환
                    const pricesHtml = item.prices.map(price => 
                        `<span class="dish-price">${esc(price)}</span>`
                    ).join('');

                    // 설명이 빈 문자열인 경우(기성품 음료 등) p 태그 자체를 렌더링하지 않거나 빈 태그로 둠
                    const descHtml = item.description 
                        ? `<p class="dish-desc">${esc(item.description)}</p>`
                        : ''; // ← 설명이 없으면 아예 아무것도 렌더링하지 않음

                    // 기존 HTML 템플릿에 데이터 삽입
htmlContent += `
    <div class="dish">
        <div class="dish-header">
            <div class="dish-title-group">
                <div class="dish-original">● ${esc(item.originalName)}</div>
                <div class="dish-translation">${esc(item.translatedName)}</div>
            </div>
            <div class="dish-price-group">
                ${pricesHtml}
            </div>
        </div>
        ${descHtml}
    </div>
`;
                });
            });
        }

        // 최종 완성된 HTML을 컨테이너에 삽입
        resultContainer.innerHTML = `
            <div class="markdown-body">
                ${htmlContent}
            </div>
        `;

    } catch (error) {
        console.error("JSON 파싱 에러:", error);
        resultContainer.innerHTML = `
            <div class="markdown-body">
                <p style="color: red;">${t.alertAnalyzeError}</p>
            </div>
        `;
    }
}

// ============================================================
// 📝 피드백 폼 동작 처리
// ============================================================
document.getElementById('btnToggleFeedback').addEventListener('click', function() {
    const formArea = document.getElementById('feedbackFormArea');
    if (formArea.style.display === 'none' || formArea.style.display === '') {
        formArea.style.display = 'flex';
        this.style.display = 'none';
    }
});

document.getElementById('feedbackImgInput').addEventListener('change', function(e) {
    const files = Array.from(e.target.files);

    if (files.length > 3) {
        alert(t.alertPhotoCount);
        this.value = '';
        return;
    }

    for (const f of files) {
        if (f.size > 5 * 1024 * 1024) {
            alert(`${t.alertPhotoSizePrefix}${f.name}${t.alertPhotoSizeSuffix}`);
            this.value = '';
            document.getElementById('feedbackImgPreview').innerHTML = '';
            return;
        }
    }

    const previewEl = document.getElementById('feedbackImgPreview');
    previewEl.innerHTML = '';
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
            previewEl.appendChild(div);
        };
        reader.readAsDataURL(f);
    });
});

document.getElementById('btnSubmitFeedback').addEventListener('click', function() {
    if (typeof window.submitFeedback === 'function') {
        window.submitFeedback();
    }
});
