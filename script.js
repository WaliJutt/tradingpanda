import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, push, onValue, set, remove, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const tidForm = document.getElementById("tid-form");
const paymentRequestsContainer = document.getElementById("payment-requests-container");
const adminRequestsMenuItem = document.getElementById("admin-requests-menu-item");

let userSignupTime = 0;
let isUserVIP = false;

// Direct Universal Sidebar Logic
document.addEventListener("click", (e) => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = e.target.closest("#sidebar-toggle");
  const closeBtn = e.target.closest("#sidebar-close");
  const menuItem = e.target.closest(".menu-item");

  if (toggleBtn) {
    sidebar?.classList.add("open");
  } else if (closeBtn || (sidebar && sidebar.classList.contains("open") && !sidebar.contains(e.target) && !toggleBtn)) {
    sidebar?.classList.remove("open");
  }

  if (menuItem) {
    const targetTab = menuItem.getAttribute("data-tab");

    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
    menuItem.classList.add("active");

    document.querySelectorAll(".tab-content").forEach(content => {
      content.classList.add("hidden");
    });

    const selectedTab = document.getElementById(`${targetTab}-tab`);
    if (selectedTab) selectedTab.classList.remove("hidden");

    sidebar?.classList.remove("open");
  }
});

// Position Size / Lot Calculator
const calcBtn = document.getElementById("calculate-btn");
if (calcBtn) {
  calcBtn.addEventListener("click", () => {
    const balance = parseFloat(document.getElementById("calc-balance").value) || 0;
    const riskPercent = parseFloat(document.getElementById("calc-risk").value) || 0;
    const slPips = parseFloat(document.getElementById("calc-sl-pips").value) || 1;

    const riskAmount = (balance * riskPercent) / 100;
    const lotSize = (riskAmount / (slPips * 10)).toFixed(2);

    document.getElementById("risk-amount").innerText = riskAmount.toFixed(2);
    document.getElementById("lot-result").innerText = `${lotSize} Lot`;
  });
}

// Auth Handlers
if (signupBtn) {
  signupBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return alert("Please enter email and password");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Save user details with signup timestamp
      await set(ref(db, `users/${user.uid}`), {
        email: email,
        signupTime: Date.now(),
        isVIP: false
      });

      alert("Account created successfully! You get 5 free new signals.");
    } catch (error) {
      alert(error.message);
    }
  });
}

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    if (!email || !password) return alert("Please enter email and password");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      alert(error.message);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth);
  });
}

// Auth State Observer
onAuthStateChanged(auth, async (user) => {
  if (user) {
    if (authSection) authSection.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.remove("hidden");

    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    if (userData) {
      userSignupTime = userData.signupTime || Date.now();
      isUserVIP = userData.isVIP || false;
    } else {
      userSignupTime = Date.now();
      isUserVIP = false;
    }

    if (user.email.toLowerCase() === "admin@tradingpanda.com") {
      if (adminPanel) adminPanel.classList.remove("hidden");
      if (adminRequestsMenuItem) adminRequestsMenuItem.classList.remove("hidden");
      if (userBadge) {
        userBadge.innerText = "Admin VIP";
        userBadge.className = "badge purple";
      }
      loadPaymentRequests();
    } else {
      if (adminPanel) adminPanel.classList.add("hidden");
      if (adminRequestsMenuItem) adminRequestsMenuItem.classList.add("hidden");
      if (userBadge) {
        userBadge.innerText = isUserVIP ? "VIP Member 👑" : "Free Member";
        userBadge.className = isUserVIP ? "badge purple" : "badge free";
      }
    }
    
    // Refresh signals feed according to user status
    listenToSignals();

  } else {
    userSignupTime = 0;
    isUserVIP = false;
    if (authSection) authSection.classList.remove("hidden");
    if (adminPanel) adminPanel.classList.add("hidden");
    if (adminRequestsMenuItem) adminRequestsMenuItem.classList.add("hidden");
    if (logoutBtn) logoutBtn.classList.add("hidden");
    if (userBadge) {
      userBadge.innerText = "Free Plan";
      userBadge.className = "badge free";
    }
    listenToSignals();
  }
});

// Submit Payment TID (User)
if (tidForm) {
  tidForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) return alert("Please login first!");

    const tidValue = document.getElementById("tid-input").value.trim();
    if (!tidValue) return alert("Please enter a valid TID number!");

    const reqRef = ref(db, `payment_requests/${currentUser.uid}`);
    set(reqRef, {
      email: currentUser.email,
      tid: tidValue,
      timestamp: Date.now(),
      status: "pending"
    }).then(() => {
      alert("TID Submitted Successfully! Admin will verify and activate your VIP access soon.");
      tidForm.reset();
    }).catch(err => alert(err.message));
  });
}

// Load Pending Payment Requests (Admin Only)
function loadPaymentRequests() {
  const reqsRef = ref(db, "payment_requests");
  onValue(reqsRef, (snapshot) => {
    if (!paymentRequestsContainer) return;
    paymentRequestsContainer.innerHTML = "";
    const data = snapshot.val();

    if (!data) {
      paymentRequestsContainer.innerHTML = "<p style='color:var(--text-muted); font-size:0.9rem;'>No pending VIP payment requests right now.</p>";
      return;
    }

    Object.keys(data).forEach((uid) => {
      const item = data[uid];
      const reqCard = document.createElement("div");
      reqCard.style.cssText = "background:rgba(255,255,255,0.03); border:1px solid var(--border-color); padding:10px 15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;";
      
      reqCard.innerHTML = `
        <div>
          <strong>${item.email}</strong><br>
          <span style="color:#00e676; font-size:0.85rem;">TID: ${item.tid}</span>
        </div>
        <div>
          <button style="background:#00e676; color:#000; border:none; padding:5px 12px; border-radius:5px; font-weight:bold; cursor:pointer; margin-right:5px;" onclick="approveVIP('${uid}')">Approve</button>
          <button style="background:#ff1744; color:#fff; border:none; padding:5px 12px; border-radius:5px; font-weight:bold; cursor:pointer;" onclick="rejectVIP('${uid}')">Reject</button>
        </div>
      `;
      paymentRequestsContainer.appendChild(reqCard);
    });
  });
}

window.approveVIP = async (uid) => {
  await set(ref(db, `users/${uid}/isVIP`), true);
  await remove(ref(db, `payment_requests/${uid}`));
  alert("Payment Approved! VIP status granted.");
};

window.rejectVIP = (uid) => {
  remove(ref(db, `payment_requests/${uid}`));
  alert("Payment Request Rejected.");
};

// Post Signal (Admin)
if (signalForm) {
  signalForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const pair = document.getElementById("pair").value;
    const action = document.getElementById("action").value;
    const entry = document.getElementById("entry").value;
    const sl = document.getElementById("sl").value;
    const tp = document.getElementById("tp").value;

    const signalRef = ref(db, "signals");
    const newSignalRef = push(signalRef);
    
    set(newSignalRef, {
      pair: pair.toUpperCase(),
      action,
      entry,
      sl,
      tp,
      timestamp: Date.now()
    }).then(() => {
      alert("Signal Published!");
      signalForm.reset();
    }).catch((err) => {
      alert(err.message);
    });
  });
}

// Realtime Signal Feed Listener with 5 Free Trial Logic
function listenToSignals() {
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
    const isAdmin = currentUser && currentUser.email.toLowerCase() === "admin@tradingpanda.com";
    const isVIP = isUserVIP || isAdmin;

    // Convert object to array and sort by time (newest first)
    const signalList = Object.entries(data)
      .map(([id, val]) => ({ id, ...val }))
      .sort((a, b) => b.timestamp - a.timestamp);

    // Filter signals published AFTER user registered
    let userNewSignalsCount = 0;

    signalList.forEach((sig) => {
      const cardWrapper = document.createElement("div");
      cardWrapper.style.position = "relative";
      cardWrapper.style.marginBottom = "15px";

      const card = document.createElement("div");
      let isLocked = false;

      if (!isVIP) {
        // If signal came after user signed up
        if (userSignupTime > 0 && sig.timestamp >= userSignupTime) {
          userNewSignalsCount++;
          // Unlock first 5 signals, lock 6th onwards
          if (userNewSignalsCount > 5) {
            isLocked = true;
          }
        } else {
          // All older historical signals published before signup are locked for free user
          isLocked = true;
        }
      }

      card.className = `signal-card ${sig.action.toLowerCase()} ${isLocked ? 'locked' : ''}`;
      
      card.innerHTML = `
        <div class="signal-header">
          <span class="pair-title" style="font-weight:bold; font-size:1.1rem;">${sig.pair}</span>
          <span class="badge ${sig.action.toLowerCase() === 'buy' ? 'green' : 'red'}" style="float:right;">${sig.action}</span>
        </div>
        <div class="signal-details" style="display:flex; justify-content:space-between; margin-top:10px;">
          <div><span>ENTRY: </span><strong>${sig.entry}</strong></div>
          <div><span>SL: </span><strong class="red">${sig.sl}</strong></div>
          <div><span>TP: </span><strong class="green">${sig.tp}</strong></div>
        </div>
      `;

      cardWrapper.appendChild(card);

      if (isLocked) {
        const lockOverlay = document.createElement("div");
        lockOverlay.className = "lock-overlay";
        lockOverlay.innerHTML = `
          <p style="color:#fff; font-weight:bold;">🔒 5-Free Trial Limit Reached</p>
          <p style="color:var(--text-muted); font-size:0.8rem; margin-top:3px;">Upgrade to VIP to access unlimited signals</p>
          <button class="unlock-btn" style="margin-top:8px;" onclick="document.querySelector('[data-tab=\\'premium\\']').click()">Upgrade to VIP</button>
        `;
        cardWrapper.appendChild(lockOverlay);
      }

      signalsContainer.appendChild(cardWrapper);
    });
  });
}
