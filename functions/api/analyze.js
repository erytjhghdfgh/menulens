export async function onRequestGet() {
  return new Response("GET OK");
}

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}