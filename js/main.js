const SUPABASE_URL      = 'https://fwzubitfjthyhmmlrrkg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3enViaXRmanRoeWhtbWxycmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMTk2NTUsImV4cCI6MjA4OTU5NTY1NX0.ie3sQzRGewp-5Hw10wPy2ainfy8L-pgmDSUAA-YCo54';
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/notificar-descarga`;

// ─── MODAL STYLES ─────────────────────────────────────────────
const modalCSS = `
  #download-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 9999; padding: 20px;
    animation: fadeInDL 0.2s ease;
  }
  @keyframes fadeInDL { from { opacity: 0; } to { opacity: 1; } }

  #download-modal {
    background: #111; border: 1px solid #2a2a2a;
    border-radius: 16px; padding: 32px 28px;
    width: 100%; max-width: 420px;
  }
  #download-modal h3 {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1.6rem; letter-spacing: 2px; margin-bottom: 8px;
  }
  #download-modal p { color: #888; font-size: 0.85rem; margin-bottom: 24px; }

  .modal-field-dl {
    display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;
  }
  .modal-field-dl label {
    font-size: 0.75rem; text-transform: uppercase;
    letter-spacing: 1.5px; color: #666;
  }
  .modal-field-dl input {
    background: #1a1a1a; border: 1px solid #2a2a2a;
    border-radius: 8px; padding: 11px 14px;
    color: #f5f5f5; font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem; outline: none;
    transition: border-color 0.2s; width: 100%;
  }
  .modal-field-dl input:focus { border-color: #c8ff00; }

  .modal-actions-dl { display: flex; gap: 10px; margin-top: 24px; }
  .modal-btn-confirm-dl {
    flex: 1; padding: 12px;
    background: #c8ff00; color: #000;
    font-family: 'Bebas Neue', sans-serif;
    font-size: 1rem; letter-spacing: 2px;
    border: none; border-radius: 8px; cursor: pointer;
    transition: opacity 0.2s;
  }
  .modal-btn-confirm-dl:hover { opacity: 0.85; }
  .modal-btn-confirm-dl:disabled { opacity: 0.5; cursor: not-allowed; }
  .modal-btn-cancel-dl {
    padding: 12px 20px; background: transparent; color: #666;
    border: 1px solid #2a2a2a; border-radius: 8px;
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem; transition: border-color 0.2s, color 0.2s;
  }
  .modal-btn-cancel-dl:hover { border-color: #ff4d4d; color: #ff4d4d; }
  .modal-error-dl { color: #ff4d4d; font-size: 0.8rem; margin-top: 8px; display: none; }
  .modal-hint { font-size: 0.75rem !important; color: #555 !important; margin-bottom: 4px !important; }
`;

const styleEl = document.createElement('style');
styleEl.textContent = modalCSS;
document.head.appendChild(styleEl);

// ─── SUPABASE CLIENT ──────────────────────────────────────────
const { createClient } = supabase;
const sbMain = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── MOSTRAR MODAL DE DESCARGA CON CLAVE ──────────────────────
function mostrarModalDescarga(fileUrl, fileName, uniformeNombre) {
  const existing = document.getElementById('download-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'download-modal-overlay';
  overlay.innerHTML = `
    <div id="download-modal">
      <h3>Descargar archivo</h3>
      <p>Ingresa tus datos para continuar con la descarga de <b>${fileName}</b></p>

      <div class="modal-field-dl">
        <label>Nombre completo</label>
        <input type="text" id="modal-nombre" placeholder="Tu nombre" autocomplete="name">
      </div>

      <div class="modal-field-dl">
        <label>Clave única de descarga</label>
        <p class="modal-hint">Si no tienes una clave, realiza primero tu pedido.</p>
        <input type="text" id="modal-clave" placeholder="XXXX-XXXX-XXXX" style="text-transform:uppercase;letter-spacing:2px">
      </div>

      <p class="modal-error-dl" id="modal-error"></p>

      <div class="modal-actions-dl">
        <button class="modal-btn-cancel-dl" onclick="cerrarModalDescarga()">Cancelar</button>
        <button class="modal-btn-confirm-dl" id="modal-confirm-btn"
          onclick="confirmarDescarga('${fileUrl}', '${fileName}', '${uniformeNombre}')">
          Descargar
        </button>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('modal-nombre')?.focus(), 100);
}

function cerrarModalDescarga() {
  const overlay = document.getElementById('download-modal-overlay');
  if (overlay) overlay.remove();
}

async function confirmarDescarga(fileUrl, fileName, uniformeNombre) {
  const nombre = document.getElementById('modal-nombre').value.trim();
  const clave  = document.getElementById('modal-clave').value.trim().toUpperCase();
  const errEl  = document.getElementById('modal-error');
  const btn    = document.getElementById('modal-confirm-btn');

  if (!nombre || !clave) {
    errEl.style.display = 'block';
    errEl.textContent = 'Por favor completa todos los campos.';
    return;
  }

  errEl.style.display = 'none';
  btn.textContent = 'Verificando…';
  btn.disabled = true;

  // Verificar clave en Supabase
  const { data: pedido, error } = await sbMain
    .from('pedidos')
    .select('id, usado, nombre')
    .eq('clave_descarga', clave)
    .single();

  if (error || !pedido) {
    errEl.style.display = 'block';
    errEl.textContent = 'Clave inválida. Verifica e intenta de nuevo.';
    btn.textContent = 'Descargar';
    btn.disabled = false;
    return;
  }

  // Iniciar descarga
  const a = document.createElement('a');
  a.href = fileUrl;
  a.download = fileName;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Notificar descarga
  try {
    await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ tipo: 'descarga', nombre, contacto: clave, archivo: fileName, uniforme: uniformeNombre }),
    });
  } catch(e) { console.error(e); }

  cerrarModalDescarga();
}

// ─── CARGAR BOTONES DE DESCARGA ───────────────────────────────
async function loadDownloadButton(uniformSlug) {
  const container = document.getElementById('download-btn-container');
  if (!container) return;

  const uniformeNombre = document.querySelector('.uniform-hero h1')?.textContent || uniformSlug;

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
        <button onclick="mostrarModalDescarga('${url}', '${file.name}', '${uniformeNombre}')" class="btn-download">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Descargar ${ext}
        </button>`;
    }).join('');

    container.innerHTML = btns;

  } catch (err) {
    console.error('Error cargando archivos:', err);
    container.innerHTML = `<span class="no-file-msg">📁 Archivo no disponible aún</span>`;
  }
}
