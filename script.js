import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzh22UQKA4Z3Bonp8Qd0zYNbWcCU3bE1Y",
  authDomain: "trading-panda-74104.firebaseapp.com",
  projectId: "trading-panda-74104",
  storageBucket: "trading-panda-74104.firebasestorage.app",
  messagingSenderId: "912778424578",
  appId: "1:912778424578:web:7676f1e496cc5e5f16921b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const ADMIN_EMAIL = "admin@tradingpanda.com"; 

document.getElementById('signup-btn')?.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  createUserWithEmailAndPassword(auth, email, pass).then(() => alert("Account Created!")).catch(err => alert(err.message));
});

document.getElementById('login-btn')?.addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const pass = document.getElementById('password').value;
  signInWithEmailAndPassword(auth, email, pass).catch(err => alert(err.message));
});

document.getElementById('logout-btn')?.addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('logout-btn').classList.remove('hidden');
    if (user.email === ADMIN_EMAIL) {
      document.getElementById('admin-panel').classList.remove('hidden');
    } else {
      document.getElementById('admin-panel').classList.add('hidden');
    }
  } else {
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('logout-btn').classList.add('hidden');
    document.getElementById('admin-panel').classList.add('hidden');
  }
});

document.getElementById('signal-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  push(ref(database, 'signals'), {
    pair: document.getElementById('pair').value,
    action: document.getElementById('action').value,
    entry: document.getElementById('entry').value,
    sl: document.getElementById('sl').value,
    tp: document.getElementById('tp').value,
    timestamp: Date.now()
  });
  e.target.reset();
});

onValue(ref(database, 'signals'), (snapshot) => {
  const container = document.getElementById('signals-container');
  container.innerHTML = '';
  const data = snapshot.val();
  if (data) {
    Object.keys(data).reverse().forEach(key => {
      const sig = data[key];
      const card = document.createElement('div');
      card.className = `signal-card ${sig.action.toLowerCase()}`;
      card.innerHTML = `
        <h3>${sig.pair} - <span class="${sig.action.toLowerCase()}">${sig.action}</span></h3>
        <p><strong>Entry:</strong> ${sig.entry}</p>
        <p><strong>SL:</strong> ${sig.sl} | <strong>TP:</strong> ${sig.tp}</p>
        <small>${new Date(sig.timestamp).toLocaleTimeString()}</small>
      `;
      container.appendChild(card);
    });
  } else {
    container.innerHTML = '<p>No active signals currently.</p>';
  }
});
