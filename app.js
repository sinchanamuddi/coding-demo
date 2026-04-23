const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:8787/api' : '/api';

const plannerForm = document.getElementById('plannerForm');
const itinerary = document.getElementById('itinerary');
const startDateInput = document.getElementById('startDate');
const languageSelect = document.getElementById('language');
const greeting = document.getElementById('greeting');
const installBtn = document.getElementById('installBtn');
const loginForm = document.getElementById('loginForm');
const authStatus = document.getElementById('authStatus');
const savedTrips = document.getElementById('savedTrips');
const plannerNotice = document.getElementById('plannerNotice');

let authToken = localStorage.getItem('yatraai_token') || '';
let currentUser = JSON.parse(localStorage.getItem('yatraai_user') || 'null');
let lastPlanPayload = null;

const greetings = {
  en: 'Namaste 👋',
  hi: 'नमस्ते 👋',
  kn: 'ನಮಸ್ಕಾರ 👋'
};

const dayThemes = [
  'Heritage walk + iconic breakfast trail',
  'Local transport smart-route + market exploration',
  'Experience-led day: culture, food, and sunset spot',
  'Flexible day for hidden gems + shopping',
  'Nature and wellness focus with low-crowd timing',
  'Premium dining and nightlife recommendations',
  'Departure day buffer with airport/rail transfer automation'
];

const today = new Date();
startDateInput.value = today.toISOString().split('T')[0];

languageSelect.addEventListener('change', () => {
  greeting.textContent = greetings[languageSelect.value] || greetings.en;
});

function setAuthStatus(message, isError = false) {
  authStatus.textContent = message;
  authStatus.className = isError ? 'tiny status error' : 'tiny status';
}

function setPlannerNotice(message, isError = false) {
  plannerNotice.textContent = message;
  plannerNotice.className = isError ? 'tiny status error' : 'tiny status';
}

async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

function renderSavedTrips(trips = []) {
  if (!trips.length) {
    savedTrips.innerHTML = '<div class="saved-card">No saved trips yet. Generate a plan and click Save Trip.</div>';
    return;
  }

  savedTrips.innerHTML = trips
    .map(
      (trip) =>
        `<div class="saved-card">${trip.destination} · ₹${Number(trip.budget).toLocaleString('en-IN')} · ${trip.days} days · ${trip.status}</div>`
    )
    .join('');
}

async function loadTrips() {
  if (!authToken) {
    renderSavedTrips();
    return;
  }

  try {
    const data = await api('/trips');
    renderSavedTrips(data.trips || []);
  } catch (error) {
    setAuthStatus(error.message, true);
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(loginForm);
  const mode = form.get('mode');

  try {
    if (mode === 'register') {
      await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password')
        })
      });
    }

    const login = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: form.get('email'),
        password: form.get('password')
      })
    });

    authToken = login.token;
    currentUser = login.user;
    localStorage.setItem('yatraai_token', authToken);
    localStorage.setItem('yatraai_user', JSON.stringify(currentUser));
    setAuthStatus(`Logged in as ${currentUser.name}`);
    await loadTrips();
  } catch (error) {
    setAuthStatus(error.message, true);
  }
});

plannerForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const destination = document.getElementById('destination').value || 'your destination';
  const days = Number(document.getElementById('days').value);
  const budget = Number(document.getElementById('budget').value);
  const style = document.getElementById('style').value;
  const startDate = new Date(startDateInput.value);

  lastPlanPayload = { destination, days, budget, style, startDate: startDateInput.value };

  itinerary.innerHTML = '';

  const summary = document.createElement('div');
  summary.className = 'plan-day';
  summary.innerHTML = `
    <strong>AI Plan Ready · ${destination}</strong>
    <p>Style: ${style} · Budget: ₹${budget.toLocaleString('en-IN')} · Days: ${days}</p>
    <button id="saveTripBtn" class="ghost">Save Trip</button>
  `;
  itinerary.appendChild(summary);

  for (let i = 0; i < days; i += 1) {
    const block = document.createElement('div');
    block.className = 'plan-day';
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    block.innerHTML = `
      <strong>Day ${i + 1} · ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</strong>
      <p>${dayThemes[i % dayThemes.length]} in ${destination}.</p>
    `;

    itinerary.appendChild(block);
  }

  const saveButton = document.getElementById('saveTripBtn');
  saveButton.addEventListener('click', saveTrip);
});

async function saveTrip() {
  if (!authToken) {
    setPlannerNotice('Login first to save trips to your cloud profile.', true);
    return;
  }

  if (!lastPlanPayload) {
    setPlannerNotice('Generate a plan first.', true);
    return;
  }

  try {
    await api('/trips', {
      method: 'POST',
      body: JSON.stringify(lastPlanPayload)
    });
    setPlannerNotice('Trip saved to your dashboard.');
    await loadTrips();
  } catch (error) {
    setPlannerNotice(error.message, true);
  }
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});

installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}

if (currentUser) {
  setAuthStatus(`Welcome back, ${currentUser.name}`);
}

loadTrips();
