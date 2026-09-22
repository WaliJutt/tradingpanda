document.addEventListener("DOMContentLoaded", () => {
    const roleSelector = document.getElementById("role-selector");
    const signalsFeedList = document.getElementById("signals-feed-list");
    const adminSection = document.getElementById("admin-publish-section");
    const userStatusBadge = document.getElementById("user-status-badge");
    const headerUserBadge = document.getElementById("header-user-badge");
    const signalForm = document.getElementById("signal-form");
    const toggleSidebarBtn = document.getElementById("toggle-sidebar-btn");
    const sidebarDrawer = document.getElementById("sidebar-drawer");

    // 1. Sidebar Toggle Mobile/Desktop
    toggleSidebarBtn.addEventListener("click", () => {
        sidebarDrawer.classList.toggle("hidden");
    });

    // 2. Tab Navigation System
    window.switchTab = (tabName) => {
        document.querySelectorAll(".tab-content").forEach(el => el.classList.add("hidden"));
        document.getElementById(`tab-${tabName}`).classList.remove("hidden");

        // Highlight sidebar buttons
        const navButtons = ["dashboard", "chart", "accuracy", "analytics", "calculator", "settings"];
        navButtons.forEach(btn => {
            const el = document.getElementById(`nav-${btn}`);
            if (btn === tabName) {
                el.className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold text-left";
            } else {
                el.className = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-purple-900/20 text-left transition";
            }
        });
    };

    // 3. User Signup Registration Time Track
    if (!localStorage.getItem("user_signup_time")) {
        localStorage.setItem("user_signup_time", Date.now().toString());
    }
    const userSignupTime = parseInt(localStorage.getItem("user_signup_time"), 10);

    // 4. Signals Data Storage
    function getSignals() {
        const stored = localStorage.getItem("trading_signals_data");
        if (!stored) {
            const now = Date.now();
            const initialSignals = [
                { id: now, pair: "XAUUSD", type: "BUY", entry: "4400", sl: "4350", tp: "4450", timestamp: now },
                { id: now - 1000, pair: "XAUUSD", type: "BUY", entry: "4360", sl: "4250", tp: "4380", timestamp: now - 1000 },
                { id: now - 2000, pair: "XAUUSD", type: "SELL", entry: "4100", sl: "4200", tp: "4000", timestamp: now - 2000 },
                { id: now - 3000, pair: "XAUUSD", type: "BUY", entry: "4000", sl: "3950", tp: "4050", timestamp: now - 3000 }
            ];
            localStorage.setItem("trading_signals_data", JSON.stringify(initialSignals));
            return initialSignals;
        }
        return JSON.parse(stored);
    }

    // 5. Render Feed & Free First 5 Signals Logic
    function renderFeed() {
        const currentRole = roleSelector.value;
        const allSignals = getSignals();

        // Sort signals from oldest to newest relative to post creation
        allSignals.sort((a, b) => a.timestamp - b.timestamp);

        // Filter signals published after user signup
        const postSignupSignals = allSignals.filter(s => s.timestamp >= userSignupTime);

        // Update UI Badges & Admin Section Visibility
        if (currentRole === "ADMIN") {
            adminSection.classList.remove("hidden");
            userStatusBadge.innerText = "Admin Panel Active";
            userStatusBadge.className = "text-xs bg-purple-600 text-white px-3 py-1 rounded-full font-semibold";
            headerUserBadge.innerText = "Admin VIP";
        } else if (currentRole === "VIP") {
            adminSection.classList.add("hidden");
            userStatusBadge.innerText = "VIP Unlimited Member";
            userStatusBadge.className = "text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-semibold border border-amber-500/30";
            headerUserBadge.innerText = "VIP Member";
        } else {
            adminSection.classList.add("hidden");
            userStatusBadge.innerText = "Free Access (First 5 Signals)";
            userStatusBadge.className = "text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-semibold border border-purple-500/30";
            headerUserBadge.innerText = "Free Plan";
        }

        signalsFeedList.innerHTML = "";

        if (allSignals.length === 0) {
            signalsFeedList.innerHTML = `<div class="text-center py-8 text-gray-400 bg-[#130d24] rounded-xl border border-purple-900/20">Koi signal available nahi hai.</div>`;
            return;
        }

        // Display Signals from Newest to Oldest
        const displayList = [...allSignals].reverse();

        displayList.forEach((signal) => {
            const card = document.createElement("div");
            card.className = "relative bg-[#130d24] p-4 rounded-xl border border-purple-900/30 overflow-hidden shadow-md";

            // FREE Member First 5 Signals Unlocked Rule
            let isLocked = false;
            if (currentRole === "FREE") {
                const signalIndexAfterSignup = postSignupSignals.findIndex(s => s.id === signal.id);
                // Lock signal if published before signup OR if it is the 6th or later post
                if (signalIndexAfterSignup === -1 || signalIndexAfterSignup >= 5) {
                    isLocked = true;
                }
            }

            const isBuy = signal.type === "BUY";
            const badgeClass = isBuy ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-rose-400 border-rose-500/30 bg-rose-500/10";

            if (isLocked) {
                // Blur & Lock Card Layout
                card.innerHTML = `
                    <div class="filter blur-md select-none pointer-events-none opacity-30 flex items-center justify-between">
                        <div>
                            <span class="font-bold text-lg">${signal.pair}</span>
                            <div class="flex gap-4 mt-2 text-sm">
                                <span>ENTRY: XXXX</span>
                                <span>SL: XXXX</span>
                                <span>TP: XXXX</span>
                            </div>
                        </div>
                        <span class="text-xs font-bold px-3 py-1 rounded border ${badgeClass}">${signal.type}</span>
                    </div>

                    <!-- Overlay Lock Button -->
                    <div class="absolute inset-0 bg-[#0b0813]/85 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between p-4 z-10">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">🔒</span>
                            <div>
                                <h4 class="text-sm font-bold text-white">Signal Locked (VIP Only)</h4>
                                <p class="text-xs text-gray-400">Aapki free 5 signals ki limit poori ho chuki hai.</p>
                            </div>
                        </div>
                        <button onclick="alert('Redirecting to Payment Page...')" class="mt-2 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2.5 px-4 rounded-lg shadow-lg transition">
                            👑 Upgrade to VIP
                        </button>
                    </div>
                `;
            } else {
                // Unlocked Normal Card Layout
                card.innerHTML = `
                    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div class="flex-1 w-full">
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-bold text-lg tracking-wide text-white">${signal.pair}</span>
                                <span class="text-xs font-extrabold px-3 py-1 rounded border ${badgeClass}">
                                    ${signal.type}
                                </span>
                            </div>
                            <div class="flex items-center justify-between text-sm text-gray-300 bg-[#1c1335] p-2.5 rounded-lg border border-purple-900/20">
                                <span>ENTRY: <strong class="text-white">${signal.entry}</strong></span>
                                <span>SL: <strong class="text-rose-400">${signal.sl}</strong></span>
                                <span>TP: <strong class="text-emerald-400">${signal.tp}</strong></span>
                            </div>
                        </div>

                        ${currentRole === "ADMIN" ? `
                            <div class="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-purple-900/20 pt-2 md:pt-0">
                                <button onclick="deleteSignal(${signal.id})" class="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                                    🗑️ Delete
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            signalsFeedList.appendChild(card);
        });
    }

    // 6. Admin Publish Signal Event
    signalForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const signals = getSignals();

        const newSignal = {
            id: Date.now(),
            pair: document.getElementById("signal-pair").value.toUpperCase(),
            type: document.getElementById("signal-type").value,
            entry: document.getElementById("signal-entry").value,
            sl: document.getElementById("signal-sl").value,
            tp: document.getElementById("signal-tp").value,
            timestamp: Date.now()
        };

        signals.push(newSignal);
        localStorage.setItem("trading_signals_data", JSON.stringify(signals));

        signalForm.reset();
        renderFeed();
        alert("Signal Kamiyabi Se Publish Ho Gaya!");
    });

    // 7. Delete Signal Event
    window.deleteSignal = (id) => {
        if (confirm("Kya aap is signal ko delete karna chahte hain?")) {
            let signals = getSignals();
            signals = signals.filter(s => s.id !== id);
            localStorage.setItem("trading_signals_data", JSON.stringify(signals));
            renderFeed();
        }
    };

    // Role Switch Listener
    roleSelector.addEventListener("change", renderFeed);

    // Initial Render
    renderFeed();
});
