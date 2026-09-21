import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD-placeholder", // Replace with your Firebase API Key if needed
  authDomain: "tradingpanda-app.firebaseapp.com",
  databaseURL: "https://tradingpanda-app-default-rtdb.firebaseio.com",
  projectId: "tradingpanda-app",
  storageBucket: "tradingpanda-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123xyz"
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
const userEmailDisplay = document.getElementById("user-email-display");
const userRoleDisplay = document.getElementById("user-role-display");

// Tab Navigation Logic
const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    const targetTab = button.getAttribute("data-tab");

    tabButtons.forEach(btn => btn.classList.remove("active"));
    tabContents.forEach(content => {
      content.classList.add("hidden");
      content.classList.remove("active-tab");
    });

    button.classList.add("active");
    
    if (targetTab === "signals") {
      document.getElementById("signals-tab").classList.remove("hidden");
    } else if (targetTab === "analytics") {
      document.getElementById("analytics-tab").classList.remove("hidden");
    } else if (targetTab === "premium") {
      document.getElementById("premium-tab").classList.remove("hidden");
    } else if (targetTab === "profile") {
      document.getElementById("profile-tab").classList.remove("hidden");
    }
  });
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
    authSection.classList.add("hidden");
    logoutBtn.classList.remove("hidden");
    if (userEmailDisplay) userEmailDisplay.innerText = user.email;

    // Check if Admin
    if (user.email.toLowerCase() === "admin@tradingpanda.com") {
      adminPanel.classList.remove("hidden");
      if (userBadge) {
        userBadge.innerText = "Admin VIP";
        userBadge.className = "badge purple";
      }
      if (userRoleDisplay) userRoleDisplay.innerText = "Administrator";
    } else {
      adminPanel.classList.add("hidden");
      if (userBadge) {
        userBadge.innerText = "Free Member";
        userBadge.className = "badge free";
      }
      if (userRoleDisplay) userRoleDisplay.innerText = "Free Member";
    }
  } else {
    authSection.classList.remove("hidden");
    adminPanel.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    if (userEmailDisplay) userEmailDisplay.innerText = "Not logged in";
    if (userRoleDisplay) userRoleDisplay.innerText = "Guest";
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
    pair,
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

// Realtime Signal Feed Listener
const signalsRef = ref(db, "signals");
onValue(signalsRef, (snapshot) => {
  signalsContainer.innerHTML = "";
  const data = snapshot.val();
  
  if (!data) {
    signalsContainer.innerHTML = "<p style='color: var(--text-muted); text-align: center;'>No active signals right now.</p>";
    return;
  }

  const signalList = Object.values(data).reverse();

  signalList.forEach(sig => {
    const card = document.createElement("div");
    card.className = `signal-card ${sig.action.toLowerCase()}`;
    
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
    signalsContainer.appendChild(card);
  });
});
