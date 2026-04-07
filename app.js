const CONFIG = {
  guestCsvPath: 'data/guests.csv',
  rsvpEndpoint: 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE'
};

const state = {
  guests: [],
  partyRows: [],
  currentInviteCode: ''
};

const lookupForm = document.getElementById('lookupForm');
const lookupMessage = document.getElementById('lookupMessage');
const inviteCodeInput = document.getElementById('inviteCode');
const partyCard = document.getElementById('partyCard');
const partyName = document.getElementById('partyName');
const partyGuests = document.getElementById('partyGuests');
const partySizeBadge = document.getElementById('partySizeBadge');
const guestCountSelect = document.getElementById('guestCount');
const mealChoiceSelect = document.getElementById('mealChoice');
const rsvpForm = document.getElementById('rsvpForm');
const rsvpMessage = document.getElementById('rsvpMessage');

init();

async function init() {
  try {
    const response = await fetch(CONFIG.guestCsvPath, { cache: 'no-store' });
    const csv = await response.text();
    state.guests = parseCsv(csv).map(normalizeGuest);
  } catch (error) {
    setMessage(lookupMessage, 'Unable to load the guest list right now. Please refresh and try again.', 'error');
    console.error(error);
  }
}

lookupForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const code = inviteCodeInput.value.trim().toUpperCase();

  if (!code) {
    setMessage(lookupMessage, 'Please enter your invite code.', 'error');
    return;
  }

  const partyRows = state.guests.filter((row) => row.inviteCode === code);
  if (!partyRows.length) {
    partyCard.classList.add('hidden');
    setMessage(lookupMessage, 'We could not find that invite code. Double-check the card and try again.', 'error');
    return;
  }

  state.currentInviteCode = code;
  state.partyRows = partyRows;
  renderParty(partyRows);
  setMessage(lookupMessage, 'Invitation found. Please complete the RSVP form below.', 'success');
});

rsvpForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.partyRows.length) {
    setMessage(rsvpMessage, 'Please find your invitation first.', 'error');
    return;
  }

  const formData = new FormData(rsvpForm);
  const payload = {
    inviteCode: state.currentInviteCode,
    partyName: state.partyRows[0].partyName,
    guestNames: state.partyRows.map((row) => row.guestName),
    attendance: formData.get('attendance') || '',
    guestCount: Number(formData.get('guestCount') || 0),
    mealChoice: formData.get('mealChoice') || '',
    email: (formData.get('email') || '').toString().trim(),
    phone: (formData.get('phone') || '').toString().trim(),
    songRequest: (formData.get('songRequest') || '').toString().trim(),
    notes: (formData.get('notes') || '').toString().trim(),
    submittedAt: new Date().toISOString()
  };

  if (!payload.attendance) {
    setMessage(rsvpMessage, 'Please choose whether your party will attend.', 'error');
    return;
  }

  if (payload.attendance === 'accept' && payload.guestCount < 1) {
    setMessage(rsvpMessage, 'Please select how many guests are attending.', 'error');
    return;
  }

  if (!CONFIG.rsvpEndpoint || CONFIG.rsvpEndpoint.includes('PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE')) {
    downloadFallback(payload);
    setMessage(rsvpMessage, 'Setup is not finished yet, so your RSVP file was downloaded instead. Add the Apps Script URL in app.js to enable live submissions.', 'error');
    return;
  }

  try {
    setMessage(rsvpMessage, 'Submitting your RSVP...', '');
    const response = await fetch(CONFIG.rsvpEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || 'Submission failed');
    }

    rsvpForm.reset();
    partyCard.classList.add('hidden');
    lookupForm.reset();
    setMessage(lookupMessage, 'Thank you! Your RSVP has been recorded.', 'success');
    setMessage(rsvpMessage, '', '');
  } catch (error) {
    console.error(error);
    setMessage(rsvpMessage, 'Your RSVP could not be submitted right now. Please try again in a moment.', 'error');
  }
});

function renderParty(rows) {
  const first = rows[0];
  const maxPartySize = Math.max(...rows.map((row) => row.maxPartySize));
  const meals = unique(rows.flatMap((row) => row.mealOptions));

  partyName.textContent = first.partyName;
  partyGuests.textContent = rows.map((row) => row.guestName).join(', ');
  partySizeBadge.textContent = `Up to ${maxPartySize} guest${maxPartySize === 1 ? '' : 's'}`;

  populateSelect(guestCountSelect, range(0, maxPartySize).map((count) => ({
    value: String(count),
    label: count === 0 ? '0' : String(count)
  })));

  populateSelect(mealChoiceSelect, meals.map((meal) => ({ value: meal, label: meal })));

  partyCard.classList.remove('hidden');
}

function populateSelect(select, options) {
  select.innerHTML = '';
  for (const option of options) {
    const element = document.createElement('option');
    element.value = option.value;
    element.textContent = option.label;
    select.appendChild(element);
  }
}

function parseCsv(input) {
  const rows = [];
  let current = '';
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current);
      current = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      if (current.length || row.length) {
        row.push(current);
        rows.push(row);
      }
      row = [];
      current = '';
    } else {
      current += char;
    }
  }

  if (current.length || row.length) {
    row.push(current);
    rows.push(row);
  }

  const [headers, ...body] = rows;
  return body.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])));
}

function normalizeGuest(row) {
  return {
    inviteCode: (row.invite_code || '').trim().toUpperCase(),
    partyName: (row.party_name || '').trim(),
    guestName: (row.guest_name || '').trim(),
    email: (row.email || '').trim(),
    allowedPlusOnes: Number(row.allowed_plus_ones || 0),
    maxPartySize: Number(row.max_party_size || 1),
    mealOptions: (row.meal_options || 'Vegetarian|Chicken').split('|').map((item) => item.trim()).filter(Boolean)
  };
}

function unique(values) {
  return [...new Set(values)];
}

function range(start, end) {
  const items = [];
  for (let value = start; value <= end; value += 1) {
    items.push(value);
  }
  return items;
}

function setMessage(element, text, type) {
  element.textContent = text;
  element.className = 'form-message';
  if (type) {
    element.classList.add(type);
  }
}

function downloadFallback(payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${payload.inviteCode || 'rsvp'}-response.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
