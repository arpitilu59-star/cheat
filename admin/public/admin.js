let password = '';
const $ = id => document.getElementById(id);
$('loginBtn').onclick = async () => {
  password = $('password').value;
  try {
    const r = await fetch('/api/items', { headers: { 'x-admin-password': password } });
    if (!r.ok) throw new Error('Incorrect password or R2 configuration issue.');
    $('loginPanel').classList.add('hidden');
    $('appPanel').classList.remove('hidden');
    render(await r.json());
  } catch (e) { alert(e.message); }
};
async function api(url, options={}) {
  const headers = new Headers(options.headers || {});
  headers.set('x-admin-password', password);
  return fetch(url, { ...options, headers });
}
function render(items) {
  $('items').innerHTML = '';
  if (!items.length) { $('items').textContent = 'No files uploaded yet.'; return; }
  for (const item of items) {
    const el = document.createElement('div'); el.className = 'item';
    const icon = item.type === 'pdf' ? '📄' : '🎬';
    const meta = document.createElement('div'); meta.className = 'meta';
    const strong = document.createElement('strong'); strong.textContent = `${icon} ${item.title}`;
    const small = document.createElement('small'); small.textContent = `${item.category} · ${item.fileName}`;
    meta.append(strong, small);
    const del = document.createElement('button'); del.className = 'delete'; del.textContent = 'Delete';
    del.onclick = async () => {
      if (!confirm(`Delete "${item.title}" permanently?`)) return;
      const r = await api(`/api/items/${item.id}`, { method: 'DELETE' });
      const data = await r.json(); if (!r.ok) return alert(data.error);
      loadItems();
    };
    el.append(meta, del); $('items').append(el);
  }
}
async function loadItems() {
  const r = await api('/api/items'); const data = await r.json();
  if (!r.ok) return alert(data.error); render(data);
}
$('refreshBtn').onclick = loadItems;
$('uploadForm').onsubmit = async e => {
  e.preventDefault();
  const file = $('media').files[0]; if (!file) return;
  $('uploadBtn').disabled = true; $('progress').classList.remove('hidden'); $('message').textContent = '';
  try {
    const body = new FormData(e.target);
    const r = await api('/api/upload', { method: 'POST', body });
    const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Upload failed');
    $('message').textContent = 'Upload successful! Your public library will show the file shortly.';
    e.target.reset(); await loadItems();
  } catch (err) { $('message').style.color = '#b91c1c'; $('message').textContent = err.message; }
  finally { $('uploadBtn').disabled = false; $('progress').classList.add('hidden'); }
};
