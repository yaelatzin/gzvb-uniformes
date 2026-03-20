// =============================================
// BOTÓN DE DESCARGA
// Usa las constantes definidas en cada página
// =============================================
async function loadDownloadButton(uniformSlug) {
  const container = document.getElementById('download-btn-container');
  if (!container) return;

  try {
    const listRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/list/uniformes`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ prefix: uniformSlug + '/', limit: 10 })
      }
    );

    const files = await listRes.json();

    if (!files || files.length === 0 || files.error) {
      container.innerHTML = `<span class="no-file-msg">📁 Archivo no disponible aún</span>`;
      return;
    }

    const btns = files.map(file => {
      const url = `${SUPABASE_URL}/storage/v1/object/public/uniformes/${uniformSlug}/${file.name}`;
      const ext = file.name.split('.').pop().toUpperCase();
      return `
        <a href="${url}" download class="btn-download">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar ${ext}
        </a>`;
    }).join('');

    container.innerHTML = btns;

  } catch (err) {
    console.error('Error cargando archivos:', err);
    container.innerHTML = `<span class="no-file-msg">📁 Archivo no disponible aún</span>`;
  }
}
