export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.GEMINI_API_KEY;

  // ✅ 1단계: 요청 크기 제한 (4MB 초과 차단)
  const contentLength = parseInt(request.headers.get('content-length') || '0');
  if (contentLength > 4 * 1024 * 1024) {
    return new Response(JSON.stringify({
      error: { message: '이미지가 너무 큽니다.' }
    }), { status: 413, headers: { 'Content-Type': 'application/json' } });
  }

  // ✅ 2단계: 토큰 존재 여부 확인
  const authHeader = request.headers.get('Authorization') || '';
  const idToken = authHeader.replace('Bearer ', '').trim();
  if (!idToken) {
    return new Response(JSON.stringify({
      error: { message: '로그인이 필요합니다.' }
    }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  // ✅ 3단계: Google에 토큰 진짜인지 확인
  const verifyRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_WEB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    }
  );
const verifyData = await verifyRes.json();
if (!verifyRes.ok || !verifyData.users || verifyData.users.length === 0) {
  return new Response(JSON.stringify({ error: { message: '유효하지 않은 사용자입니다.' } }), 
    { status: 403, headers: { 'Content-Type': 'application/json' } });
}

  // ✅ 기존 코드
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: { message: 'GEMINI_API_KEY가 없습니다.' }
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const requestBody = await request.json();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...requestBody,
        generationConfig: {
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 8192 }
        }
      })
    });
    const rawText = await response.text();
    return new Response(rawText, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: { message: error.message || 'Server error' }
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
