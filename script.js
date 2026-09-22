document.addEventListener("DOMContentLoaded", () => {
    const signalForm = document.getElementById("signal-form");
    const signalsFeedList = document.getElementById("signals-feed-list");

    // Default Initial Mock Data
    const defaultSignals = [
        { id: 1, pair: "XAUUSD", type: "BUY", entry: "4000", sl: "3950", tp: "4050", status: "ACTIVE" },
        { id: 2, pair: "XAUUSD", type: "SELL", entry: "4100", sl: "4200", tp: "4000", status: "ACTIVE" },
        { id: 3, pair: "XAUUSD", type: "BUY", entry: "4360", sl: "4250", tp: "4380", status: "ACTIVE" },
        { id: 4, pair: "XAUUSD", type: "BUY", entry: "4400", sl: "4350", tp: "4450", status: "ACTIVE" }
    ];

    // Get signals from localStorage or set default
    function getSignals() {
        const stored = localStorage.getItem("trading_signals_data");
        if (!stored) {
            localStorage.setItem("trading_signals_data", JSON.stringify(defaultSignals));
            return defaultSignals;
        }
        return JSON.parse(stored);
    }

    // Render signals to Live Feed
    function renderSignals() {
        const signals = getSignals();
        signalsFeedList.innerHTML = "";

        if (signals.length === 0) {
            signalsFeedList.innerHTML = `
                <div class="text-center py-8 bg-[#130d24] rounded-xl border border-purple-900/20 text-gray-400">
                    Koi signal available nahi hai. Naya signal add karein!
                </div>
            `;
            return;
        }

        signals.forEach((signal) => {
            const card = document.createElement("div");
            card.className = "bg-[#130d24] p-4 rounded-xl border border-purple-900/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4";

            const isBuy = signal.type === "BUY";
            const typeBadgeColor = isBuy ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-rose-400 border-rose-500/30 bg-rose-500/10";

            card.innerHTML = `
                <div class="flex-1 w-full">
                    <div class="flex items-center justify-between mb-2">
                        <span class="font-bold text-lg tracking-wide text-white">${signal.pair}</span>
                        <span class="text-xs font-extrabold px-3 py-1 rounded border ${typeBadgeColor}">
                            ${signal.type}
                        </span>
                    </div>
                    <div class="flex items-center justify-between text-sm text-gray-300 bg-[#1c1335] p-2.5 rounded-lg border border-purple-900/20">
                        <span>ENTRY: <strong class="text-white">${signal.entry}</strong></span>
                        <span>SL: <strong class="text-rose-400">${signal.sl}</strong></span>
                        <span>TP: <strong class="text-emerald-400">${signal.tp}</strong></span>
                    </div>
                </div>

                <!-- Admin Action Controls -->
                <div class="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-purple-900/20">
                    <button onclick="closeSignalHandler(${signal.id})" class="bg-amber-600/20 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/40 px-3 py-1.5 rounded text-xs font-semibold transition">
                        🔒 Close
                    </button>
                    <button onclick="deleteSignalHandler(${signal.id})" class="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 px-3 py-1.5 rounded text-xs font-semibold transition">
                        🗑️ Delete
                    </button>
                </div>
            `;

            signalsFeedList.appendChild(card);
        });
    }

    // Add New Signal Handler
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
            status: "ACTIVE"
        };

        signals.unshift(newSignal);
        localStorage.setItem("trading_signals_data", JSON.stringify(signals));
        
        signalForm.reset();
        renderSignals();
    });

    // Delete Signal Function
    window.deleteSignalHandler = (id) => {
        if (confirm("Kya aap is signal ko delete karna chahte hain?")) {
            let signals = getSignals();
            signals = signals.filter(s => s.id !== id);
            localStorage.setItem("trading_signals_data", JSON.stringify(signals));
            renderSignals();
        }
    };

    // Close Signal Function
    window.closeSignalHandler = (id) => {
        let signals = getSignals();
        signals = signals.filter(s => s.id !== id);
        localStorage.setItem("trading_signals_data", JSON.stringify(signals));
        renderSignals();
        alert("Signal close kar diya gaya hai.");
    };

    // Initial Render
    renderSignals();
});
