function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export async function postJson(url, body) {
  const xsrfToken = getCookie('XSRF-TOKEN');
  const res = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Accept': 'application/json',
      'X-XSRF-TOKEN': xsrfToken || '',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Respuesta inválida del servidor (${res.status}).`);
  }
  if (!res.ok) {
    const msg = data?.error || `Error ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Error ${res.status}`);
  }
  return res.json();
}
