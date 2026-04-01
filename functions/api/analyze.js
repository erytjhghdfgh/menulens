export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: { message: 'GEMINI_API_KEY가 없습니다.' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const requestBody = await request.json();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const rawText = await response.text();

    return new Response(rawText, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: { message: error.message || 'Server error' }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
