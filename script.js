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
const authSection = document.getElementById("auth-section");
const adminPanel = document.getElementById("admin-panel");
const signalsContainer = document.getElementById("signals-container");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const logoutBtn = document.getElementById("logout-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signalForm = document.getElementById("signal-form");
const userBadge = document.getElementById("user-badge");

// Sidebar Drawer Navigation Toggle
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarClose = document.getElementById("sidebar-close");
const menuItems = document.querySelectorAll(".menu-item");

sidebarToggle?.addEventListener("click", () => {
  sidebar?.classList.add("open");
});

sidebarClose?.addEventListener("click", () => {
  sidebar?.classList.remove("open");
});

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    const targetTab = item.getAttribute("data-tab");

    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(content => {
      content.classList.add("hidden");
    });

    const selectedTab = document.getElementById(`${targetTab}-tab`);
    if (selectedTab) selectedTab.classList.remove("hidden");

    sidebar?.classList.remove("open");
  });
});

// Position Size & Lot Size Calculator Logic
const calcBtn = document.getElementById("calculate-btn");
calcBtn?.addEventListener("click", () => {
  const balance = parseFloat(document.getElementById("calc-balance").value) || 0;
  const riskPercent = parseFloat(document.getElementById("calc-risk").value) || 0;
  const slPips = parseFloat(document.getElementById("calc-sl-pips").value) || 1;

  const riskAmount = (balance * riskPercent) / 100;
  const lotSize = (riskAmount / (slPips * 10)).toFixed(2);

  document.getElementById("risk-amount").innerText = riskAmount.toFixed(2);
  document.getElementById("lot-result").innerText = `${lotSize} Lot`;
});

// Authentication Handlers
signupBtn?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("Please enter email and password");
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    alert("Account created successfully!");
  } catch (error) {
    alert(error.message);
  }
});

loginBtn?.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) return alert("Please enter email and password");
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    alert(error.message);
  }
});

logoutBtn?.addEventListener("click", () => {
  signOut(auth);
});

// Auth State Tracking
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");

    if (user.email.toLowerCase() === "admin@tradingpanda.com") {
      adminPanel?.classList.remove("hidden");
      if (userBadge) {
        userBadge.innerText = "Admin VIP";
        userBadge.className = "badge purple";
      }
    } else {
      adminPanel?.classList.add("hidden");
      if (userBadge) {
        userBadge.innerText = "Free Member";
        userBadge.className = "badge free";
      }
    }
  } else {
    authSection?.classList.remove("hidden");
    adminPanel?.classList.add("hidden");
    logoutBtn?.classList.add("hidden");
    if (userBadge) {
      userBadge.innerText = "Free Plan";
      userBadge.className = "badge free";
    }
  }
});

// Post Signal (Admin Only)
signalForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const pair = document.getElementById("pair").value;
  const action = document.getElementById("action").value;
  const entry = document.getElementById("entry").value;
  const sl = document.getElementById("sl").value;
  const tp = document.getElementById("tp").value;
  const tp2 = document.getElementById("tp2").value || "N/A";

  const signalRef = ref(db, "signals");
  const newSignalRef = push(signalRef);
  
  set(newSignalRef, {
    pair: pair.toUpperCase(),
    action,
    entry,
    sl,
    tp,
    tp2,
    timestamp: Date.now()
  }).then(() => {
    alert("Signal Published!");
    signalForm.reset();
  }).catch((err) => {
    alert(err.message);
  });
});

// Realtime Signal Feed Listener (Old 5 Signals Free, New Signals Locked)
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
  
  const signalList = Object.values(data).reverse();
  const totalSignals = signalList.length;

  signalList.forEach((sig, index) => {
    const cardWrapper = document.createElement("div");
    cardWrapper.style.position = "relative";
    cardWrapper.style.marginBottom = "15px";

    const card = document.createElement("div");
    
    // Naye (Latest) Signals lock honge, purane 5 free rahenge
    const isNewSignal = index < (totalSignals - 5);
    const isLocked = !isAdminOrVIP && isNewSignal;
    
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
        <p>🔒 New VIP Signal Locked</p>
        <p style="font-size:0.75rem; color:#aaa; margin-bottom:10px;">Upgrade to VIP to access fresh live signals instantly</p>
        <button class="unlock-btn" onclick="document.querySelector('[data-tab=\\'premium\\']').click()">Upgrade to VIP</button>
      `;
      cardWrapper.appendChild(lockOverlay);
    }

    signalsContainer.appendChild(cardWrapper);
  });
});
