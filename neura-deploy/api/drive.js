module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing Google access token' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); } }
  const { action, query = '', folderId, name, content, mimeType = 'text/plain', fileId } = body || {};

  const dFetch = async (path, opts = {}) => {
    const r = await fetch(`https://www.googleapis.com/drive/v3${path}`, {
      ...opts, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });
    if (!r.ok) { const e = await r.json(); throw new Error(e.error?.message || `Drive ${r.status}`); }
    return r.json();
  };

  try {
    if (action === 'list') {
      const q = query ? `name contains '${query}' and trashed=false` : 'trashed=false';
      const data = await dFetch(`/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=20&orderBy=modifiedTime desc`);
      return res.json({ files: data.files || [] });
    }
    if (action === 'create-folder') {
      const meta = { name, mimeType: 'application/vnd.google-apps.folder', ...(folderId ? { parents: [folderId] } : {}) };
      const f = await dFetch('/files', { method: 'POST', body: JSON.stringify(meta) });
      return res.json({ created: true, id: f.id, name: f.name });
    }
    if (action === 'upload') {
      const boundary = 'neura_boundary_314159';
      const meta = { name, ...(folderId ? { parents: [folderId] } : {}) };
      const body = `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n${content}\r\n--${boundary}--`;
      const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': `multipart/related; boundary="${boundary}"` }, body,
      });
      const f = await r.json();
      return res.json({ uploaded: true, id: f.id, name: f.name });
    }
    if (action === 'read') {
      const r = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json({ content: await r.text() });
    }
    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (e) {
    console.error('[DRIVE]', e.message);
    return res.status(500).json({ error: e.message });
  }
};
