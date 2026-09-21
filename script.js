import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzh22UQKA4Z3Bonp8Qd0zYNbWcCU3bE1Y",
  authDomain: "trading-panda-74104.firebaseapp.com",
  databaseURL: "https://trading-panda-74104-default-rtdb.firebaseio.com",
  projectId: "trading-panda-74104",
  storageBucket: "trading-panda-74104.firebasestorage.app",
  messagingSenderId: "912778424578",
  appId: "1:912778424578:web:7676f1e496cc5e5f16921b"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// DOM Elements
const authBox = document.getElementById("auth-box");
const adminPanel = document.getElementById("admin-panel");
const userBadge = document.getElementById("user-badge");
const logoutBtn = document.getElementById("logout-btn");

const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");

const pairInput = document.getElementById("pair-input");
const actionSelect = document.getElementById("action-select");
const entryInput = document.getElementById("entry-input");
const slInput = document.getElementById("sl-input");
const tp1Input = document.getElementById("tp1-input");
const publishBtn = document.getElementById("publish-btn");

const signalsContainer = document.getElementById("signals-container");
const navTabs = document.querySelectorAll(".nav-tab");
const tabContents = document.querySelectorAll(".tab-content");

// Navigation Tabs Logic
navTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    navTabs.forEach(t => t.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    tab.classList.add("active");
    const target = tab.getAttribute("data-tab");
    const targetElement = document.getElementById(`${target}-tab`);
    if (targetElement) {
      targetElement.classList.add("active");
    }
  });
});

// Authentication State Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    authBox.style.display = "none";
    logoutBtn.style.display = "inline-flex";

    const userEmail = user.email ? user.email.toLowerCase() : "";
    
    if (userEmail === "admin@tradingpanda.com") {
      userBadge.textContent = "Admin VIP";
      userBadge.className = "user-badge vip";
      if (adminPanel) adminPanel.style.display = "block";
    } else {
      userBadge.textContent = "Free Plan";
      userBadge.className = "user-badge free";
      if (adminPanel) adminPanel.style.display = "none";
    }
  } else {
    authBox.style.display = "block";
    logoutBtn.style.display = "none";
    if (adminPanel) adminPanel.style.display = "none";
    userBadge.textContent = "Free Plan";
    userBadge.className = "user-badge free";
  }
});

// Login
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        emailInput.value = "";
        passwordInput.value = "";
      })
      .catch((error) => {
        alert("Login Error: " + error.message);
      });
  });
}

// Signup
if (signupBtn) {
  signupBtn.addEventListener("click", () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert("Account created successfully!");
        emailInput.value = "";
        passwordInput.value = "";
      })
      .catch((error) => {
        alert("Signup Error: " + error.message);
      });
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      alert("Logged out successfully");
    });
  });
}

// Admin - Publish Signal
if (publishBtn) {
  publishBtn.addEventListener("click", () => {
    const pair = pairInput.value.trim();
    const action = actionSelect.value;
    const entry = entryInput.value.trim();
    const sl = slInput.value.trim();
    const tp = tp1Input.value.trim();

    if (!pair || !entry || !sl || !tp) {
      alert("Please fill in all signal fields.");
      return;
    }

    const newSignalRef = push(ref(db, "signals"));
    set(newSignalRef, {
      pair: pair.toUpperCase(),
      action: action,
      entry: entry,
      sl: sl,
      tp: tp,
      timestamp: Date.now()
    }).then(() => {
      alert("Signal published live!");
      pairInput.value = "";
      entryInput.value = "";
      slInput.value = "";
      tp1Input.value = "";
    }).catch((err) => {
      alert("Failed to publish signal: " + err.message);
    });
  });
}

// Realtime Signal Feed Listener (5 Free Signals Limit per User)
const signalsRef = ref(db, "signals");
onValue(signalsRef, (snapshot) => {
  if (!signalsContainer) return;
  signalsContainer.innerHTML = "";
  const data = snapshot.val();
  
  if (!data) {
    signalsContainer.innerHTML = "<p style='color: var(--text-muted); text-align: center;'>No active signals right now.</p>";
    return;
  }

  const currentUser = auth.currentUser;
  const isAdminOrVIP = currentUser && (currentUser.email.toLowerCase() === "admin@tradingpanda.com" || currentUser.isVIP);
  
  const FREE_LIMIT = 5; 
  const signalList = Object.values(data).reverse();

  signalList.forEach((sig, index) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.style.position = "relative";
    cardWrapper.style.marginBottom = "15px";

    const card = document.createElement("div");
    const isLocked = !isAdminOrVIP && index >= FREE_LIMIT;
    
    card.className = `signal-card ${sig.action.toLowerCase()} ${isLocked ? 'locked' : ''}`;
    
    card.innerHTML = `
      <div class="signal-header">
        <span class="pair-title">${sig.pair}</span>
        <span class="badge-action ${sig.action.toLowerCase()}">${sig.action}</span>
      </div>
      <div class="signal-details">
        <div class="detail-box">
          <span>ENTRY</span>
          <strong>${sig.entry}</strong>
        </div>
        <div class="detail-box">
          <span>STOP LOSS</span>
          <strong class="red">${sig.sl}</strong>
        </div>
        <div class="detail-box">
          <span>TAKE PROFIT 1</span>
          <strong class="green">${sig.tp}</strong>
        </div>
      </div>
    `;

    cardWrapper.appendChild(card);

    if (isLocked) {
      const lockOverlay = document.createElement("div");
      lockOverlay.className = "lock-overlay";
      lockOverlay.innerHTML = `
        <p>🔒 Free Limit Reached (5/5 Signals Used)</p>
        <p style="font-size:0.75rem; color:#aaa; margin-bottom:10px;">Upgrade to VIP for Unlimited Lifetime Signals</p>
        <button class="unlock-btn" onclick="document.querySelector('[data-tab=\\'premium\\']').click()">Upgrade to VIP</button>
      `;
      cardWrapper.appendChild(lockOverlay);
    }

    signalsContainer.appendChild(cardWrapper);
  });
});
