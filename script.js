// LocalStorage based Signal Management with Delete & Update options

document.addEventListener("DOMContentLoaded", () => {
    const signalForm = document.getElementById("signal-form");
    const activeSignalContainer = document.getElementById("active-signal-container");

    // Render Active Signal on Dashboard
    function renderActiveSignal() {
        const storedSignal = JSON.parse(localStorage.getItem("active_trading_signal"));

        if (!storedSignal || storedSignal.status === "CLOSED") {
            activeSignalContainer.innerHTML = `
                <div class="text-center py-6 text-gray-400">
                    <p class="text-sm">Abhi koi active signal nahi hai.</p>
                    <p class="text-xs text-slate-500 mt-1">Naya signal publish karne par yahan live update show hoga.</p>
                </div>
            `;
            return;
        }

        // Active Signal Card HTML
        activeSignalContainer.innerHTML = `
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="px-2.5 py-1 text-xs font-bold rounded bg-green-500/20 text-green-400 border border-green-500/30">
                            ACTIVE SIGNAL
                        </span>
                        <h4 class="text-lg font-bold text-white">${storedSignal.pair} (${storedSignal.type})</h4>
                    </div>
                    <div class="flex gap-4 mt-2 text-sm text-gray-300">
                        <span>Entry: <b class="text-white">${storedSignal.entry}</b></span>
                        <span>TP: <b class="text-green-400">${storedSignal.tp}</b></span>
                        <span>SL: <b class="text-red-400">${storedSignal.sl}</b></span>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button id="close-signal-btn" class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1.5 rounded text-xs font-bold transition">
                        🔒 Close Signal
                    </button>
                    <button id="delete-signal-btn" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-xs font-bold transition">
                        🗑️ Delete Signal
                    </button>
                </div>
            </div>
        `;

        // Attach Delete & Close Event Handlers
        document.getElementById("delete-signal-btn").addEventListener("click", deleteSignal);
        document.getElementById("close-signal-btn").addEventListener("click", closeSignal);
    }

    // Publish New Signal
    signalForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const pair = document.getElementById("signal-pair").value;
        const type = document.getElementById("signal-type").value;
        const entry = document.getElementById("signal-entry").value;
        const tp = document.getElementById("signal-tp").value;
        const sl = document.getElementById("signal-sl").value;

        const newSignal = {
            id: Date.now(),
            pair,
            type,
            entry,
            tp,
            sl,
            status: "ACTIVE",
            timestamp: new Date().toISOString()
        };

        // Overwrites any previous active signal
        localStorage.setItem("active_trading_signal", JSON.stringify(newSignal));
        alert("Signal Kamiyabi Se Publish Ho Gaya!");
        
        signalForm.reset();
        renderActiveSignal();
    });

    // Delete Active Signal
    function deleteSignal() {
        if (confirm("Kya aap is signal ko bilkul delete karna chahte hain?")) {
            localStorage.removeItem("active_trading_signal");
            renderActiveSignal();
        }
    }

    // Manual Close Active Signal
    function closeSignal() {
        const storedSignal = JSON.parse(localStorage.getItem("active_trading_signal"));
        if (storedSignal) {
            storedSignal.status = "CLOSED";
            localStorage.setItem("active_trading_signal", JSON.stringify(storedSignal));
            renderActiveSignal();
        }
    }

    // Initial Load
    renderActiveSignal();
});
