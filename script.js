document.addEventListener("DOMContentLoaded", () => {
    const roleSelector = document.getElementById("role-selector");
    const signalsFeedList = document.getElementById("signals-feed-list");
    const adminSection = document.getElementById("admin-publish-section");
    const userStatusBadge = document.getElementById("user-status-badge");
    const signalForm = document.getElementById("signal-form");

    // 1. User Signup Timestamp Initialization (Simulated Free Account Registration)
    if (!localStorage.getItem("user_signup_time")) {
        // Sets user registration to current time
        localStorage.setItem("user_signup_time", Date.now().toString());
    }
    const userSignupTime = parseInt(localStorage.getItem("user_signup_time"), 10);

    // 2. Default Signals Data Initialization
    function getSignals() {
        const stored = localStorage.getItem("trading_signals_data");
        if (!stored) {
            const now = Date.now();
            // Seed sample signals generated after signup
            const sampleSignals = [
                { id: now, pair: "XAUUSD", type: "BUY", entry: "2738.50", sl: "2725.00", tp: "2750.00", timestamp: now },
                { id: now - 1000, pair: "XAUUSD", type: "SELL", entry: "2745.00", sl: "2755.00", tp: "2730.00", timestamp: now - 1000 },
                { id: now - 2000, pair: "EURUSD", type: "BUY", entry: "1.0820", sl: "1.0790", tp: "1.0870", timestamp: now - 2000 },
                { id: now - 3000, pair: "XAUUSD", type: "BUY", entry: "2720.00", sl: "2710.00", tp: "2740.00", timestamp: now - 3000 },
                { id: now - 4000, pair: "BTCUSD", type: "BUY", entry: "68450.00", sl: "67500.00", tp: "70000.00", timestamp: now - 4000 }
            ];
            localStorage.setItem("trading_signals_data", JSON.stringify(sampleSignals));
            return sampleSignals;
        }
        return JSON.parse(stored);
    }

    // 3. Main Render Function with Membership Logic
    function renderFeed() {
        const currentRole = roleSelector.value;
        const allSignals = getSignals();

        // Sort signals chronological order (oldest to newest relative to post order)
        allSignals.sort((a, b) => a.timestamp - b.timestamp);

        // Filter signals posted AFTER user signup
        const postSignupSignals = allSignals.filter(s => s.timestamp >= userSignupTime);

        // Show Admin section if ADMIN selected
        if (currentRole === "ADMIN") {
            adminSection.classList.remove("hidden");
            userStatusBadge.innerText = "Admin VIP Panel";
            userStatusBadge.className = "text-xs bg-purple-600 text-white px-2.5 py-1 rounded-full font-semibold";
        } else if (currentRole === "VIP") {
            adminSection.classList.add("hidden");
            userStatusBadge.innerText = "VIP Unlimited Member";
            userStatusBadge.className = "text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-semibold border border-amber-500/30";
        } else {
            adminSection.classList.add("hidden");
            userStatusBadge.innerText = "Free Access (First 5 Signals)";
            userStatusBadge.className = "text-xs bg-purple-500/20 text-purple-300 px-2.5 py-1 rounded-full font-semibold border border-purple-500/30";
        }

        signalsFeedList.innerHTML = "";

        if (allSignals.length === 0) {
            signalsFeedList.innerHTML = `<div class="text-center py-8 text-gray-400">No signals published yet.</div>`;
            return;
        }

        // Render from newest to oldest for visual display
        const displayList = [...allSignals].reverse();

        displayList.forEach((signal) => {
            const card = document.createElement("div");
            card.className = "relative bg-[#130d24] p-4 rounded-xl border border-purple-900/30 overflow-hidden";

            // Determine if signal should be LOCKED for Free User
            let isLocked = false;
            if (currentRole === "FREE") {
                const signalIndexAfterSignup = postSignupSignals.findIndex(s => s.id === signal.id);
                // Lock if signal was published before signup or if it's the 6th or later signal
                if (signalIndexAfterSignup === -1 || signalIndexAfterSignup >= 5) {
                    isLocked = true;
                }
            }

            const isBuy = signal.type === "BUY";
            const badgeClass = isBuy ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-rose-400 border-rose-500/30 bg-rose-500/10";

            if (isLocked) {
                // Blurred & Locked Layout
                card.innerHTML = `
                    <div class="filter blur-md select-none pointer-events-none opacity-40 flex items-center justify-between">
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

                    <!-- Lock Overlay -->
                    <div class="absolute inset-0 bg-[#0b0813]/80 backdrop-blur-sm flex flex-col md:flex-row items-center justify-between p-4 z-10">
                        <div class="flex items-center gap-3">
                            <span class="text-2xl">🔒</span>
                            <div>
                                <h4 class="text-sm font-bold text-white">Signal Locked (VIP Only)</h4>
                                <p class="text-xs text-gray-400">Aapki free 5 signals ki limit poori ho chuki hai.</p>
                            </div>
                        </div>
                        <button onclick="alert('Redirecting to VIP Upgrade Page...')" class="mt-2 md:mt-0 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg transition">
                            👑 Upgrade to VIP
                        </button>
                    </div>
                `;
            } else {
                // Clear Unlocked Layout
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
                                <button onclick="deleteSignal(${signal.id})" class="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 px-3 py-1.5 rounded text-xs font-semibold transition">
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

    // 4. Admin Publish Signal Event Handler
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
        alert("Naya Signal Publish Ho Gaya!");
    });

    // 5. Delete Signal Event Handler
    window.deleteSignal = (id) => {
        if (confirm("Kya aap is signal ko delete karna chahte hain?")) {
            let signals = getSignals();
            signals = signals.filter(s => s.id !== id);
            localStorage.setItem("trading_signals_data", JSON.stringify(signals));
            renderFeed();
        }
    };

    // Role Selector Change Listener
    roleSelector.addEventListener("change", renderFeed);

    // Initial Load
    renderFeed();
});
