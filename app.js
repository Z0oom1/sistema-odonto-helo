/* =========================================================
   Sistema Odonto da Helo - Novo Sorriso
   app.js — Lógica completa: CRUD, Mensagens e Mini-Games
   ========================================================= */

// ─── Constants & Default Templates ─────────────────────────────────────────

const STORAGE_KEY = 'odonto_helo_clients';
const TEMPLATE_KEY = 'odonto_helo_templates';
const THEME_KEY = 'odonto_helo_theme';
const GAME_SCORE_KEY = 'odonto_helo_game_scores';
const CLINIC_NAME = 'Novo Sorriso';

// Mensagens padrão de lembrete
const DEFAULT_TOMORROW_MESSAGES = [
  "Olá, [nome]! Aqui é da clínica *[clinica]*!\n\nPassando para lembrar que sua consulta de *[procedimento]* está marcada para *amanhã*, dia *[data]*, às *[hora]*. Faltam apenas *1 dia*!\n\nConfirma a presença? A gente está ansiosa para te ver! ",
  "Oi, [nome]! Tudo bem?\n\nSou da equipe *[clinica]* e vim te lembrar que amanhã, *[data]* às *[hora]*, temos sua consulta de *[procedimento]* agendada!\n\nNos vemos amanhã. Qualquer dúvida, pode chamar! ",
  "Olá, [nome]! Aqui é da *[clinica]*.\n\nSó um lembrete carinhoso: sua consulta (*[procedimento]*) é *amanhã*, dia *[data]*, às *[hora]*. Falta 1 dia!\n\nUm sorriso lindo te espera — até amanhã! "
];

const DEFAULT_TODAY_MESSAGES = [
  "Olá, [nome]!  Aqui é da clínica *[clinica]*!\n\nO grande dia chegou! Sua consulta de *[procedimento]* é *hoje*, dia *[data]*, às *[hora]*.\n\nEstamos te esperando com muito carinho! Não se esqueça! ",
  "Oi, [nome]!  Bom dia/boa tarde!\n\nSou da equipe *[clinica]* e vim te lembrar que hoje, *[data]* às *[hora]*, temos sua consulta de *[procedimento]*!\n\nNos vemos em breve, vai ser ótimo! ",
  "[nome], hoje é o dia! 🎉\n\nSua consulta de *[procedimento]* na *[clinica]* é hoje, *[data]* às *[hora]*.\n\nTe esperamos com todo cuidado e carinho! "
];

const MASCOT_MESSAGES = [
  'Oii, amorzinho, te amo muito sabia? 🌸',
  'Que bonitinho você fazendo suas coizinhas de trabalhinho! 🦷✨',
  'Você é incrível Amor! Desejo um ótimo dia de trabalho! 💕',
  'Lembra de me mandar mensagem princesa! 😊',
  'Te amo muito muito ⭐'
];

// ─── Global State ──────────────────────────────────────────────────────────

const CLIENTS_REGISTRY_KEY = 'odonto_helo_clients_registry';
const APPOINTMENTS_KEY = 'odonto_helo_appointments';

let clients = [];
let clientsRegistry = [];
let appointments = [];
let dashboardSelectedDate = '';
let currentTab = 'dashboard';
let activeItemIdForCtx = null;
let activeItemTypeForCtx = null;

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

function saveClientsRegistry() {
  localStorage.setItem(CLIENTS_REGISTRY_KEY, JSON.stringify(clientsRegistry));
}

function saveAppointments() {
  localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
}

function cleanStringForWhatsapp(str) {
  if (!str) return '';
  return str.replace(/[\uFE00-\uFE0F]/g, '');
}

function sortChronologically(clientArray) {
  return clientArray.sort((a, b) => {
    const da = parseLocalDateTime(a.date, a.time);
    const db = parseLocalDateTime(b.date, b.time);
    return da - db;
  });
}
function verificarProcedimentoOutros() {
    const selectProcedimento = document.getElementById('client-type');
    const containerOutro = document.getElementById('container-outro-procedimento');
    const inputOutro = document.getElementById('outro-procedimento');

    if (selectProcedimento.value === 'Outros') {
        containerOutro.style.display = 'block';
        inputOutro.required = true; // Torna o campo obrigatório se visível
        inputOutro.focus();
    } else {
        containerOutro.style.display = 'none';
        inputOutro.required = false;
        inputOutro.value = ''; // Limpa o campo caso mude de ideia
    }
}

function loadClients() {
  migrateData();
  loadClientsRegistry();
  loadAppointments();
}

function loadClientsRegistry() {
  const raw = localStorage.getItem(CLIENTS_REGISTRY_KEY);
  if (raw) {
    try {
      clientsRegistry = JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing clientsRegistry:", e);
      clientsRegistry = [];
    }
  } else {
    clientsRegistry = [];
    saveClientsRegistry();
  }
}

function loadAppointments() {
  const raw = localStorage.getItem(APPOINTMENTS_KEY);
  if (raw) {
    try {
      appointments = JSON.parse(raw);
      appointments = sortAppointments(appointments);
    } catch (e) {
      console.error("Error parsing appointments:", e);
      appointments = [];
    }
  } else {
    appointments = [];
    saveAppointments();
  }
}

function sortAppointments(apptArray) {
  return sortChronologically(apptArray);
}

function sortClientsByName(clientsArray) {
  if (!Array.isArray(clientsArray)) return [];
  return clientsArray.sort((a, b) => {
    const nameA = (a && a.name) ? String(a.name).trim().toLowerCase() : '';
    const nameB = (b && b.name) ? String(b.name).trim().toLowerCase() : '';
    return nameA.localeCompare(nameB, 'pt', { sensitivity: 'base' });
  });
}

function migrateData() {
  const oldRaw = localStorage.getItem(STORAGE_KEY);
  if (oldRaw) {
    let oldClients = [];
    try {
      oldClients = JSON.parse(oldRaw);
    } catch (e) {
      console.error("Failed to parse old localStorage data", e);
    }

    if (Array.isArray(oldClients) && oldClients.length > 0) {
      const existingRegRaw = localStorage.getItem(CLIENTS_REGISTRY_KEY);
      let existingReg = [];
      if (existingRegRaw) {
        try {
          existingReg = JSON.parse(existingRegRaw);
        } catch (e) {
          console.error(e);
        }
      }
      
      const existingApptRaw = localStorage.getItem(APPOINTMENTS_KEY);
      let existingAppt = [];
      if (existingApptRaw) {
        try {
          existingAppt = JSON.parse(existingApptRaw);
        } catch (e) {
          console.error(e);
        }
      }

      oldClients.forEach(oldItem => {
        if (!oldItem) return;
        
        const cleanNameVal = oldItem.name ? oldItem.name.trim() : 'Sem Nome';
        const cleanPhoneVal = oldItem.phone ? cleanPhone(oldItem.phone) : '';
        const cleanCpfVal = oldItem.cpf ? oldItem.cpf.trim() : '';

        // Find if client already exists in registry by Name and Phone, or CPF
        let client = existingReg.find(c => 
          (cleanNameVal && c.name === cleanNameVal && cleanPhoneVal && cleanPhone(c.phone) === cleanPhoneVal) ||
          (cleanCpfVal && c.cpf && c.cpf === cleanCpfVal)
        );

        if (!client) {
          client = {
            id: oldItem.clientId || generateId(),
            name: cleanNameVal,
            phone: oldItem.phone || '',
            cpf: cleanCpfVal,
            createdAt: oldItem.createdAt || new Date().toISOString()
          };
          existingReg.push(client);
        }

        // Create appointment linked to this client
        let status = 'esperando';
        if (oldItem.arrived === true) {
          status = 'chegou';
        } else if (oldItem.status === 'canceled') {
          status = 'canceled';
        } else if (oldItem.status === 'chegou' || oldItem.status === 'não veio' || oldItem.status === 'esperando') {
          status = oldItem.status;
        }

        const appt = {
          id: oldItem.id || generateId(),
          clientId: client.id,
          type: oldItem.type || 'Consulta',
          date: oldItem.date || getTodayDateStr(),
          time: oldItem.time || '09:00',
          status: status,
          notifiedTomorrow: oldItem.notifiedTomorrow || false,
          notifiedToday: oldItem.notifiedToday || false,
          createdAt: oldItem.createdAt || new Date().toISOString()
        };

        // Avoid duplicate appointments
        if (!existingAppt.some(a => a.id === appt.id)) {
          existingAppt.push(appt);
        }
      });

      localStorage.setItem(CLIENTS_REGISTRY_KEY, JSON.stringify(existingReg));
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(existingAppt));
    }
    // Delete the old storage key so we don't migrate again
    localStorage.removeItem(STORAGE_KEY);
  }
}

// ─── Templates Customization Logic ──────────────────────────────────────────

function loadTemplates() {
  const raw = localStorage.getItem(TEMPLATE_KEY);
  let parsed = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing templates:", e);
    }
  }
  if (parsed && Array.isArray(parsed.tomorrow) && Array.isArray(parsed.today)) {
    activeTemplates = parsed;
  } else {
    activeTemplates = {
      tomorrow: [...DEFAULT_TOMORROW_MESSAGES],
      today: [...DEFAULT_TODAY_MESSAGES]
    };
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

  activeTemplates.tomorrow = [...DEFAULT_TOMORROW_MESSAGES];
  activeTemplates.today = [...DEFAULT_TODAY_MESSAGES];

  saveTemplatesToStorage();
  fillTemplatesForm();
  showToast('🔄 Padrões Restaurados!', 'Todas as mensagens foram reiniciadas.');
}

// ─── WhatsApp Link Generation ───────────────────────────────────────────────

function replacePlaceholders(templateStr, client) {
  const dateDisp = formatDateDisplay(client.date);

  return templateStr
    .replace(/\[nome\]/gi, client.name)
    .replace(/\[procedimento\]/gi, client.type)
    .replace(/\[data\]/gi, dateDisp)
    .replace(/\[hora\]/gi, client.time)
    .replace(/\[clinica\]/gi, CLINIC_NAME);
}

function buildWhatsAppLink(client) {
  const greeting = getGreeting();
  const diff = daysDiff(parseLocalDateTime(client.date, client.time));

  let rawMessage = '';

  if (diff === 0) {
    const randomTemplate = randomItem(activeTemplates.today) || DEFAULT_TODAY_MESSAGES[0];
    rawMessage = replacePlaceholders(randomTemplate, client);
  } else {
    const randomTemplate = randomItem(activeTemplates.tomorrow) || DEFAULT_TOMORROW_MESSAGES[0];
    rawMessage = replacePlaceholders(randomTemplate, client);
  }

  rawMessage = `${greeting}! ` + rawMessage;
  rawMessage = cleanStringForWhatsapp(rawMessage);

  const phone = cleanPhone(client.phone);
  const waPhone = phone.startsWith('55') ? phone : `55${phone}`;
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(rawMessage)}`;
}

// ─── Formatting helpers ──────────────────────────────────────────────────────

function parseLocalDateTime(date, time) {
  if (!date) date = getTodayDateStr();
  if (!time) time = '00:00';
  try {
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min, 0);
  } catch (e) {
    console.error("Error parsing date/time:", date, time, e);
    return new Date();
  }
}

function toMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysDiff(targetDate) {
  const now = toMidnight(new Date());
  const tgt = toMidnight(targetDate);
  return Math.round((tgt - now) / (1000 * 60 * 60 * 24));
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  } catch (e) {
    return '';
  }
}

function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Reminder Logic ─────────────────────────────────────────────────────────

function needsReminder(appt) {
  if (appt.status === 'canceled') return false;
  const targetDate = parseLocalDateTime(appt.date, appt.time);
  const diff = daysDiff(targetDate);
  if (diff === 0) return !appt.notifiedToday;
  if (diff === 1) return !appt.notifiedTomorrow;
  return false;
}

// ─── Contacts & Statuses ────────────────────────────────────────────────────

function contactClient(apptId) {
  const appt = appointments.find(a => a.id === apptId);
  if (!appt) return;

  const client = clientsRegistry.find(c => c.id === appt.clientId);
  if (!client) return;

  const url = buildWhatsappUrl(client, appt);
  
  const targetDate = parseLocalDateTime(appt.date, appt.time);
  const diff = daysDiff(targetDate);
  if (diff === 0) {
    appt.notifiedToday = true;
  } else if (diff === 1) {
    appt.notifiedTomorrow = true;
  }

  saveAppointments();
  renderAll();
  
  window.open(url, '_blank');
}

function buildWhatsappUrl(client, appt) {
  const greeting = getGreeting();
  const targetDate = parseLocalDateTime(appt.date, appt.time);
  const diff = daysDiff(targetDate);
  let templatesList = [];

  if (diff === 0) {
    templatesList = activeTemplates.today;
  } else {
    templatesList = activeTemplates.tomorrow;
  }

  let rawMessage = randomItem(templatesList)
    .replace(/\[nome\]/gi, client.name)
    .replace(/\[procedimento\]/gi, appt.type)
    .replace(/\[data\]/gi, formatDateDisplay(appt.date))
    .replace(/\[hora\]/gi, appt.time)
    .replace(/\[clinica\]/gi, CLINIC_NAME);

  rawMessage = `${greeting}! ` + rawMessage;
  rawMessage = cleanStringForWhatsapp(rawMessage);

  const phone = cleanPhone(client.phone);
  const waPhone = phone.startsWith('55') ? phone : `55${phone}`;
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(rawMessage)}`;
}

// ─── Statistics ─────────────────────────────────────────────────────────────

function updateStats() {
  const totalClients = clientsRegistry.length;
  
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tYyyy = tomorrow.getFullYear();
  const tMm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tDd = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${tYyyy}-${tMm}-${tDd}`;

  const todayAppt = appointments.filter(c => {
    if (c.status === 'canceled') return false;
    return c.date === todayStr;
  }).length;

  const tomorrowAppt = appointments.filter(c => {
    if (c.status === 'canceled') return false;
    return c.date === tomorrowStr;
  }).length;

  const pending = appointments.filter(needsReminder).length;

  document.getElementById('stat-total-clients').textContent = totalClients;
  document.getElementById('stat-today-appointments').textContent = todayAppt;
  document.getElementById('stat-tomorrow-appointments').textContent = tomorrowAppt;
  document.getElementById('stat-pending-contacts').textContent = pending;

  const pendingBadge = document.getElementById('stat-pending-badge');
  if (pendingBadge && pending > 0) {
    pendingBadge.classList.add('alert-num');
  } else if (pendingBadge) {
    pendingBadge.classList.remove('alert-num');
  }
}

// ─── Render Dashboard ────────────────────────────────────────────────────────

function initDashboardDate() {
  if (!dashboardSelectedDate) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dashboardSelectedDate = `${yyyy}-${mm}-${dd}`;
  }
  const datePicker = document.getElementById('dashboard-date-picker');
  if (datePicker) {
    datePicker.value = dashboardSelectedDate;
  }
}

function getNextDayStr(dateStr) {
  const parts = dateStr.split('-');
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  date.setDate(date.getDate() + 1);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function adjustDashboardDate(offset) {
  const dateInput = document.getElementById('dashboard-date-picker');
  if (!dateInput || !dateInput.value) return;

  const currentDate = new Date(dateInput.value + 'T00:00:00');
  currentDate.setDate(currentDate.getDate() + offset);

  const yyyy = currentDate.getFullYear();
  const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
  const dd = String(currentDate.getDate()).padStart(2, '0');
  dashboardSelectedDate = `${yyyy}-${mm}-${dd}`;
  dateInput.value = dashboardSelectedDate;

  renderAll();
}

function onDashboardDateChange() {
  const dateInput = document.getElementById('dashboard-date-picker');
  if (dateInput) {
    dashboardSelectedDate = dateInput.value;
    renderAll();
  }
}

function renderDashboardAppointments() {
  initDashboardDate();

  const containerToday = document.getElementById('today-appointments-grid');
  const containerTomorrow = document.getElementById('tomorrow-appointments-grid');

  if (!containerToday || !containerTomorrow) return;

  const nextDayStr = getNextDayStr(dashboardSelectedDate);

  const todayLabel = document.getElementById('label-today-appointments');
  const tomorrowLabel = document.getElementById('label-tomorrow-appointments');

  const formattedToday = formatDateDisplay(dashboardSelectedDate);
  const formattedTomorrow = formatDateDisplay(nextDayStr);

  if (todayLabel) todayLabel.textContent = `Consultas do Dia (${formattedToday})`;
  if (tomorrowLabel) tomorrowLabel.textContent = `Consultas de Amanhã (${formattedTomorrow})`;

  const todayAppts = appointments.filter(a => a.date === dashboardSelectedDate && a.status !== 'canceled');
  const tomorrowAppts = appointments.filter(a => a.date === nextDayStr && a.status !== 'canceled');

  if (todayAppts.length === 0) {
    containerToday.innerHTML = `<div class="empty-state" style="padding:2rem">
      <i data-lucide="calendar-off"></i>
      <p>Nenhuma consulta ativa agendada para este dia.</p>
    </div>`;
  } else {
    containerToday.innerHTML = todayAppts.map(a => buildAppointmentCard(a)).join('');
  }

  if (tomorrowAppts.length === 0) {
    containerTomorrow.innerHTML = `<div class="empty-state" style="padding:2rem">
      <i data-lucide="calendar-off"></i>
      <p>Nenhuma consulta ativa agendada para o dia seguinte.</p>
    </div>`;
  } else {
    containerTomorrow.innerHTML = tomorrowAppts.map(a => buildAppointmentCard(a)).join('');
  }

  lucide.createIcons();
}

function buildAppointmentCard(appt) {
  const client = clientsRegistry.find(c => c.id === appt.clientId) || {
    name: 'Cliente Não Encontrado',
    phone: '',
    cpf: ''
  };

  const diff = daysDiff(parseLocalDateTime(appt.date, appt.time));
  const dateDisplay = formatDateDisplay(appt.date);
  
  let statusClass = 'badge-confirmed';
  let statusLabel = 'Confirmado';
  if (appt.status === 'canceled') {
    statusClass = 'badge-canceled';
    statusLabel = 'Cancelado';
  } else if (appt.status === 'chegou') {
    statusClass = 'badge-confirmed';
    statusLabel = 'Chegou';
  } else if (appt.status === 'não veio') {
    statusClass = 'badge-canceled';
    statusLabel = 'Não Veio';
  } else {
    statusClass = 'badge-confirmed';
    statusLabel = 'Esperando';
  }

  let reminderStatus;
  if (appt.status === 'canceled') {
    reminderStatus = `<span class="badge badge-canceled">Cancelado</span>`;
  } else if (appt.status === 'chegou') {
    reminderStatus = `<span style="font-size:0.8rem;color:#16a34a;font-weight:700;">✅ Atendido</span>`;
  } else if (appt.status === 'não veio') {
    reminderStatus = `<span style="font-size:0.8rem;color:#dc2626;font-weight:700;">❌ Faltou</span>`;
  } else if (diff < 0) {
    reminderStatus = `<span style="font-size:0.8rem;color:var(--text-muted)">Realizada</span>`;
  } else if (diff === 0) {
    reminderStatus = appt.notifiedToday
      ? `<span class="reminder-ok"><i data-lucide="check-circle-2"></i> Avisado Hoje</span>`
      : `<span class="reminder-warning reminder-urgent">⚡ Avisar HOJE!</span>`;
  } else if (diff === 1) {
    reminderStatus = appt.notifiedTomorrow
      ? `<span class="reminder-ok"><i data-lucide="check-circle-2"></i> Avisado 1d</span>`
      : `<span class="reminder-warning">⚠ Avisar Amanhã</span>`;
  } else {
    reminderStatus = `<span style="font-size:0.8rem;color:var(--text-muted)">Em ${diff} dias</span>`;
  }

  const theme = document.documentElement.getAttribute('data-theme');
  const avatarHtml = theme === 'helo'
    ? `<div class="card-emote" title="Emote">🦷</div>`
    : '';

  let statusButton = '';
  if (appt.status === 'esperando' || !appt.status) {
    statusButton = `<button type="button" class="btn-arrive" onclick="event.stopPropagation(); openStatusModal('${appt.id}')" title="Atualizar Status"><i data-lucide="clock"></i> Esperando</button>`;
  } else if (appt.status === 'chegou') {
    statusButton = `<button type="button" class="btn-arrive arrived" onclick="event.stopPropagation(); openStatusModal('${appt.id}')" title="Atualizar Status" style="background-color:#16a34a;color:white;"><i data-lucide="check-check"></i> Chegou!</button>`;
  } else if (appt.status === 'não veio') {
    statusButton = `<button type="button" class="btn-arrive" onclick="event.stopPropagation(); openStatusModal('${appt.id}')" title="Atualizar Status" style="background-color:#dc2626;color:white;"><i data-lucide="x-circle"></i> Não Veio</button>`;
  } else {
    statusButton = `<button type="button" class="btn-arrive" onclick="event.stopPropagation(); openStatusModal('${appt.id}')" title="Atualizar Status"><i data-lucide="help-circle"></i> Status</button>`;
  }

  const genderIcon = client.gender === 'female'
    ? `<i data-lucide="venus" class="client-gender-icon gender-female" title="Mulher"></i>`
    : `<i data-lucide="mars" class="client-gender-icon gender-male" title="Homem"></i>`;

  return `
    <div class="client-card appt-card" data-id="${appt.id}" data-type="appointment">
      ${avatarHtml}
      <div class="card-content">
        <div class="cell-client-name" style="display:flex; align-items:center; gap:0.35rem;">
          ${escapeHtml(client.name)}
          ${genderIcon}
        </div>
        <div class="cell-phone">${escapeHtml(client.phone)}</div>
        <div class="cell-cpf" style="font-size:0.8rem;color:var(--text-muted)">${client.cpf ? escapeHtml(client.cpf) : '—'}</div>
        <div class="procedure-badge" style="margin-top:0.25rem;">${escapeHtml(appt.type)}</div>
        <div class="cell-datetime" style="margin-top:0.25rem;">${dateDisplay} às ${appt.time}</div>
        <div class="reminder-status" style="margin-top:0.25rem;">${reminderStatus}</div>
        <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; gap:0.5rem; flex-wrap:wrap; padding-top:0.5rem;">
          <div class="status-badge ${statusClass}">${statusLabel}</div>
          ${statusButton}
        </div>
      </div>
    </div>`;
}

// ─── Status Selection Modal Logic ──────────────────────────────────────────

function openStatusModal(apptId) {
  const appt = appointments.find(a => a.id === apptId);
  if (!appt) return;

  document.getElementById('status-modal-appt-id').value = apptId;

  document.querySelectorAll('.btn-status-select').forEach(btn => btn.style.border = '2px solid transparent');
  
  const currentStatus = appt.status || 'esperando';
  let activeBtn = null;
  if (currentStatus === 'esperando') {
    activeBtn = document.getElementById('btn-status-waiting');
  } else if (currentStatus === 'chegou') {
    activeBtn = document.getElementById('btn-status-arrived');
  } else if (currentStatus === 'não veio') {
    activeBtn = document.getElementById('btn-status-noshow');
  }

  if (activeBtn) {
    activeBtn.style.border = '2px solid var(--accent-primary)';
  }

  document.getElementById('status-modal').classList.add('active');
}

function closeStatusModal() {
  document.getElementById('status-modal').classList.remove('active');
}

function selectStatus(statusVal) {
  const apptId = document.getElementById('status-modal-appt-id').value;
  const appt = appointments.find(a => a.id === apptId);
  if (!appt) return;

  appt.status = statusVal;
  saveAppointments();
  closeStatusModal();
  renderAll();
  
  const client = clientsRegistry.find(c => c.id === appt.clientId);
  const clientName = client ? client.name : 'Cliente';
  showToast('🔄 Status Atualizado', `${clientName} marcado como ${statusVal}.`);
}

// ─── Client Registry Table & Cards ─────────────────────────────────────────

function renderClientsTable(filtered) {
  const container = document.getElementById('all-clients-grid');
  if (!container) return;

  const list = filtered !== undefined ? filtered : clientsRegistry;

  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:2rem">
      <i data-lucide="users"></i>
      <p>Nenhum cliente cadastrado no sistema.</p>
    </div>`;
    lucide.createIcons();
    return;
  }

  sortClientsByName(list);

  container.innerHTML = list.map(c => buildClientCard(c)).join('');
  lucide.createIcons();
}

function buildClientCard(client) {
  const theme = document.documentElement.getAttribute('data-theme');
  const avatarHtml = theme === 'helo'
    ? `<div class="card-emote" title="Emote">🦷</div>`
    : '';

  const clientAppts = appointments.filter(a => a.clientId === client.id);
  const totalAppts = clientAppts.length;
  const activeAppts = clientAppts.filter(a => a.status === 'esperando').length;

  const genderIcon = client.gender === 'female'
    ? `<i data-lucide="venus" class="client-gender-icon gender-female" title="Mulher"></i>`
    : `<i data-lucide="mars" class="client-gender-icon gender-male" title="Homem"></i>`;

  return `
    <div class="client-card client-profile-card" data-id="${client.id}" data-type="client" style="border-left: 3px solid var(--accent-secondary);">
      ${avatarHtml}
      <div class="card-content">
        <div class="cell-client-name" style="display:flex; align-items:center; gap:0.35rem;">
          ${escapeHtml(client.name)}
          ${genderIcon}
        </div>
        <div class="cell-phone">${escapeHtml(client.phone)}</div>
        <div class="cell-cpf" style="font-size:0.8rem;color:var(--text-muted)">CPF: ${client.cpf ? escapeHtml(client.cpf) : '—'}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.5rem;font-weight:600;">
          📌 ${totalAppts} consultas no total (${activeAppts} ativas)
        </div>
        <div class="card-footer" style="display:flex; justify-content:flex-end; align-items:center; margin-top:auto; gap:0.5rem; padding-top:0.5rem;">
          <button type="button" class="btn btn-secondary" onclick="event.stopPropagation(); openClientEditModal('${client.id}')" style="padding:0.35rem 0.65rem;font-size:0.75rem;">
            <i data-lucide="pencil" style="width:12px;height:12px;"></i> Editar
          </button>
          <button type="button" class="btn btn-secondary" onclick="event.stopPropagation(); deleteClientProfile('${client.id}')" style="padding:0.35rem 0.65rem;font-size:0.75rem;color:#dc2626;">
            <i data-lucide="trash-2" style="width:12px;height:12px;"></i> Excluir
          </button>
        </div>
      </div>
    </div>`;
}

function filterClients() {
  const searchInput = document.getElementById('client-search');
  const search = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const statusInput = document.getElementById('filter-status');
  const statusFilter = statusInput ? statusInput.value : 'all';

  const timeframeInput = document.getElementById('filter-timeframe');
  const timeframeFilter = timeframeInput ? timeframeInput.value : 'all';

  let filtered = [...clientsRegistry];

  // 1. Search term filter (Name, Phone, CPF)
  if (search) {
    filtered = filtered.filter(c => {
      const name = c.name ? String(c.name).toLowerCase() : '';
      const phone = c.phone ? String(c.phone) : '';
      const cpf = c.cpf ? String(c.cpf) : '';
      return name.includes(search) || phone.includes(search) || cpf.includes(search);
    });
  }

  // 2. Status filter based on appointments
  if (statusFilter !== 'all') {
    filtered = filtered.filter(c => {
      const clientAppts = appointments.filter(a => a.clientId === c.id);
      if (statusFilter === 'confirmed') {
        return clientAppts.some(a => a.status === 'esperando' || a.status === 'chegou');
      } else if (statusFilter === 'canceled') {
        return clientAppts.some(a => a.status === 'canceled' || a.status === 'não veio');
      }
      return true;
    });
  }

  // 3. Timeframe filter based on appointments
  if (timeframeFilter !== 'all') {
    const todayStr = getTodayDateStr();
    
    // Calculate tomorrow's date string
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = formatDateKey(tomorrowDate.getFullYear(), tomorrowDate.getMonth() + 1, tomorrowDate.getDate());

    filtered = filtered.filter(c => {
      const clientAppts = appointments.filter(a => a.clientId === c.id);
      if (clientAppts.length === 0) return false;

      return clientAppts.some(a => {
        if (timeframeFilter === 'today') {
          return a.date === todayStr;
        } else if (timeframeFilter === 'tomorrow') {
          return a.date === tomorrowStr;
        } else if (timeframeFilter === 'upcoming') {
          return a.date > tomorrowStr;
        } else if (timeframeFilter === 'past') {
          return a.date < todayStr;
        }
        return true;
      });
    });
  }

  renderClientsTable(filtered);
}

// ─── Client Search & Selection Modal for Appointment Booking ────────────────

function openClientSearchModal() {
  document.getElementById('modal-client-search').value = '';
  filterModalClients();
  document.getElementById('client-search-modal').classList.add('active');
}

function closeClientSearchModal() {
  document.getElementById('client-search-modal').classList.remove('active');
}

function filterModalClients() {
  const query = document.getElementById('modal-client-search').value.toLowerCase().trim();
  const container = document.getElementById('modal-clients-list-container');
  if (!container) return;

  let filtered = [...clientsRegistry];
  if (query) {
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.phone.includes(query) || 
      (c.cpf && c.cpf.includes(query))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div style="padding:1rem;text-align:center;color:var(--text-muted);font-size:0.85rem;">Nenhum cliente cadastrado.</div>`;
    return;
  }

  container.innerHTML = filtered.map(c => `
    <div class="modal-client-item">
      <div class="modal-client-details">
        <span class="modal-client-name">${escapeHtml(c.name)}</span>
        <span class="modal-client-sub">Tel: ${escapeHtml(c.phone)} ${c.cpf ? `• CPF: ${escapeHtml(c.cpf)}` : ''}</span>
      </div>
      <button type="button" class="btn btn-secondary btn-select-client" onclick="selectClientForAppointment('${c.id}')">Selecionar</button>
    </div>
  `).join('');
}

function selectClientForAppointment(clientId) {
  const client = clientsRegistry.find(c => c.id === clientId);
  if (!client) return;

  document.getElementById('appt-client-id').value = client.id;
  document.getElementById('appt-client-name').value = client.name;
  document.getElementById('appt-client-phone').value = client.phone;
  document.getElementById('appt-client-cpf').value = client.cpf || '';
  setApptGender(client.gender || 'male');

  closeClientSearchModal();
}

// ─── History Tab Render & Filters ───────────────────────────────────────────

function renderHistoryTable(filtered) {
  const container = document.getElementById('history-grid');
  if (!container) return;

  let list = [];
  if (filtered !== undefined) {
    list = filtered;
  } else {
    const todayStr = getTodayDateStr();
    list = appointments.filter(a => {
      if (a.status === 'canceled') return true;
      if ((a.status === 'chegou' || a.status === 'não veio') && a.date < todayStr) return true;
      return false;
    });
  }

  list.sort((a, b) => {
    const da = parseLocalDateTime(a.date, a.time);
    const db = parseLocalDateTime(b.date, b.time);
    return db - da;
  });

  if (list.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:2rem">
      <i data-lucide="history"></i>
      <p>Nenhum registro encontrado no histórico.</p>
    </div>`;
    lucide.createIcons();
    return;
  }

  container.innerHTML = list.map(a => buildHistoryCard(a)).join('');
  lucide.createIcons();
}

function buildHistoryCard(appt) {
  const client = clientsRegistry.find(c => c.id === appt.clientId) || {
    name: 'Cliente Não Encontrado',
    phone: '',
    cpf: ''
  };

  const dateDisplay = formatDateDisplay(appt.date);
  
  let statusClass = 'badge-confirmed';
  let statusLabel = 'Confirmado';
  if (appt.status === 'canceled') {
    statusClass = 'badge-canceled';
    statusLabel = 'Cancelado';
  } else if (appt.status === 'chegou') {
    statusClass = 'badge-confirmed';
    statusLabel = 'Chegou';
  } else if (appt.status === 'não veio') {
    statusClass = 'badge-canceled';
    statusLabel = 'Não Veio';
  }

  let statusText = '';
  if (appt.status === 'chegou') {
    statusText = `<span style="font-size:0.8rem;color:#16a34a;font-weight:700;">✅ Compareceu</span>`;
  } else if (appt.status === 'não veio') {
    statusText = `<span style="font-size:0.8rem;color:#dc2626;font-weight:700;">❌ Faltou</span>`;
  } else if (appt.status === 'canceled') {
    statusText = `<span style="font-size:0.8rem;color:#7c3aed;font-weight:700;">💜 Cancelado</span>`;
  }

  const genderIcon = client.gender === 'female'
    ? `<i data-lucide="venus" class="client-gender-icon gender-female" title="Mulher"></i>`
    : `<i data-lucide="mars" class="client-gender-icon gender-male" title="Homem"></i>`;

  return `
    <div class="client-card history-card" data-id="${appt.id}" data-type="appointment" style="opacity: 0.85; border-left: 3px solid var(--text-muted);">
      <div class="card-content">
        <div class="cell-client-name" style="display:flex; align-items:center; gap:0.35rem;">
          ${escapeHtml(client.name)}
          ${genderIcon}
        </div>
        <div class="cell-phone">${escapeHtml(client.phone)}</div>
        <div class="procedure-badge" style="margin-top:0.25rem;">${escapeHtml(appt.type)}</div>
        <div class="cell-datetime" style="margin-top:0.25rem;">${dateDisplay} às ${appt.time}</div>
        <div style="margin-top:0.5rem; display:flex; justify-content:space-between; align-items:center;">
          <div class="status-badge ${statusClass}">${statusLabel}</div>
          ${statusText}
        </div>
      </div>
    </div>`;
}

function filterHistory() {
  const search = document.getElementById('history-search').value.toLowerCase().trim();
  const filterStatus = document.getElementById('filter-history-status').value;
  const todayStr = getTodayDateStr();

  let filtered = appointments.filter(a => {
    if (a.status === 'canceled') return true;
    if ((a.status === 'chegou' || a.status === 'não veio') && a.date < todayStr) return true;
    return false;
  });

  if (search) {
    filtered = filtered.filter(a => {
      const client = clientsRegistry.find(c => c.id === a.clientId);
      return client && client.name.toLowerCase().includes(search);
    });
  }

  if (filterStatus !== 'all') {
    filtered = filtered.filter(a => a.status === filterStatus);
  }

  renderHistoryTable(filtered);
}

// ─── Custom Floating Context Menu ───────────────────────────────────────────

function attachContextMenuEvents() {
  document.querySelectorAll('.client-card').forEach(card => {
    card.addEventListener('contextmenu', function (e) {
      e.preventDefault();

      const itemId = this.getAttribute('data-id');
      const itemType = this.getAttribute('data-type') || 'appointment';

      activeItemIdForCtx = itemId;
      activeItemTypeForCtx = itemType;

      const menu = document.getElementById('context-menu');
      if (!menu) return;

      const cancelLi = document.getElementById('ctx-cancel-li');
      const wppLi = document.getElementById('ctx-wpp-li');

      if (itemType === 'appointment') {
        const appt = appointments.find(a => a.id === itemId);
        if (!appt) return;
        const client = clientsRegistry.find(c => c.id === appt.clientId) || { name: 'Desconhecido' };

        document.getElementById('ctx-client-name').textContent = client.name;
        document.getElementById('ctx-client-info').textContent = `${appt.type} • ${formatDateDisplay(appt.date)} às ${appt.time}`;

        cancelLi.style.display = 'flex';
        if (appt.status === 'canceled') {
          cancelLi.innerHTML = '<i data-lucide="refresh-cw"></i><span>Reativar Consulta</span>';
        } else {
          cancelLi.innerHTML = '<i data-lucide="x-circle"></i><span>Cancelar Consulta</span>';
        }

        wppLi.style.display = 'flex';
        if (needsReminder(appt)) {
          wppLi.style.fontWeight = '800';
        } else {
          wppLi.style.fontWeight = '600';
        }
      } else {
        const client = clientsRegistry.find(c => c.id === itemId);
        if (!client) return;

        document.getElementById('ctx-client-name').textContent = client.name;
        document.getElementById('ctx-client-info').textContent = `Dados do Cliente • Tel: ${client.phone}`;

        wppLi.style.display = 'none';
        cancelLi.style.display = 'none';
      }

      lucide.createIcons();

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

document.addEventListener('click', function (e) {
  const menu = document.getElementById('context-menu');
  if (menu && !menu.contains(e.target)) {
    menu.classList.remove('active');
  }
});

window.addEventListener('scroll', function () {
  const menu = document.getElementById('context-menu');
  if (menu) menu.classList.remove('active');
}, true);

// ─── Trigger Context Actions ────────────────────────────────────────────────

function triggerCtxWhatsapp() {
  if (!activeItemIdForCtx || activeItemTypeForCtx !== 'appointment') return;
  contactClient(activeItemIdForCtx);
  document.getElementById('context-menu').classList.remove('active');
}

function triggerCtxEdit() {
  if (!activeItemIdForCtx) return;
  if (activeItemTypeForCtx === 'appointment') {
    openAppointmentEditModal(activeItemIdForCtx);
  } else {
    openClientEditModal(activeItemIdForCtx);
  }
  document.getElementById('context-menu').classList.remove('active');
}

function triggerCtxCancel() {
  if (!activeItemIdForCtx || activeItemTypeForCtx !== 'appointment') return;
  cancelAppointment(activeItemIdForCtx);
  document.getElementById('context-menu').classList.remove('active');
}

function triggerCtxDelete() {
  if (!activeItemIdForCtx) return;
  if (activeItemTypeForCtx === 'appointment') {
    deleteAppointment(activeItemIdForCtx);
  } else {
    deleteClientProfile(activeItemIdForCtx);
  }
  document.getElementById('context-menu').classList.remove('active');
}

// ─── Render All ─────────────────────────────────────────────────────────────

function renderAll() {
  appointments = sortAppointments(appointments);
  updateStats();
  
  if (currentTab === 'dashboard') {
    renderDashboardAppointments();
  } else if (currentTab === 'calendar') {
    renderCalendar();
  } else if (currentTab === 'clients') {
    renderClientsTable();
  } else if (currentTab === 'history') {
    renderHistoryTable();
  }
  
  attachContextMenuEvents();
  updateGreeting();
  lucide.createIcons();
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

function setGender(genderVal) {
  document.getElementById('profile-client-gender').value = genderVal;
  document.getElementById('gender-male').classList.toggle('active', genderVal === 'male');
  document.getElementById('gender-female').classList.toggle('active', genderVal === 'female');
}

function setApptGender(genderVal) {
  document.getElementById('appt-client-gender').value = genderVal;
  document.getElementById('appt-gender-male').classList.toggle('active', genderVal === 'male');
  document.getElementById('appt-gender-female').classList.toggle('active', genderVal === 'female');
}

function openClientModal() {
  const modal = document.getElementById('client-modal');
  document.getElementById('client-modal-title').textContent = 'Novo Cliente';
  document.getElementById('client-modal-badge').innerHTML = '<i data-lucide="user-plus"></i>';
  document.getElementById('client-form').reset();
  document.getElementById('profile-client-id').value = '';
  setGender('male');

  modal.classList.add('active');
  lucide.createIcons();

  setTimeout(() => document.getElementById('profile-client-name').focus(), 100);
}

function closeClientModal() {
  document.getElementById('client-modal').classList.remove('active');
}

function openClientEditModal(clientId) {
  const client = clientsRegistry.find(c => c.id === clientId);
  if (!client) return;

  document.getElementById('client-modal-title').textContent = 'Editar Dados do Cliente';
  document.getElementById('client-modal-badge').innerHTML = '<i data-lucide="pencil"></i>';
  document.getElementById('profile-client-id').value = client.id;
  document.getElementById('profile-client-name').value = client.name;
  document.getElementById('profile-client-phone').value = client.phone;
  document.getElementById('profile-client-cpf').value = client.cpf || '';
  setGender(client.gender || 'male');

  document.getElementById('client-modal').classList.add('active');
  lucide.createIcons();

  setTimeout(() => document.getElementById('profile-client-name').focus(), 100);
}

function saveClientProfile(event) {
  event.preventDefault();

  const id = document.getElementById('profile-client-id').value;
  const name = document.getElementById('profile-client-name').value.trim();
  const phone = document.getElementById('profile-client-phone').value.trim();
  const cpf = document.getElementById('profile-client-cpf').value.trim();
  const gender = document.getElementById('profile-client-gender').value;

  if (id) {
    const idx = clientsRegistry.findIndex(c => c.id === id);
    if (idx !== -1) {
      clientsRegistry[idx] = {
        ...clientsRegistry[idx],
        name,
        phone,
        cpf,
        gender
      };
    }
  } else {
    clientsRegistry.push({
      id: generateId(),
      name,
      phone,
      cpf,
      gender,
      createdAt: new Date().toISOString()
    });
  }

  saveClientsRegistry();
  closeClientModal();
  renderAll();

  showToast('💾 Salvo com sucesso', `Dados do cliente ${name} foram salvos.`);
  triggerSuccessCelebration();
}

function deleteClientProfile(clientId) {
  const client = clientsRegistry.find(c => c.id === clientId);
  if (!client) return;

  const clientAppts = appointments.filter(a => a.clientId === clientId);
  if (clientAppts.length > 0) {
    if (!confirm(`Remover "${client.name}" irá deletar todas as ${clientAppts.length} consultas associadas a ele. Prosseguir?`)) return;
    appointments = appointments.filter(a => a.clientId !== clientId);
    saveAppointments();
  } else {
    if (!confirm(`Remover definitivamente "${client.name}" do sistema?`)) return;
  }

  clientsRegistry = clientsRegistry.filter(c => c.id !== clientId);
  saveClientsRegistry();
  renderAll();
  showToast('🗑️ Cliente Excluído', `${client.name} foi removido.`);
}

// ─── Appointment Booking Operations ─────────────────────────────────────────

function openAppointmentModal(prefilledTime = '09:00', prefilledDate = null) {
  const modal = document.getElementById('appointment-modal');
  document.getElementById('appt-modal-title').textContent = 'Nova Consulta';
  document.getElementById('appt-modal-badge').innerHTML = '<i data-lucide="calendar-plus"></i>';
  document.getElementById('appointment-form').reset();
  document.getElementById('appt-id').value = '';
  document.getElementById('appt-client-id').value = '';
  document.getElementById('appt-client-name').value = '';
  document.getElementById('appt-client-phone').value = '';
  document.getElementById('appt-client-cpf').value = '';
  setApptGender('male');
  document.getElementById('appt-client-match-info').textContent = '';
  document.getElementById('appt-client-suggestions').style.display = 'none';

  // Enable client fields for new entries
  document.getElementById('appt-client-name').readOnly = false;
  document.getElementById('appt-client-phone').readOnly = false;
  document.getElementById('appt-client-cpf').readOnly = false;

  const dateValue = prefilledDate || dashboardSelectedDate || getTodayDateStr();
  document.getElementById('appt-date').value = dateValue;
  document.getElementById('appt-time').value = prefilledTime;
  document.getElementById('appt-status').value = 'esperando';

  modal.classList.add('active');
  lucide.createIcons();

  setTimeout(() => document.getElementById('appt-client-name').focus(), 100);
}

function closeAppointmentModal() {
  document.getElementById('appointment-modal').classList.remove('active');
  document.getElementById('appt-client-suggestions').style.display = 'none';
}

function openAppointmentEditModal(apptId) {
  const appt = appointments.find(a => a.id === apptId);
  if (!appt) return;

  const client = clientsRegistry.find(c => c.id === appt.clientId);
  if (!client) return;

  document.getElementById('appt-modal-title').textContent = 'Editar Consulta';
  document.getElementById('appt-modal-badge').innerHTML = '<i data-lucide="pencil"></i>';
  document.getElementById('appt-id').value = appt.id;
  document.getElementById('appt-client-id').value = appt.clientId;
  document.getElementById('appt-client-name').value = client.name;
  document.getElementById('appt-client-phone').value = client.phone;
  document.getElementById('appt-client-cpf').value = client.cpf || '';
  setApptGender(client.gender || 'male');
  document.getElementById('appt-client-match-info').textContent = 'Cliente existente vinculado.';
  document.getElementById('appt-client-suggestions').style.display = 'none';

  // Allow editing client details
  document.getElementById('appt-client-name').readOnly = false;
  document.getElementById('appt-client-phone').readOnly = false;
  document.getElementById('appt-client-cpf').readOnly = false;

  const select = document.getElementById('appt-type');
  const optionExists = Array.from(select.options).some(opt => opt.value === appt.type);
  
  if (optionExists) {
    select.value = appt.type;
    document.getElementById('container-outro-procedimento-appt').style.display = 'none';
    document.getElementById('outro-procedimento-appt').required = false;
    document.getElementById('outro-procedimento-appt').value = '';
  } else {
    select.value = 'Outros';
    document.getElementById('container-outro-procedimento-appt').style.display = 'block';
    document.getElementById('outro-procedimento-appt').required = true;
    document.getElementById('outro-procedimento-appt').value = appt.type;
  }

  document.getElementById('appt-date').value = appt.date;
  document.getElementById('appt-time').value = appt.time;
  document.getElementById('appt-status').value = appt.status || 'esperando';

  document.getElementById('appointment-modal').classList.add('active');
  lucide.createIcons();
}

// ─── Appointment Client Autocomplete ────────────────────────────────────────

function onApptClientNameInput() {
  const query = document.getElementById('appt-client-name').value.trim().toLowerCase();
  const suggestionsEl = document.getElementById('appt-client-suggestions');
  const matchInfoEl = document.getElementById('appt-client-match-info');

  if (query.length < 2) {
    suggestionsEl.style.display = 'none';
    matchInfoEl.textContent = '';
    document.getElementById('appt-client-id').value = '';
    return;
  }

  const matches = clientsRegistry.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
  ).slice(0, 6);

  if (matches.length === 0) {
    suggestionsEl.style.display = 'none';
    matchInfoEl.textContent = 'Novo cliente - sera criado automaticamente ao salvar.';
    matchInfoEl.style.color = 'var(--accent-primary)';
    document.getElementById('appt-client-id').value = '';
    return;
  }

  suggestionsEl.innerHTML = matches.map(c => `
    <div class="autocomplete-item" onclick="selectApptClient('${c.id}')">
      <strong>${c.name}</strong>
      <span style="font-size: 0.72rem; color: var(--text-secondary);">${c.phone}${c.cpf ? ' • ' + c.cpf : ''}</span>
    </div>
  `).join('');
  suggestionsEl.style.display = 'block';
  matchInfoEl.textContent = '';
}

function selectApptClient(clientId) {
  const client = clientsRegistry.find(c => c.id === clientId);
  if (!client) return;

  document.getElementById('appt-client-id').value = client.id;
  document.getElementById('appt-client-name').value = client.name;
  document.getElementById('appt-client-phone').value = client.phone;
  document.getElementById('appt-client-cpf').value = client.cpf || '';
  setApptGender(client.gender || 'male');
  document.getElementById('appt-client-suggestions').style.display = 'none';
  document.getElementById('appt-client-match-info').textContent = 'Cliente existente selecionado.';
  document.getElementById('appt-client-match-info').style.color = 'var(--success-color, #22c55e)';
}

// Close autocomplete when clicking outside
document.addEventListener('click', function(e) {
  const suggestionsEl = document.getElementById('appt-client-suggestions');
  if (suggestionsEl && !suggestionsEl.contains(e.target) && e.target.id !== 'appt-client-name') {
    suggestionsEl.style.display = 'none';
  }
});

function saveAppointment(event) {
  event.preventDefault();

  const id = document.getElementById('appt-id').value;
  let clientId = document.getElementById('appt-client-id').value;
  const clientName = document.getElementById('appt-client-name').value.trim();
  const clientPhone = document.getElementById('appt-client-phone').value.trim();
  const clientCpf = document.getElementById('appt-client-cpf').value.trim();
  const clientGender = document.getElementById('appt-client-gender').value;

  let type = document.getElementById('appt-type').value;
  if (type === 'Outros') {
    type = document.getElementById('outro-procedimento-appt').value.trim();
  }
  const date = document.getElementById('appt-date').value;
  const time = document.getElementById('appt-time').value;
  const status = document.getElementById('appt-status').value;

  if (!clientName) {
    showToast('Erro', 'Por favor, informe o nome do cliente.');
    return;
  }
  if (!clientPhone) {
    showToast('Erro', 'Por favor, informe o telefone do cliente.');
    return;
  }
  if (!type) {
    showToast('Erro', 'Por favor, especifique o procedimento.');
    return;
  }

  const appointmentDate = parseLocalDateTime(date, time);
  const now = new Date();
  const diffMs = now - appointmentDate;
  const maxPastMs = 4 * 60 * 60 * 1000;
  if (diffMs > maxPastMs) {
    showToast('Horario Passado', 'Nao e permitido agendar mais de 4 horas apos o horario.');
    return;
  }

  // --- Auto-create or match client ---
  const normalizePhone = (p) => p.replace(/\D/g, '');
  const phoneNorm = normalizePhone(clientPhone);

  if (clientId) {
    // Update existing client data
    const existingIdx = clientsRegistry.findIndex(c => c.id === clientId);
    if (existingIdx !== -1) {
      clientsRegistry[existingIdx].name = clientName;
      clientsRegistry[existingIdx].phone = clientPhone;
      clientsRegistry[existingIdx].gender = clientGender;
      if (clientCpf) clientsRegistry[existingIdx].cpf = clientCpf;
      saveClientsRegistry();
    }
  } else {
    // Try to find existing client by phone
    const existingByPhone = clientsRegistry.find(c => normalizePhone(c.phone) === phoneNorm);
    if (existingByPhone) {
      clientId = existingByPhone.id;
      // Update name, gender and cpf if provided
      existingByPhone.name = clientName;
      existingByPhone.gender = clientGender;
      if (clientCpf) existingByPhone.cpf = clientCpf;
      saveClientsRegistry();
    } else {
      // Create new client automatically
      const newClient = {
        id: generateId(),
        name: clientName,
        phone: clientPhone,
        cpf: clientCpf,
        gender: clientGender,
        createdAt: new Date().toISOString()
      };
      clientsRegistry.push(newClient);
      clientId = newClient.id;
      saveClientsRegistry();
    }
  }

  if (id) {
    const idx = appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      const existing = appointments[idx];
      const dateChanged = existing.date !== date || existing.time !== time;

      appointments[idx] = {
        ...existing,
        clientId,
        type,
        date,
        time,
        status,
        notifiedTomorrow: dateChanged ? false : existing.notifiedTomorrow,
        notifiedToday: dateChanged ? false : existing.notifiedToday,
      };
    }
  } else {
    appointments.push({
      id: generateId(),
      clientId,
      type,
      date,
      time,
      status,
      notifiedTomorrow: false,
      notifiedToday: false,
      createdAt: new Date().toISOString(),
    });
  }

  appointments = sortAppointments(appointments);
  saveAppointments();
  closeAppointmentModal();
  renderAll();

  showToast('Salvo com sucesso', `Consulta de ${clientName} salva.`);
  triggerSuccessCelebration();
}

function cancelAppointment(apptId) {
  const appt = appointments.find(a => a.id === apptId);
  if (!appt) return;

  const client = clientsRegistry.find(c => c.id === appt.clientId);
  const clientName = client ? client.name : 'Cliente';

  if (appt.status === 'canceled') {
    appt.status = 'esperando';
    showToast('✅ Consulta Reativada', `Consulta de ${clientName} está ativa.`);
  } else {
    appt.status = 'canceled';
    showToast('❌ Consulta Cancelada', `Consulta de ${clientName} foi cancelada.`);
  }

  saveAppointments();
  renderAll();
}

function deleteAppointment(apptId) {
  const appt = appointments.find(a => a.id === apptId);
  if (!appt) return;

  const client = clientsRegistry.find(c => c.id === appt.clientId);
  const clientName = client ? client.name : 'Cliente';

  if (!confirm(`Remover definitivamente a consulta de "${clientName}"?`)) return;

  appointments = appointments.filter(a => a.id !== apptId);
  saveAppointments();
  renderAll();
  showToast('🗑️ Consulta Excluída', `Consulta de ${clientName} foi removida.`);
}

function getTodayDateStr() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Tab Navigation ─────────────────────────────────────────────────────────

function switchTab(tabName) {
  document.querySelectorAll('.app-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.sidebar-nav li').forEach(li => li.classList.remove('active'));

  if (tabName !== 'games') {
    stopGameLoop();
  }

  document.getElementById(`tab-${tabName}`).classList.add('active');
  const navItem = document.getElementById(`nav-${tabName}`);
  if (navItem) navItem.classList.add('active');

  currentTab = tabName;
  updateTopBarButton();
  renderAll();

  if (tabName === 'games') {
    initGameEngine();
  }

  return false;
}

function handleTopBarAction() {
  if (currentTab === 'dashboard' || currentTab === 'calendar') {
    openAppointmentModal();
  } else if (currentTab === 'clients') {
    openClientModal();
  }
}

function updateTopBarButton() {
  const btn = document.getElementById('btn-top-action');
  const btnText = document.getElementById('btn-top-action-text');
  if (!btn || !btnText) return;

  if (currentTab === 'dashboard' || currentTab === 'calendar') {
    btn.style.display = 'inline-flex';
    btnText.textContent = 'Adicionar Consulta';
  } else if (currentTab === 'clients') {
    btn.style.display = 'inline-flex';
    btnText.textContent = 'Adicionar Cliente';
  } else {
    btn.style.display = 'none';
  }
}

// ─── Greeting & Date ────────────────────────────────────────────────────────

function updateGreeting() {
  const greeting = getGreeting();
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

  document.getElementById('greeting-title').textContent = `${greeting}, Helo! 👋`;
  document.getElementById('greeting-subtitle').textContent = `${capitalize(dateStr)} • Organizado por data e horário.`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── Theme System ───────────────────────────────────────────────────────────

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);

  document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.getElementById(`btn-theme-${theme}`);
  if (targetBtn) targetBtn.classList.add('active');

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

function triggerSuccessCelebration() {
  const container = document.getElementById('sparkle-container');
  if (!container) return;

  const count = 25; // elegant burst of 25 sparks
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.classList.add('celebration-sparkle');
      
      // Spawn near the center of the screen
      const x = 50 + (Math.random() * 10 - 5); // viewport width %
      const y = 50 + (Math.random() * 10 - 5); // viewport height %
      
      el.style.left = `${x}vw`;
      el.style.top = `${y}vh`;
      
      const size = Math.random() * 8 + 4; // size from 4px to 12px
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      
      // Random directions
      const tx = (Math.random() * 260 - 130) + 'px';
      const ty = (Math.random() * 260 - 130) + 'px';
      el.style.setProperty('--tx', tx);
      el.style.setProperty('--ty', ty);
      
      // Vibrant theme-aligned glowing colors
      const colors = ['#22c55e', '#3b82f6', '#06b6d4', '#ec4899', '#e11d48', '#ffd700'];
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.boxShadow = `0 0 ${Math.random() * 6 + 4}px ${el.style.backgroundColor}`;
      
      container.appendChild(el);
      
      setTimeout(() => el.remove(), 1200);
    }, i * 15); // rapid succession burst!
  }
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
  toast.querySelector('.toast-desc').textContent = desc;
  toast.classList.add('show');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 3500);
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

function applyInputMasks() {
  const phoneInput = document.getElementById('profile-client-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      let value = this.value.replace(/\D/g, '');
      if (value.length <= 10) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
      } else {
        value = value.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
      }
      this.value = value;
    });
  }

  const cpfInput = document.getElementById('profile-client-cpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', function () {
      let value = this.value.replace(/\D/g, '');
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})$/, '$1.$2.$3-$4');
      this.value = value;
    });
  }
}

// ─── Calendar / Agenda Functions ───────────────────────────────────────────

let calendarCurrentDate = new Date();
let calendarSelectedDate = '';

function renderCalendar() {
  const container = document.getElementById('calendar-days-container');
  const monthYearHeader = document.getElementById('calendar-month-year');
  if (!container || !monthYearHeader) return;

  const year = calendarCurrentDate.getFullYear();
  const month = calendarCurrentDate.getMonth(); // 0-indexed

  // Format month and year header in Pt-BR
  const monthName = calendarCurrentDate.toLocaleDateString('pt-BR', { month: 'long' });
  monthYearHeader.textContent = `${capitalize(monthName)} ${year}`;

  // First day of current month
  const firstDay = new Date(year, month, 1);
  const startDayIndex = firstDay.getDay(); // 0 = Sunday, 1 = Monday ...

  // Days in current month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Days in previous month
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  container.innerHTML = '';

  // 1. Render days from previous month to fill the first row
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const prevDate = new Date(year, month - 1, dayNum);
    const dateStr = formatDateKey(prevDate.getFullYear(), prevDate.getMonth() + 1, prevDate.getDate());
    
    const cell = createCalendarDayCell(dayNum, dateStr, true);
    container.appendChild(cell);
  }

  // 2. Render days of the current month
  const todayStr = getTodayDateStr();
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dateStr = formatDateKey(year, month + 1, dayNum);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === calendarSelectedDate;

    const cell = createCalendarDayCell(dayNum, dateStr, false, isToday, isSelected);
    container.appendChild(cell);
  }

  // 3. Render days from next month to complete the grid
  const totalCells = startDayIndex + totalDays;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const nextDate = new Date(year, month + 1, i);
    const dateStr = formatDateKey(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
    
    const cell = createCalendarDayCell(i, dateStr, true);
    container.appendChild(cell);
  }

  // Render detail panel if a date is selected
  if (calendarSelectedDate) {
    renderCalendarDayDetails(calendarSelectedDate);
  } else {
    const detailSec = document.getElementById('calendar-day-details-section');
    if (detailSec) detailSec.style.display = 'none';
  }
}

function formatDateKey(year, month, day) {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function createCalendarDayCell(dayNum, dateStr, isOtherMonth, isToday = false, isSelected = false) {
  const cell = document.createElement('div');
  cell.className = 'calendar-day';
  if (isOtherMonth) cell.classList.add('other-month');
  if (isToday) cell.classList.add('today');
  if (isSelected) cell.classList.add('selected');

  // Count active consultations on this day
  const dayAppts = appointments.filter(a => a.date === dateStr && a.status !== 'canceled');
  const apptCount = dayAppts.length;

  cell.onclick = () => {
    calendarSelectedDate = dateStr;
    // Switch active state visually
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
    cell.classList.add('selected');
    renderCalendarDayDetails(dateStr);
  };

  // HTML content
  let indicatorsHtml = '';
  if (apptCount > 0) {
    if (apptCount <= 3) {
      for (let i = 0; i < apptCount; i++) {
        indicatorsHtml += '<span class="calendar-day-dot"></span>';
      }
    } else {
      indicatorsHtml += `<span class="calendar-day-dot"></span><span class="calendar-day-badge">+${apptCount}</span>`;
    }
  }

  cell.innerHTML = `
    <span class="calendar-day-number">${dayNum}</span>
    <div class="calendar-day-indicators">${indicatorsHtml}</div>
  `;

  return cell;
}

function adjustCalendarMonth(offset) {
  calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + offset);
  renderCalendar();
}

function renderCalendarDayDetails(dateStr) {
  const section = document.getElementById('calendar-day-details-section');
  const title = document.getElementById('calendar-selected-day-title');
  const badge = document.getElementById('calendar-selected-day-badge');
  const grid = document.getElementById('calendar-selected-day-grid');

  if (!section || !title || !badge || !grid) return;

  const dayAppts = appointments.filter(a => a.date === dateStr);
  const activeApptsCount = dayAppts.filter(a => a.status !== 'canceled').length;

  const parts = dateStr.split('-');
  title.textContent = `Consultas do Dia ${parts[2]}/${parts[1]}/${parts[0]}`;
  badge.textContent = `${activeApptsCount} Consulta${activeApptsCount !== 1 ? 's' : ''}`;
  section.style.display = 'block';

  if (dayAppts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; padding: 2rem;">
        <i data-lucide="calendar-off"></i>
        <p>Nenhuma consulta marcada para este dia.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  grid.innerHTML = dayAppts.map(appt => {
    const client = clientsRegistry.find(c => c.id === appt.clientId) || { name: 'Desconhecido', phone: '', cpf: '' };
    
    let statusClass = 'status-waiting';
    let statusLabel = 'Esperando';
    if (appt.status === 'chegou') {
      statusClass = 'status-confirmed';
      statusLabel = 'Chegou';
    } else if (appt.status === 'não veio') {
      statusClass = 'status-canceled';
      statusLabel = 'Não Veio';
    } else if (appt.status === 'canceled') {
      statusClass = 'status-canceled';
      statusLabel = 'Cancelada';
    }

    const genderIcon = client.gender === 'female'
      ? `<i data-lucide="venus" class="client-gender-icon gender-female" title="Mulher"></i>`
      : `<i data-lucide="mars" class="client-gender-icon gender-male" title="Homem"></i>`;

    return `
      <div class="client-card" style="display: flex; flex-direction: column; justify-content: space-between; border-left: 4px solid var(--accent-primary);">
        <div>
          <div class="card-header-row">
            <span class="card-time"><i data-lucide="clock"></i> ${appt.time}</span>
            <span class="status-indicator ${statusClass}">${statusLabel}</span>
          </div>
          <h4 class="card-name" style="margin: 0.5rem 0 0.25rem 0; display:flex; align-items:center; gap:0.35rem;">
            ${escapeHtml(client.name)}
            ${genderIcon}
          </h4>
          <p class="card-procedure" style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
            <i data-lucide="stethoscope" style="width:12px;height:12px;display:inline-block;vertical-align:middle;margin-right:2px;"></i> ${escapeHtml(appt.type)}
          </p>
          <div style="font-size: 0.75rem; color: var(--text-muted);">
            <div>Tel: ${escapeHtml(client.phone)}</div>
            ${client.cpf ? `<div>CPF: ${escapeHtml(client.cpf)}</div>` : ''}
          </div>
        </div>
        <div style="margin-top: 1rem; border-top: 1px solid var(--border-color); padding-top: 0.75rem; display: flex; justify-content: flex-end;">
          <button type="button" class="btn-goto-dashboard" onclick="goToDashboardDate('${dateStr}')">
            <i data-lucide="external-link" style="width:12px;height:12px;"></i>
            <span>Ir para o Painel</span>
          </button>
        </div>
      </div>
    `;
  }).join('');

  lucide.createIcons();
}

function goToDashboardDate(dateStr) {
  dashboardSelectedDate = dateStr;
  
  const datePicker = document.getElementById('dashboard-date-picker');
  if (datePicker) {
    datePicker.value = dateStr;
  }

  switchTab('dashboard');
}

function verificarProcedimentoOutrosAppt() {
  const select = document.getElementById('appt-type');
  const container = document.getElementById('container-outro-procedimento-appt');
  const input = document.getElementById('outro-procedimento-appt');

  if (select && container && input) {
    if (select.value === 'Outros') {
      container.style.display = 'block';
      input.required = true;
      input.focus();
    } else {
      container.style.display = 'none';
      input.required = false;
      input.value = '';
    }
  }
}

function openClientModalToday(prefilledTime = '09:00') {
  openAppointmentModal(prefilledTime, getTodayDateStr());
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

// ─── Initialize App ─────────────────────────────────────────────────────────

function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    setTimeout(() => {
      loadingScreen.classList.add('hidden');
    }, 800);
  }
}

function init() {
  loadClients();
  loadTemplates();
  loadTheme();
  applyInputMasks();
  renderAll();
  hideLoadingScreen();
}

document.addEventListener('DOMContentLoaded', init);
