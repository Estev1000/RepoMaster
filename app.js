// --- CONFIGURACIÓN PARA EL PROGRAMADOR ---
const CONFIG_INICIAL = {
    name: 'RepoMaster',
    logo: 'repomaster_logo.png',
    subtitle: 'Gestión de Stock'
};

// --- State Management ---
let data = {
    expiryItems: JSON.parse(localStorage.getItem('repo_expiry')) || [],
    shortageItems: JSON.parse(localStorage.getItem('repo_shortages')) || [],
    settings: JSON.parse(localStorage.getItem('repo_settings')) || { ...CONFIG_INICIAL, phone: '' }
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    renderExpiries();
    renderShortages();
    applySettings();

    // Cargar teléfono en el input de la pestaña config
    document.getElementById('set-phone').value = data.settings.phone || '';

    // UI Events
    document.getElementById('fab-add').addEventListener('click', () => {
        const modal = document.getElementById('add-modal');
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
        document.getElementById('item-type').value = 'expiry';
        document.getElementById('expiry-date-group').style.display = 'block';
    });

    document.getElementById('item-type').addEventListener('change', (e) => {
        const dateGroup = document.getElementById('expiry-date-group');
        dateGroup.style.display = e.target.value === 'expiry' ? 'block' : 'none';
    });

    document.getElementById('venc-search').addEventListener('input', (e) => {
        renderExpiries(e.target.value.toLowerCase());
    });
});

// --- Settings ---
function saveQuickSettings() {
    const phoneInput = document.getElementById('set-phone').value;
    data.settings.phone = phoneInput.replace(/\D/g, ''); // Solo números
    localStorage.setItem('repo_settings', JSON.stringify(data.settings));
    alert("Teléfono actualizado correctamente");
}

function applySettings() {
    document.getElementById('app-name').innerText = data.settings.name;
    document.getElementById('app-logo').src = data.settings.logo;
}

// --- Navigation ---
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

    document.getElementById(tabId).classList.add('active');
    el.classList.add('active');
    document.getElementById('add-modal').style.display = 'none';
}

// --- Logic: Add/Delete/Render (Same core logic) ---
function addItem() {
    const name = document.getElementById('item-name').value.trim();
    const type = document.getElementById('item-type').value;
    const date = document.getElementById('item-date').value;

    if (!name) return alert('Por favor, ingresa un nombre');

    if (type === 'expiry') {
        if (!date) return alert('Selecciona una fecha');
        data.expiryItems.push({ id: Date.now(), name, date });
        localStorage.setItem('repo_expiry', JSON.stringify(data.expiryItems));
        renderExpiries();
    } else {
        data.shortageItems.push({ id: Date.now(), name, checked: false });
        localStorage.setItem('repo_shortages', JSON.stringify(data.shortageItems));
        renderShortages();
    }

    document.getElementById('item-name').value = '';
    document.getElementById('item-date').value = '';
    document.getElementById('add-modal').style.display = 'none';
}

function renderExpiries(filter = '') {
    const list = document.getElementById('expiry-list');
    list.innerHTML = '';
    const sorted = [...data.expiryItems].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(item => {
        if (!item.name.toLowerCase().includes(filter)) return;
        const diffDays = Math.ceil((new Date(item.date) - new Date()) / (1000 * 60 * 60 * 24));
        let statusClass = 'safe';
        if (diffDays <= 3) statusClass = 'urgent';
        else if (diffDays <= 7) statusClass = 'warning';
        const div = document.createElement('div');
        div.className = `expiry-item ${statusClass}`;
        div.innerHTML = `
            <div class="item-info"><h4>${item.name}</h4><p>Vence el: ${item.date} (${diffDays} días)</p></div>
            <button class="delete-btn" onclick="deleteItem('expiry', ${item.id})"><i class="fas fa-trash"></i></button>`;
        list.appendChild(div);
    });
}

function renderShortages() {
    const list = document.getElementById('shortage-list');
    list.innerHTML = '';
    data.shortageItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'check-item';
        div.innerHTML = `
            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleShortage(${item.id})">
            <span style="${item.checked ? 'text-decoration: line-through; color: var(--text-muted)' : ''}">${item.name}</span>
            <button class="delete-btn" style="margin-left: auto" onclick="deleteItem('shortage', ${item.id})"><i class="fas fa-trash"></i></button>`;
        list.appendChild(div);
    });
}

function deleteItem(type, id) {
    if (type === 'expiry') {
        data.expiryItems = data.expiryItems.filter(i => i.id !== id);
        localStorage.setItem('repo_expiry', JSON.stringify(data.expiryItems));
        renderExpiries();
    } else {
        data.shortageItems = data.shortageItems.filter(i => i.id !== id);
        localStorage.setItem('repo_shortages', JSON.stringify(data.shortageItems));
        renderShortages();
    }
}

function toggleShortage(id) {
    const item = data.shortageItems.find(i => i.id === id);
    if (item) item.checked = !item.checked;
    localStorage.setItem('repo_shortages', JSON.stringify(data.shortageItems));
    renderShortages();
}

function calculateFaces() {
    const shelf = parseFloat(document.getElementById('calc-shelf').value);
    const prod = parseFloat(document.getElementById('calc-product').value);
    if (shelf > 0 && prod > 0) {
        document.getElementById('calc-result').innerHTML = `Entran: ${Math.floor(shelf / prod)} frentes`;
    }
}

function shareShortages() {
    const pending = data.shortageItems.filter(i => !i.checked).map(i => `- ${i.name}`);
    if (pending.length === 0) return alert('No hay faltantes pendientes.');
    const text = `Lista de Faltantes (${data.settings.name}):\n${pending.join('\n')}`;
    const url = `https://wa.me/${data.settings.phone || ''}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}
