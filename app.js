/* =========================================================
   Sistema Odonto da Helo - Novo Sorriso
   app.js — Lógica completa: CRUD, Mensagens e Mini-Games
   ========================================================= */

// ─── Constants & Default Templates ─────────────────────────────────────────

const STORAGE_KEY   = 'odonto_helo_clients';
const TEMPLATE_KEY  = 'odonto_helo_templates';
const THEME_KEY     = 'odonto_helo_theme';
const GAME_SCORE_KEY = 'odonto_helo_game_scores';
const CLINIC_NAME   = 'Novo Sorriso';

// Mensagens padrão de lembrete
const DEFAULT_TOMORROW_MESSAGES = [
  "🌟 *[saudacao], [nome]!* Seja muito bem-vindo(a) à *Clínica Odontológica [clinica]* 🦷✨\n\nPassando para te lembrar, com carinho, da sua consulta de *[procedimento]*:\n\n🗓️ *AMANHÃ*\n⏰ *ÀS [hora]*\n\n💙 Nossa equipe já está preparada para te receber com todo cuidado, conforto e atenção para que você tenha a melhor experiência possível!\n\n📍 *Clínica [clinica]*\n🦷 Cuidando do seu sorriso com carinho e dedicação\n\nSe houver qualquer dúvida ou imprevisto, estamos à disposição por aqui 💬\n\n✨ *Te esperamos! Até logo!* 😄",
  "🌟 *[saudacao], [nome]!* Seja muito bem-vindo(a) à *Clínica Odontológica [clinica]* 🦷✨\n\nPassando para te lembrar, com carinho, da sua consulta de *[procedimento]*:\n\n🗓️ *AMANHÃ*\n⏰ *ÀS [hora]*\n\n💙 Nossa equipe já está preparada para te receber com todo cuidado, conforto e atenção para que você tenha a melhor experiência possível!\n\n📍 *Clínica [clinica]*\n🦷 Cuidando do seu sorriso com carinho e dedicação\n\nSe houver qualquer dúvida ou imprevisto, estamos à disposição por aqui 💬\n\n✨ *Te esperamos! Até logo!* 😄",
  "🌟 *[saudacao], [nome]!* Seja muito bem-vindo(a) à *Clínica Odontológica [clinica]* 🦷✨\n\nPassando para te lembrar, com carinho, da sua consulta de *[procedimento]*:\n\n🗓️ *AMANHÃ*\n⏰ *ÀS [hora]*\n\n💙 Nossa equipe já está preparada para te receber com todo cuidado, conforto e atenção para que você tenha a melhor experiência possível!\n\n📍 *Clínica [clinica]*\n🦷 Cuidando do seu sorriso com carinho e dedicação\n\nSe houver qualquer dúvida ou imprevisto, estamos à disposição por aqui 💬\n\n✨ *Te esperamos! Até logo!* 😄"
];

const DEFAULT_TODAY_MESSAGES = [
  "🌟 *[saudacao], [nome]!* Seja muito bem-vindo(a) à *Clínica Odontológica [clinica]* 🦷✨\n\nPassando para te lembrar, com carinho, da sua consulta de *[procedimento]*:\n\n🗓️ *HOJE*\n⏰ *ÀS [hora]*\n\n💙 Nossa equipe já está preparada para te receber com todo cuidado, conforto e atenção para que você tenha a melhor experiência possível!\n\n📍 *Clínica [clinica]*\n🦷 Cuidando do seu sorriso com carinho e dedicação\n\nSe houver qualquer dúvida ou imprevisto, estamos à disposição por aqui 💬\n\n✨ *Te esperamos! Até logo!* 😄",
  "🌟 *[saudacao], [nome]!* Seja muito bem-vindo(a) à *Clínica Odontológica [clinica]* 🦷✨\n\nPassando para te lembrar, com carinho, da sua consulta de *[procedimento]*:\n\n🗓️ *HOJE*\n⏰ *ÀS [hora]*\n\n💙 Nossa equipe já está preparada para te receber com todo cuidado, conforto e atenção para que você tenha a melhor experiência possível!\n\n📍 *Clínica [clinica]*\n🦷 Cuidando do seu sorriso com carinho e dedicação\n\nSe houver qualquer dúvida ou imprevisto, estamos à disposição por aqui 💬\n\n✨ *Te esperamos! Até logo!* 😄",
  "🌟 *[saudacao], [nome]!* Seja muito bem-vindo(a) à *Clínica Odontológica [clinica]* 🦷✨\n\nPassando para te lembrar, com carinho, da sua consulta de *[procedimento]*:\n\n🗓️ *HOJE*\n⏰ *ÀS [hora]*\n\n💙 Nossa equipe já está preparada para te receber com todo cuidado, conforto e atenção para que você tenha a melhor experiência possível!\n\n📍 *Clínica [clinica]*\n🦷 Cuidando do seu sorriso com carinho e dedicação\n\nSe houver qualquer dúvida ou imprevisto, estamos à disposição por aqui 💬\n\n✨ *Te esperamos! Até logo!* 😄"
];

const MASCOT_MESSAGES = [
  'Olá, Helo! Vamos cuidar de sorrisos brilhantes hoje? 🌸',
  'Cada sorriso que você cuida brilha mais! 🦷✨',
  'Você é incrível! Desejo um ótimo dia de trabalho! 💕',
  'Novo Sorriso: espalhando alegria e dentes saudáveis! 😊',
  'Dica: use o botão direito para gerenciar os clientes! ⭐'
];

// ─── Global State ──────────────────────────────────────────────────────────

let clients = [];
let activeClientIdForCtx = null;

let activeTemplates = {
  tomorrow: [],
  today: []
};

// ─── CRUD & Client Management ──────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

function saveClients() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
}

function cleanStringForWhatsapp(str) {
  if (!str) return '';
  // Remove apenas caracteres de controle que realmente quebram a URL, preservando emojis e quebras de linha
  return str.normalize('NFC');
}

function sortChronologically(clientArray) {
  return clientArray.sort((a, b) => {
    const da = parseLocalDateTime(a.date, a.time);
    const db = parseLocalDateTime(b.date, b.time);
    return da - db;
  });
}

function loadClients() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    clients = JSON.parse(raw);
    clients = sortChronologically(clients);
  } else {
    // Inicia o sistema sem clientes predefinidos
    clients = [];
    saveClients();
  }
}

// ─── Templates Customization Logic ──────────────────────────────────────────

function loadTemplates() {
  const raw = localStorage.getItem(TEMPLATE_KEY);
  if (raw) {
    activeTemplates = JSON.parse(raw);
    
    // Forçar atualização se o template antigo ainda estiver no localStorage
    if (!activeTemplates.today[0].includes('🌟')) {
      activeTemplates.tomorrow  = [...DEFAULT_TOMORROW_MESSAGES];
      activeTemplates.today     = [...DEFAULT_TODAY_MESSAGES];
      saveTemplatesToStorage();
    }
  } else {
    activeTemplates.tomorrow  = [...DEFAULT_TOMORROW_MESSAGES];
    activeTemplates.today     = [...DEFAULT_TODAY_MESSAGES];
    saveTemplatesToStorage();
  }
  fillTemplatesForm();
}

function saveTemplatesToStorage() {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(activeTemplates));
}

function fillTemplatesForm() {
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById(`template-tomorrow-${i}`);
    if (el) el.value = activeTemplates.tomorrow[i] || '';
  }
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById(`template-today-${i}`);
    if (el) el.value = activeTemplates.today[i] || '';
  }
}

function saveTemplates(event) {
  if (event) event.preventDefault();

  for (let i = 0; i < 3; i++) {
    const val = document.getElementById(`template-tomorrow-${i}`).value.trim();
    if (val) activeTemplates.tomorrow[i] = val;
  }
  for (let i = 0; i < 3; i++) {
    const val = document.getElementById(`template-today-${i}`).value.trim();
    if (val) activeTemplates.today[i] = val;
  }

  saveTemplatesToStorage();
  showToast('💾 Modelos Salvos!', 'Lembretes personalizados salvos com sucesso.');
}

function resetSingleTemplate(type, index) {
  if (type === 'tomorrow') {
    activeTemplates.tomorrow[index] = DEFAULT_TOMORROW_MESSAGES[index];
    const el = document.getElementById(`template-tomorrow-${index}`);
    if (el) el.value = DEFAULT_TOMORROW_MESSAGES[index];
  } else if (type === 'today') {
    activeTemplates.today[index] = DEFAULT_TODAY_MESSAGES[index];
    const el = document.getElementById(`template-today-${index}`);
    if (el) el.value = DEFAULT_TODAY_MESSAGES[index];
  }
  saveTemplatesToStorage();
  showToast('🔄 Lembrete Restaurado', 'Mensagem reiniciada para a versão padrão.');
}

function resetAllTemplates() {
  if (!confirm('Restaurar TODOS os textos para o padrão original da clínica Novo Sorriso?')) return;

  activeTemplates.tomorrow  = [...DEFAULT_TOMORROW_MESSAGES];
  activeTemplates.today     = [...DEFAULT_TODAY_MESSAGES];
  
  saveTemplatesToStorage();
  fillTemplatesForm();
  showToast('🔄 Padrões Restaurados!', 'Todas as mensagens foram reiniciadas.');
}

// ─── WhatsApp Link Generation ───────────────────────────────────────────────

function replacePlaceholders(templateStr, client) {
  const dateDisp = formatDateDisplay(client.date);
  const greeting = getGreeting();
  
  return templateStr
    .replace(/\[nome\]/gi, client.name)
    .replace(/\[procedimento\]/gi, client.type)
    .replace(/\[data\]/gi, dateDisp)
    .replace(/\[hora\]/gi, client.time)
    .replace(/\[clinica\]/gi, CLINIC_NAME)
    .replace(/\[saudacao\]/gi, greeting);
}

function buildWhatsAppLink(client) {
  const diff      = daysDiff(parseLocalDateTime(client.date, client.time));

  let rawMessage = '';

  if (diff === 0) {
    const randomTemplate = randomItem(activeTemplates.today) || DEFAULT_TODAY_MESSAGES[0];
    rawMessage = replacePlaceholders(randomTemplate, client);
  } else {
    const randomTemplate = randomItem(activeTemplates.tomorrow) || DEFAULT_TOMORROW_MESSAGES[0];
    rawMessage = replacePlaceholders(randomTemplate, client);
  }

  const cleanedMessage = cleanStringForWhatsapp(rawMessage);
  const phone = cleanPhone(client.phone);
  const waPhone = phone.startsWith('55') ? phone : `55${phone}`;
  
  // A melhor forma de garantir emojis é usar o link api.whatsapp.com ou wa.me 
  // com a codificação URI padrão, mas garantindo que o navegador não corrompa os bytes.
  // Vamos usar o formato que o próprio WhatsApp gera.
  const encodedText = encodeURIComponent(cleanedMessage)
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27');
  
  return `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodedText}`;
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

function parseLocalDateTime(date, time) {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min]  = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0);
}

function toMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysDiff(targetDate) {
  const now   = toMidnight(new Date());
  const tgt   = toMidnight(targetDate);
  return Math.round((tgt - now) / (1000 * 60 * 60 * 24));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12)  return 'Bom dia';
  if (hour < 18)  return 'Boa tarde';
  return 'Boa noite';
}

function formatDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function cleanPhone(phone) {
  return phone.replace(/\D/g, '');
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Reminder Logic ─────────────────────────────────────────────────────────

function needsReminder(client) {
  if (client.status === 'canceled') return false;
  const appt = parseLocalDateTime(client.date, client.time);
  const diff  = daysDiff(appt);
  if (diff === 0) return !client.notifiedToday;
  if (diff === 1) return !client.notifiedTomorrow;
  return false;
}

// ─── Mark as Contacted ──────────────────────────────────────────────────────

function markContacted(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  const diff = daysDiff(parseLocalDateTime(client.date, client.time));
  if (diff === 0) client.notifiedToday     = true;
  if (diff === 1) client.notifiedTomorrow  = true;

  saveClients();
  renderAll();
}

function contactClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  const link = buildWhatsAppLink(client);
  window.open(link, '_blank');
  
  setTimeout(() => {
    markContacted(clientId);
  }, 600);
}

// ─── Statistics ─────────────────────────────────────────────────────────────

function updateStats() {
  const total     = clients.length;
  const todayAppt = clients.filter(c => {
    if (c.status === 'canceled') return false;
    return daysDiff(parseLocalDateTime(c.date, c.time)) === 0;
  }).length;
  const tomorrowAppt = clients.filter(c => {
    if (c.status === 'canceled') return false;
    return daysDiff(parseLocalDateTime(c.date, c.time)) === 1;
  }).length;
  const pending = clients.filter(needsReminder).length;

  document.getElementById('stat-total-clients').textContent      = total;
  document.getElementById('stat-today-appointments').textContent = todayAppt;
  document.getElementById('stat-tomorrow-appointments').textContent = tomorrowAppt;
  document.getElementById('stat-pending-contacts').textContent   = pending;

  const pendingBadge = document.getElementById('stat-pending-badge');
  if (pendingBadge && pending > 0) {
    pendingBadge.classList.add('alert-num');
  } else if (pendingBadge) {
    pendingBadge.classList.remove('alert-num');
  }
}

// ─── Render Tables ─────────────────────────────────────────────────────────

function renderUpcomingTable() {
  const tbody = document.getElementById('upcoming-tbody');
  
  const upcoming = clients.filter(c => {
    if (c.status === 'canceled') return false;
    const diff = daysDiff(parseLocalDateTime(c.date, c.time));
    return diff >= 0;
  });

  if (upcoming.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state" style="padding:2rem">
      <i data-lucide="calendar-off"></i>
      <p>Nenhum agendamento ativo cadastrado.</p>
    </div></td></tr>`;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = upcoming.map(c => buildTableRow(c, false)).join('');
  attachContextMenuEvents();
  lucide.createIcons();
}

function renderAllClientsTable(filtered) {
  const tbody = document.getElementById('all-clients-tbody');
  const list  = filtered !== undefined ? filtered : clients;

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state" style="padding:2rem">
      <i data-lucide="users"></i>
      <p>Nenhum cliente cadastrado no sistema.</p>
    </div></td></tr>`;
    lucide.createIcons();
    return;
  }

  tbody.innerHTML = list.map(c => buildTableRow(c, true)).join('');
  attachContextMenuEvents();
  lucide.createIcons();
}

function buildTableRow(client, showCpf) {
  const diff        = daysDiff(parseLocalDateTime(client.date, client.time));
  const dateDisplay = formatDateDisplay(client.date);
  const statusClass = client.status === 'canceled' ? 'badge-canceled' : 'badge-confirmed';
  const statusLabel = client.status === 'canceled' ? 'Cancelado' : 'Confirmado';

  let reminderStatus;
  if (client.status === 'canceled') {
    reminderStatus = `<span class="badge badge-canceled">Cancelado</span>`;
  } else if (diff < 0) {
    reminderStatus = `<span style="font-size:0.8rem;color:var(--text-muted)">Realizada</span>`;
  } else if (diff === 0) {
    reminderStatus = client.notifiedToday
      ? `<span class="reminder-ok"><i data-lucide="check-circle-2"></i> Avisado Hoje</span>`
      : `<span class="reminder-warning reminder-urgent">⚡ Avisar HOJE!</span>`;
  } else if (diff === 1) {
    reminderStatus = client.notifiedTomorrow
      ? `<span class="reminder-ok"><i data-lucide="check-circle-2"></i> Avisado 1d</span>`
      : `<span class="reminder-warning">⚠ Avisar Amanhã</span>`;
  } else {
    reminderStatus = `<span style="font-size:0.8rem;color:var(--text-muted)">Em ${diff} dias</span>`;
  }

  const cpfCell = showCpf
    ? `<td>${client.cpf ? escapeHtml(client.cpf) : '<span style="color:var(--text-muted)">—</span>'}</td>`
    : '';

  return `
    <tr data-id="${client.id}" class="client-row">
      <td>
        <div class="cell-client-name">${escapeHtml(client.name)}</div>
        <div class="cell-phone">${escapeHtml(client.phone)}</div>
      </td>
      ${cpfCell}
      <td><span class="procedure-badge">${escapeHtml(client.type)}</span></td>
      <td>
        <div class="cell-datetime">
          <span class="cell-date">${dateDisplay}</span>
          <span class="cell-time">${client.time}</span>
        </div>
      </td>
      <td>${reminderStatus}</td>
      <td><span class="badge ${statusClass}">${statusLabel}</span></td>
    </tr>`;
}

// ─── Custom Floating Context Menu ───────────────────────────────────────────

function attachContextMenuEvents() {
  document.querySelectorAll('.client-row').forEach(row => {
    row.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      
      const clientId = this.getAttribute('data-id');
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      activeClientIdForCtx = clientId;

      document.getElementById('ctx-client-name').textContent = client.name;
      document.getElementById('ctx-client-info').textContent = `${client.type} • ${formatDateDisplay(client.date)} às ${client.time}`;

      const cancelLi = document.getElementById('ctx-cancel-li');
      if (client.status === 'canceled') {
        cancelLi.innerHTML = '<i data-lucide="refresh-cw"></i><span>Reativar Agendamento</span>';
      } else {
        cancelLi.innerHTML = '<i data-lucide="x-circle"></i><span>Cancelar Agendamento</span>';
      }

      const wppLi = document.getElementById('ctx-wpp-li');
      if (needsReminder(client)) {
        wppLi.style.fontWeight = '800';
      } else {
        wppLi.style.fontWeight = '600';
      }

      lucide.createIcons();

      const menu = document.getElementById('context-menu');
      const menuWidth = 220;
      const menuHeight = 175;
      let top = e.pageY;
      let left = e.pageX;

      if (left + menuWidth > window.innerWidth + window.scrollX) {
        left = window.innerWidth + window.scrollX - menuWidth - 10;
      }
      if (top + menuHeight > window.innerHeight + window.scrollY) {
        top = window.innerHeight + window.scrollY - menuHeight - 10;
      }

      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
      menu.classList.add('active');
    });
  });
}

document.addEventListener('click', function(e) {
  const menu = document.getElementById('context-menu');
  if (menu && !menu.contains(e.target)) {
    menu.classList.remove('active');
  }
});

window.addEventListener('scroll', function() {
  const menu = document.getElementById('context-menu');
  if (menu) menu.classList.remove('active');
}, true);

// ─── Trigger Context Actions ────────────────────────────────────────────────

function triggerCtxWhatsapp() {
  if (!activeClientIdForCtx) return;
  contactClient(activeClientIdForCtx);
  document.getElementById('context-menu').classList.remove('active');
}

function triggerCtxEdit() {
  if (!activeClientIdForCtx) return;
  openEditModal(activeClientIdForCtx);
  document.getElementById('context-menu').classList.remove('active');
}

function triggerCtxCancel() {
  if (!activeClientIdForCtx) return;
  cancelClient(activeClientIdForCtx);
  document.getElementById('context-menu').classList.remove('active');
}

function triggerCtxDelete() {
  if (!activeClientIdForCtx) return;
  deleteClient(activeClientIdForCtx);
  document.getElementById('context-menu').classList.remove('active');
}

// ─── Filter & Sort Clients ──────────────────────────────────────────────────

function filterClients() {
  const search    = document.getElementById('client-search').value.toLowerCase().trim();
  const status    = document.getElementById('filter-status').value;
  const timeframe = document.getElementById('filter-timeframe').value;

  let filtered = [...clients];

  if (search) {
    filtered = filtered.filter(c =>
      c.name.toLowerCase().includes(search)  ||
      c.phone.includes(search)               ||
      (c.cpf && c.cpf.includes(search))
    );
  }

  if (status !== 'all') {
    filtered = filtered.filter(c => c.status === status);
  }

  if (timeframe !== 'all') {
    filtered = filtered.filter(c => {
      const diff = daysDiff(parseLocalDateTime(c.date, c.time));
      if (timeframe === 'today')    return diff === 0;
      if (timeframe === 'tomorrow') return diff === 1;
      if (timeframe === 'upcoming') return diff > 1 && diff <= 60;
      if (timeframe === 'past')     return diff < 0;
      return true;
    });
  }

  filtered = sortChronologically(filtered);
  renderAllClientsTable(filtered);
}

// ─── Render All ─────────────────────────────────────────────────────────────

function renderAll() {
  clients = sortChronologically(clients);
  updateStats();
  renderUpcomingTable();
  filterClients();
  updateGreeting();
  lucide.createIcons();
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

function openClientModal() {
  const modal = document.getElementById('client-modal');
  document.getElementById('modal-title').innerHTML = '<i data-lucide="user-plus"></i> Novo Cliente';
  document.getElementById('client-form').reset();
  document.getElementById('client-id').value = '';
  
  // Reset custom type field
  document.getElementById('custom-type-group').style.display = 'none';
  document.getElementById('client-custom-type').required = false;
  
  const today = new Date();
  const yyyy  = today.getFullYear();
  const mm    = String(today.getMonth() + 1).padStart(2, '0');
  const dd    = String(today.getDate()).padStart(2, '0');
  document.getElementById('client-date').value = `${yyyy}-${mm}-${dd}`;
  document.getElementById('client-time').value  = '09:00';
  
  modal.classList.add('active');
  lucide.createIcons();
  
  setTimeout(() => document.getElementById('client-name').focus(), 100);
}

function closeClientModal() {
  document.getElementById('client-modal').classList.remove('active');
}

function openEditModal(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  document.getElementById('modal-title').innerHTML = '<i data-lucide="pencil"></i> Editar Cliente';
  document.getElementById('client-id').value      = client.id;
  document.getElementById('client-name').value    = client.name;
  document.getElementById('client-phone').value   = client.phone;
  document.getElementById('client-cpf').value     = client.cpf   || '';
  
  // Lógica para carregar tipo de procedimento
  const standardTypes = [
    "Consulta Geral", "Limpeza & Profilaxia", "Canal / Endodontia", 
    "Aparelho / Ortodontia", "Restauração", "Extração / Cirurgia", 
    "Implante / Prótese", "Clareamento Dental"
  ];
  
  if (standardTypes.includes(client.type)) {
    document.getElementById('client-type').value = client.type;
    document.getElementById('custom-type-group').style.display = 'none';
    document.getElementById('client-custom-type').required = false;
  } else {
    document.getElementById('client-type').value = 'Outros';
    document.getElementById('custom-type-group').style.display = 'block';
    document.getElementById('client-custom-type').value = client.type;
    document.getElementById('client-custom-type').required = true;
  }
  
  document.getElementById('client-date').value    = client.date;
  document.getElementById('client-time').value    = client.time;
  document.getElementById('client-status').value  = client.status;

  document.getElementById('client-modal').classList.add('active');
  lucide.createIcons();
  
  setTimeout(() => document.getElementById('client-name').focus(), 100);
}

function saveClient(event) {
  event.preventDefault();

  const id     = document.getElementById('client-id').value;
  const name   = document.getElementById('client-name').value.trim();
  const phone  = document.getElementById('client-phone').value.trim();
  const cpf    = document.getElementById('client-cpf').value.trim();
  let   type   = document.getElementById('client-type').value;
  const date   = document.getElementById('client-date').value;
  const time   = document.getElementById('client-time').value;
  const status = document.getElementById('client-status').value;

  if (type === 'Outros') {
    type = document.getElementById('client-custom-type').value.trim() || 'Outros';
  }

  if (id) {
    const idx = clients.findIndex(c => c.id === id);
    if (idx !== -1) {
      const existing = clients[idx];
      const dateChanged = existing.date !== date || existing.time !== time;
      
      clients[idx] = {
        ...existing,
        name,
        phone,
        cpf,
        type,
        date,
        time,
        status,
        notifiedTomorrow: dateChanged ? false : existing.notifiedTomorrow,
        notifiedToday:    dateChanged ? false : existing.notifiedToday,
      };
    }
  } else {
    clients.push({
      id:               generateId(),
      name,
      phone,
      cpf,
      type,
      date,
      time,
      status,
      notifiedTomorrow: false,
      notifiedToday:    false,
      createdAt:        new Date().toISOString(),
    });
  }

  clients = sortChronologically(clients);
  saveClients();
  closeClientModal();
  renderAll();
  
  showToast('💾 Salvo com sucesso', `${name} agora esta na lista.`);
}

function deleteClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  if (!confirm(`Remover definitivamente "${client.name}" do sistema?`)) return;

  clients = clients.filter(c => c.id !== clientId);
  saveClients();
  renderAll();
  showToast('🗑️ Cliente Excluido', `${client.name} foi removido.`);
}

function cancelClient(clientId) {
  const client = clients.find(c => c.id === clientId);
  if (!client) return;

  if (client.status === 'canceled') {
    client.status = 'confirmed';
    showToast('✅ Consulta Ativada', `Consulta de ${client.name} esta ativa.`);
  } else {
    client.status = 'canceled';
    showToast('❌ Consulta Cancelada', `Consulta de ${client.name} foi cancelada.`);
  }

  saveClients();
  renderAll();
}

// ─── Tab Navigation ─────────────────────────────────────────────────────────

function switchTab(tabName) {
  // Reset active tabs & nav items
  document.querySelectorAll('.app-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));

  // Pause active game if switching out of games tab
  if (tabName !== 'games') {
    stopGameLoop();
  }

  document.getElementById(`tab-${tabName}`).classList.add('active');
  const navItem = document.getElementById(`nav-${tabName}`);
  if (navItem) navItem.classList.add('active');

  renderAll();

  // If entering games tab, make sure the currently selected game is ready
  if (tabName === 'games') {
    initGameEngine();
  }

  return false;
}

// ─── Greeting & Date ────────────────────────────────────────────────────────

function updateGreeting() {
  const greeting = getGreeting();
  const now      = new Date();
  const dateStr  = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  document.getElementById('greeting-title').textContent    = `${greeting}, Helo! 👋`;
  document.getElementById('greeting-subtitle').textContent = `${capitalize(dateStr)} • Lista organizada por horario.`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Theme System ───────────────────────────────────────────────────────────

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-theme-${theme}`).classList.add('active');

  // Helo theme special Joguinhos Nav link unlock
  const gamesNav = document.getElementById('nav-games');
  if (theme === 'helo') {
    startSparkles();
    rotateMascotMessage();
    if (gamesNav) {
      gamesNav.style.display = 'block';
      gamesNav.style.animation = 'fadeIn 0.5s ease';
    }
  } else {
    stopSparkles();
    if (gamesNav) {
      gamesNav.style.display = 'none';
    }
    // If the active tab was games, switch back to dashboard since games are locked
    const activeTab = document.querySelector('.app-tab.active');
    if (activeTab && activeTab.id === 'tab-games') {
      switchTab('dashboard');
    }
  }

  lucide.createIcons();
}

function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'light';
  setTheme(saved);
}

// ─── Sparkle System ─────────────────────────────────────────────────────────

let sparkleInterval = null;

function startSparkles() {
  const container = document.getElementById('sparkle-container');
  if (!container) return;
  container.innerHTML = '';

  if (sparkleInterval) clearInterval(sparkleInterval);

  const colors = ['#ff85a2', '#ffb3c6', '#ffccd5', '#ffd700', '#ffccd5'];

  function createSparkle() {
    const el = document.createElement('div');
    el.classList.add('sparkle');
    const size = Math.random() * 6 + 3;
    el.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      background-color: ${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration: ${Math.random() * 4 + 4}s;
      animation-delay: ${Math.random() * 2}s;
      opacity: 0;
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 8000);
  }

  for (let i = 0; i < 8; i++) {
    setTimeout(() => createSparkle(), Math.random() * 2000);
  }

  sparkleInterval = setInterval(createSparkle, 1200);
}

function stopSparkles() {
  if (sparkleInterval) {
    clearInterval(sparkleInterval);
    sparkleInterval = null;
  }
  const container = document.getElementById('sparkle-container');
  if (container) container.innerHTML = '';
}

// ─── Mascot Speech Rotation ─────────────────────────────────────────────────

function rotateMascotMessage() {
  const el = document.getElementById('mascot-speech');
  if (!el) return;

  let idx = 0;
  el.textContent = MASCOT_MESSAGES[idx];

  setInterval(() => {
    idx = (idx + 1) % MASCOT_MESSAGES.length;
    el.style.opacity = '0';
    setTimeout(() => {
      el.textContent = MASCOT_MESSAGES[idx];
      el.style.opacity = '1';
    }, 300);
  }, 6000);
}

// ─── Toast Notification ─────────────────────────────────────────────────────

let toastTimeout = null;

function showToast(title, desc) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.querySelector('.toast-title').textContent = title;
  toast.querySelector('.toast-desc').textContent  = desc;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── Export (Ctrl + I) ──────────────────────────────────────────────────────

function exportClients() {
  if (clients.length === 0) {
    showToast('⚠ Nenhum dado', 'Não ha clientes para exportar.');
    return;
  }

  const json = JSON.stringify(clients, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
  
  a.href     = url;
  a.download = `clientes_novo_sorriso_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('📥 Backup Realizado!', `${clients.length} clientes exportados.`);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'i') {
    e.preventDefault();
    exportClients();
  }
  if (e.key === 'Escape') {
    closeClientModal();
    const menu = document.getElementById('context-menu');
    if (menu) menu.classList.remove('active');
  }
});

// Close modal on background clicks
document.getElementById('client-modal').addEventListener('click', function(e) {
  if (e.target === this) closeClientModal();
});

// Phone & CPF Input Masks
function applyInputMasks() {
  // Listener para o campo "Outros"
  const typeSelect = document.getElementById('client-type');
  const customGroup = document.getElementById('custom-type-group');
  const customInput = document.getElementById('client-custom-type');
  
  if (typeSelect) {
    typeSelect.addEventListener('change', function() {
      if (this.value === 'Outros') {
        customGroup.style.display = 'block';
        customInput.required = true;
        customInput.focus();
      } else {
        customGroup.style.display = 'none';
        customInput.required = false;
      }
    });
  }

  const phoneInput = document.getElementById('client-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      let value = this.value.replace(/\D/g, '');
      if (value.length <= 10) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
      } else {
        value = value.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
      }
      this.value = value;
    });
  }

  const cpfInput = document.getElementById('client-cpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', function() {
      let value = this.value.replace(/\D/g, '');
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
      this.value = value;
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── 3-in-1 Cute Arcade Games Engine ───────────────────────────────────────

let canvas = null;
let ctx = null;
let gameLoopId = null;

let selectedGame = 'snake'; // 'snake' | 'dino' | 'flappy'
let gameState = 'idle'; // 'idle' | 'playing' | 'gameover'
let currentScore = 0;
let highScores = {
  snake: 0,
  dino: 0,
  flappy: 0
};

// Game specific structures
let snake = [];
let snakeDx = 20;
let snakeDy = 0;
let food = { x: 0, y: 0 };
let snakeSpeed = 120;
let lastRenderTime = 0;

let dinoPlayer = { y: 310, vy: 0, gravity: 0.8, jump: -12, height: 40, width: 35, groundY: 310 };
let dinoObstacles = [];
let dinoSpeed = 5;
let dinoFrame = 0;

let flappyPlayer = { y: 200, vy: 0, gravity: 0.45, lift: -7, size: 18 };
let flappyPipes = [];
let flappyFrame = 0;

function loadHighScores() {
  const raw = localStorage.getItem(GAME_SCORE_KEY);
  if (raw) {
    highScores = JSON.parse(raw);
  } else {
    highScores = { snake: 0, dino: 0, flappy: 0 };
    localStorage.setItem(GAME_SCORE_KEY, JSON.stringify(highScores));
  }
}

function saveHighScores() {
  localStorage.setItem(GAME_SCORE_KEY, JSON.stringify(highScores));
}

function initGameEngine() {
  canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  loadHighScores();
  selectMiniGame(selectedGame);
  
  // Custom Keyboard listener inside Joguinhos
  window.addEventListener('keydown', handleGameKeys, true);
}

function stopGameLoop() {
  if (gameLoopId) {
    cancelAnimationFrame(gameLoopId);
    gameLoopId = null;
  }
  gameState = 'idle';
  window.removeEventListener('keydown', handleGameKeys, true);
}

function selectMiniGame(gameKey) {
  stopGameLoop();
  selectedGame = gameKey;
  
  // Highlight active selector card
  document.querySelectorAll('.game-select-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById(`game-card-${gameKey}`);
  if (card) card.classList.add('active');

  // Load scores
  currentScore = 0;
  document.getElementById('game-currentscore').textContent = currentScore;
  document.getElementById('game-highscore').textContent = highScores[gameKey] || 0;

  // Show Overlay
  const overlay = document.getElementById('game-overlay');
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'all';

  const title = document.getElementById('overlay-title');
  const controls = document.getElementById('overlay-controls');

  if (gameKey === 'snake') {
    title.textContent = 'Cobrinha do Sorriso 🐍🌸';
    controls.textContent = 'Use as Setas do teclado';
  } else if (gameKey === 'dino') {
    title.textContent = 'Dentinho Corre 🦷🏃‍♀️';
    controls.textContent = 'Use a Barra de Espaço ou Seta Cima';
  } else if (gameKey === 'flappy') {
    title.textContent = 'Dentinho Voador 🦷🧚‍♀️';
    controls.textContent = 'Use a Barra de Espaço para Voar';
  }

  document.getElementById('overlay-instruction').textContent = 'Pressione ESPAÇO para Iniciar!';
  
  // Initial frame drawing
  drawInitialCanvas();
}

function drawInitialCanvas() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw beautiful pastel backdrop grid
  ctx.fillStyle = '#fff9fb';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  ctx.fillStyle = '#ffeef2';
  ctx.font = '800 24px "Fredoka"';
  ctx.textAlign = 'center';
  ctx.fillText('Novo Sorriso Arcade 🎮', canvas.width / 2, canvas.height / 2 - 20);
}

// ─── Key handler for Game Controls ──────────────────────────────────────────

function handleGameKeys(e) {
  const activeTab = document.querySelector('.app-tab.active');
  if (!activeTab || activeTab.id !== 'tab-games') return;

  // Prevent browser scrolling default actions during gameplay
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }

  if (gameState === 'idle' || gameState === 'gameover') {
    if (e.key === ' ' || e.key === 'Spacebar') {
      startGamePlay();
    }
    return;
  }

  // Playing controls
  if (selectedGame === 'snake') {
    if (e.key === 'ArrowUp' && snakeDy === 0) { snakeDx = 0; snakeDy = -20; }
    if (e.key === 'ArrowDown' && snakeDy === 0) { snakeDx = 0; snakeDy = 20; }
    if (e.key === 'ArrowLeft' && snakeDx === 0) { snakeDx = -20; snakeDy = 0; }
    if (e.key === 'ArrowRight' && snakeDx === 0) { snakeDx = 20; snakeDy = 0; }
  } else if (selectedGame === 'dino') {
    if ((e.key === ' ' || e.key === 'ArrowUp') && dinoPlayer.y >= dinoPlayer.groundY) {
      dinoPlayer.vy = dinoPlayer.jump;
    }
  } else if (selectedGame === 'flappy') {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      flappyPlayer.vy = flappyPlayer.lift;
    }
  }
}

function startGamePlay() {
  gameState = 'playing';
  currentScore = 0;
  document.getElementById('game-currentscore').textContent = currentScore;
  
  // Hide overlay screen
  const overlay = document.getElementById('game-overlay');
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';

  // Setup game modes variables
  if (selectedGame === 'snake') {
    snake = [
      { x: 100, y: 200 },
      { x: 80, y: 200 },
      { x: 60, y: 200 }
    ];
    snakeDx = 20;
    snakeDy = 0;
    snakeSpeed = 130;
    spawnSnakeFood();
    lastRenderTime = 0;
  } else if (selectedGame === 'dino') {
    dinoPlayer.y = dinoPlayer.groundY;
    dinoPlayer.vy = 0;
    dinoObstacles = [];
    dinoSpeed = 5;
    dinoFrame = 0;
  } else if (selectedGame === 'flappy') {
    flappyPlayer.y = 180;
    flappyPlayer.vy = 0;
    flappyPipes = [];
    flappyFrame = 0;
  }

  // Launch Loop
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  gameLoopId = requestAnimationFrame(gameLoop);
}

function triggerGameOver() {
  gameState = 'gameover';
  
  // Save High score if broken
  if (currentScore > (highScores[selectedGame] || 0)) {
    highScores[selectedGame] = currentScore;
    saveHighScores();
    document.getElementById('game-highscore').textContent = currentScore;
    showToast('🏆 NOVO RECORDE!', `Você bateu o recorde de ${currentScore} pontos!`);
  }

  // Display overlay screen
  const overlay = document.getElementById('game-overlay');
  overlay.style.opacity = '1';
  overlay.style.pointerEvents = 'all';

  document.getElementById('overlay-title').textContent = 'Fim de Jogo! 😢';
  document.getElementById('overlay-instruction').textContent = `Sua pontuação: ${currentScore} ⭐`;
  document.getElementById('overlay-controls').textContent = 'Pressione ESPAÇO para jogar novamente';
}

// ─── Main Game Loop Router ──────────────────────────────────────────────────

function gameLoop(currentTime) {
  if (gameState !== 'playing') return;

  if (selectedGame === 'snake') {
    gameLoopId = requestAnimationFrame(gameLoop);
    const msSinceLastRender = currentTime - lastRenderTime;
    if (msSinceLastRender < snakeSpeed) return;
    lastRenderTime = currentTime;
    
    updateSnake();
    drawSnakeGame();
  } else if (selectedGame === 'dino') {
    updateDino();
    drawDinoGame();
    gameLoopId = requestAnimationFrame(gameLoop);
  } else if (selectedGame === 'flappy') {
    updateFlappy();
    drawFlappyGame();
    gameLoopId = requestAnimationFrame(gameLoop);
  }
}

// ─── Game 1: Snake (Cobrinha) Lógica e Desenho ────────────────────────────────

function spawnSnakeFood() {
  const xGrid = canvas.width / 20;
  const yGrid = canvas.height / 20;
  food.x = Math.floor(Math.random() * xGrid) * 20;
  food.y = Math.floor(Math.random() * yGrid) * 20;

  // Make sure food is not on snake
  snake.forEach(part => {
    if (part.x === food.x && part.y === food.y) spawnSnakeFood();
  });
}

function updateSnake() {
  const head = { x: snake[0].x + snakeDx, y: snake[0].y + snakeDy };
  snake.unshift(head);

  // Eaten food
  if (head.x === food.x && head.y === food.y) {
    currentScore += 10;
    document.getElementById('game-currentscore').textContent = currentScore;
    spawnSnakeFood();
    // Speed increases slowly
    if (snakeSpeed > 60) snakeSpeed -= 2;
  } else {
    snake.pop();
  }

  // Wall collisions
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
    triggerGameOver();
  }

  // Self collisions
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) {
      triggerGameOver();
    }
  }
}

function drawSnakeGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background
  ctx.fillStyle = '#fff5f8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid texture sutil
  ctx.strokeStyle = '#ffeef2';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 20) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
  }
  for (let j = 0; j < canvas.height; j += 20) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(canvas.width, j); ctx.stroke();
  }

  // Draw Star Food (Estrelinha)
  ctx.fillStyle = '#ffd700'; // Gold Star
  ctx.shadowColor = 'rgba(255, 215, 0, 0.4)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  drawStar(ctx, food.x + 10, food.y + 10, 5, 10, 5);
  ctx.fill();
  ctx.shadowBlur = 0; // reset

  // Draw Snake (Tooth train pink bubbles)
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? '#ff7597' : '#ffb3c6';
    ctx.beginPath();
    ctx.arc(part.x + 10, part.y + 10, 9, 0, Math.PI * 2);
    ctx.fill();

    // Draw little face on head
    if (index === 0) {
      ctx.fillStyle = '#5c3c49';
      ctx.beginPath();
      // Eyes
      ctx.arc(part.x + 6, part.y + 8, 1.5, 0, Math.PI * 2);
      ctx.arc(part.x + 14, part.y + 8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
}

// ─── Game 2: Dino Runner (Dentinho Corre) Lógica e Desenho ─────────────────

function updateDino() {
  dinoFrame++;

  // Gravity & Physics
  dinoPlayer.vy += dinoPlayer.gravity;
  dinoPlayer.y += dinoPlayer.vy;

  if (dinoPlayer.y > dinoPlayer.groundY) {
    dinoPlayer.y = dinoPlayer.groundY;
    dinoPlayer.vy = 0;
  }

  // Spawn obstacles (Caries bacteria / candys)
  if (dinoFrame % 90 === 0) {
    const isLollipop = Math.random() > 0.5;
    dinoObstacles.push({
      x: canvas.width,
      width: isLollipop ? 20 : 30,
      height: isLollipop ? 50 : 35,
      type: isLollipop ? 'lollipop' : 'bacteria'
    });
  }

  // Scroll obstacles
  dinoObstacles.forEach((obs, idx) => {
    obs.x -= dinoSpeed;

    // Check collision bounding boxes
    if (
      dinoPlayer.y + dinoPlayer.height > canvas.height - obs.height - 40 &&
      obs.x < 100 + dinoPlayer.width &&
      obs.x + obs.width > 100
    ) {
      triggerGameOver();
    }
  });

  // Score points
  if (dinoFrame % 10 === 0) {
    currentScore += 1;
    document.getElementById('game-currentscore').textContent = currentScore;
    // Speed increases slowly
    if (dinoFrame % 500 === 0) dinoSpeed += 0.5;
  }

  // Remove off-screen obstacles
  dinoObstacles = dinoObstacles.filter(o => o.x > -50);
}

function drawDinoGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#fff5f8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Soft Pink Ground line
  ctx.strokeStyle = '#ffd2e1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.lineTo(canvas.width, 350);
  ctx.stroke();

  // Draw Dino (Winged Tooth Mascot)
  const px = 100;
  const py = dinoPlayer.y;
  
  ctx.fillStyle = '#ffffff'; // White tooth
  ctx.beginPath();
  ctx.arc(px + 15, py + 15, 15, Math.PI, 0, false); // top crown
  ctx.fillRect(px, py + 15, 30, 15);
  // Roots
  ctx.arc(px + 6, py + 30, 6, 0, Math.PI * 2);
  ctx.arc(px + 24, py + 30, 6, 0, Math.PI * 2);
  ctx.fill();

  // Little wings flapping
  ctx.fillStyle = 'rgba(255, 133, 162, 0.4)';
  const flapOffset = Math.sin(dinoFrame * 0.3) * 6;
  ctx.beginPath();
  ctx.ellipse(px - 4, py + 15, 8, 10 + flapOffset, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Mascot face details
  ctx.fillStyle = '#5c3c49';
  ctx.beginPath();
  ctx.arc(px + 12, py + 13, 1.5, 0, Math.PI * 2); // left eye
  ctx.arc(px + 22, py + 13, 1.5, 0, Math.PI * 2); // right eye
  ctx.fill();

  ctx.strokeStyle = '#5c3c49';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(px + 17, py + 18, 3, 0, Math.PI, false); // happy mouth
  ctx.stroke();

  // Blush
  ctx.fillStyle = '#ffb3c6';
  ctx.beginPath();
  ctx.arc(px + 8, py + 17, 3, 0, Math.PI * 2);
  ctx.arc(px + 25, py + 17, 3, 0, Math.PI * 2);
  ctx.fill();

  // Draw Obstacles (Angry bacteria or Lollipop candies)
  dinoObstacles.forEach(obs => {
    if (obs.type === 'bacteria') {
      ctx.fillStyle = '#a38cf4'; // Pastel purple bad monster
      ctx.beginPath();
      ctx.arc(obs.x + 15, 350 - 15, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Angry eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(obs.x + 10, 350 - 18, 3, 0, Math.PI * 2);
      ctx.arc(obs.x + 20, 350 - 18, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(obs.x + 10, 350 - 18, 1, 0, Math.PI * 2);
      ctx.arc(obs.x + 20, 350 - 18, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Lollipop candy (Doce)
      ctx.strokeStyle = '#ff85a2'; // pink lollipop
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(obs.x + 10, 350);
      ctx.lineTo(obs.x + 10, 350 - 35);
      ctx.stroke();

      ctx.fillStyle = '#ff85a2';
      ctx.beginPath();
      ctx.arc(obs.x + 10, 350 - 40, 10, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ─── Game 3: Flappy Bird clone (Dentinho Voador) Lógica e Desenho ───────────

function updateFlappy() {
  flappyFrame++;

  // Gravity Physics
  flappyPlayer.vy += flappyPlayer.gravity;
  flappyPlayer.y += flappyPlayer.vy;

  // Collision with ground/ceiling
  if (flappyPlayer.y + flappyPlayer.size > canvas.height || flappyPlayer.y - flappyPlayer.size < 0) {
    triggerGameOver();
  }

  // Spawn pipes (Lollipop Candy Pillars)
  if (flappyFrame % 110 === 0) {
    const gap = 110;
    const minHeight = 40;
    const maxHeight = canvas.height - gap - minHeight;
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
    const bottomHeight = canvas.height - topHeight - gap;

    flappyPipes.push({
      x: canvas.width,
      topHeight: topHeight,
      bottomHeight: bottomHeight,
      width: 50,
      passed: false
    });
  }

  // Scroll and collide pipes
  flappyPipes.forEach(pipe => {
    pipe.x -= 3.5;

    // Check collision bounding boxes
    const px = 150;
    const py = flappyPlayer.y;
    const ps = flappyPlayer.size;

    // Top pipe hit
    if (px + ps > pipe.x && px - ps < pipe.x + pipe.width && py - ps < pipe.topHeight) {
      triggerGameOver();
    }

    // Bottom pipe hit
    if (px + ps > pipe.x && px - ps < pipe.x + pipe.width && py + ps > canvas.height - pipe.bottomHeight) {
      triggerGameOver();
    }

    // Earn points
    if (!pipe.passed && pipe.x + pipe.width < px) {
      pipe.passed = true;
      currentScore += 10;
      document.getElementById('game-currentscore').textContent = currentScore;
    }
  });

  // Remove off-screen pipes
  flappyPipes = flappyPipes.filter(p => p.x > -60);
}

function drawFlappyGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  ctx.fillStyle = '#fff5f8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw Pipes (Candy pillars)
  flappyPipes.forEach(pipe => {
    // Top candy pillar
    ctx.fillStyle = '#ffccd5'; // soft pink bars
    ctx.strokeStyle = '#ff85a2';
    ctx.lineWidth = 2;
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
    ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight);

    // candy head cap
    ctx.fillStyle = '#ff85a2';
    ctx.fillRect(pipe.x - 4, pipe.topHeight - 12, pipe.width + 8, 12);
    ctx.strokeRect(pipe.x - 4, pipe.topHeight - 12, pipe.width + 8, 12);

    // Bottom candy pillar
    ctx.fillStyle = '#ffccd5';
    ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, pipe.width, pipe.bottomHeight);
    ctx.strokeRect(pipe.x, canvas.height - pipe.bottomHeight, pipe.width, pipe.bottomHeight);

    // candy head cap
    ctx.fillStyle = '#ff85a2';
    ctx.fillRect(pipe.x - 4, canvas.height - pipe.bottomHeight, pipe.width + 8, 12);
    ctx.strokeRect(pipe.x - 4, canvas.height - pipe.bottomHeight, pipe.width + 8, 12);
  });

  // Draw Flying Tooth player
  const px = 150;
  const py = flappyPlayer.y;
  const ps = flappyPlayer.size;

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, py - 4, ps - 4, Math.PI, 0, false);
  ctx.fillRect(px - ps + 4, py - 4, (ps - 4) * 2, 8);
  ctx.arc(px - 5, py + 4, 4, 0, Math.PI * 2);
  ctx.arc(px + 5, py + 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Blush
  ctx.fillStyle = '#ffb3c6';
  ctx.beginPath();
  ctx.arc(px - 6, py, 2.5, 0, Math.PI * 2);
  ctx.arc(px + 6, py, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Face
  ctx.fillStyle = '#5c3c49';
  ctx.beginPath();
  ctx.arc(px - 3, py - 3, 1, 0, Math.PI * 2);
  ctx.arc(px + 3, py - 3, 1, 0, Math.PI * 2);
  ctx.fill();

  // Flapping wings
  ctx.fillStyle = 'rgba(163, 140, 244, 0.4)'; // Pastel purple wing
  const flap = Math.sin(flappyFrame * 0.45) * 6;
  ctx.beginPath();
  ctx.ellipse(px - 14, py - 4, 6, 8 + flap, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
}

// ─── Initialize App ─────────────────────────────────────────────────────────

function init() {
  loadClients();
  loadTemplates();
  loadTheme();
  applyInputMasks();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
