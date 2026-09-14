/**
 * popup.js – Extension Chrome (Manifest V3) pour résumé 1 paragraphe (FR) avec Mistral
 * ------------------------------------------------------------------------------------
 * Rôle :
 *  - Récupère la sélection texte de l'onglet actif.
 *  - Construit un prompt (template depuis config.js) avec "__TEXT__" remplacé.
 *  - Appelle API Mistral directement (mode perso, clé visible)
 *  - Affiche le résumé dans le popup et permet de le copier.
 *
 * Remarques :
 *  - Certaines pages (chrome://, Web Store, PDF interne…) bloquent l'injection => pas de sélection possible.
 */

// ---- Raccourcis DOM ---------------------------------------------------------
const $ = (id) => document.getElementById(id);
const outputEl = $("output");
const selectionRawEl = $("selectionRaw");
const mainSection = $("mainSection");
const historySection = $("historySection");
const historyList = $("historyList");
const statusEl = $("status");
const langSelectEl = $("langSelect");

// ---- Lecture de la configuration globale (injectée par config.js) -----------
const CFG = (window && window.MISTRAL_CONFIG) || {};
const API_KEY = CFG.API_KEY;
const MODEL = CFG.MODEL || "mistral-small-3.1";
const TEMPERATURE = typeof CFG.TEMPERATURE === "number" ? CFG.TEMPERATURE : 0.3;
const PROMPT_TEMPLATE_FR = CFG.PROMPT_TEMPLATE_FR || CFG.PROMPT_TEMPLATE || "__TEXT__";
const PROMPT_TEMPLATE_EN = CFG.PROMPT_TEMPLATE_EN || CFG.PROMPT_TEMPLATE || "__TEXT__";
const MAX_CHARS = Number(CFG.MAX_CHARS || 0);
const API_URL = CFG.API_URL || "https://api.mistral.ai/v1/chat/completions";

/**
 * Récupère la langue sélectionnée enregistrée (par défaut: "fr").
 */
async function getTargetLanguage() {
    const res = await chrome.storage.local.get("targetLanguage");
    return res.targetLanguage || "fr";
}

// ---- Petit contrôle : clé renseignée en mode direct -------------------------
if (!API_KEY || API_KEY.includes("VOTRE_CLE_API_MISTRAL_ICI")) {
    document.addEventListener("DOMContentLoaded", () => {
        statusEl.textContent = "⛔ Ajoute ta clé API dans config.js (ou active USE_PROXY) puis recharge.";
    });
}

/**
 * Récupère la sélection texte dans l'onglet actif. Fallback sur <textarea>/<input>.
 */
async function getPageSelection() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return "";

    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const s = window.getSelection()?.toString() || "";
                if (s) return s;
                const el = document.activeElement;
                if (el && (el.tagName === "TEXTAREA" || el.tagName === "INPUT")) {
                    const { selectionStart, selectionEnd, value } = el;
                    if (selectionStart != null && selectionEnd != null && selectionStart !== selectionEnd) {
                        return value.slice(selectionStart, selectionEnd);
                    }
                }
                return "";
            }
        });
        return (result || "").toString();
    } catch {
        return "";
    }
}

/**
 * Génère un hash SHA-256 d'un texte pour servir de clé de cache.
 */
async function hashText(text) {
    const msgUint8 = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Construit le prompt à partir du template. Tronque si MAX_CHARS > 0.
 */
function buildPromptFromTemplate(rawText, lang = "fr") {
    const text = (rawText || "").toString();
    const sliced = MAX_CHARS > 0 ? text.slice(0, MAX_CHARS) : text;
    const template = lang === "en" ? PROMPT_TEMPLATE_EN : PROMPT_TEMPLATE_FR;
    return template.replace("__TEXT__", sliced);
}

/**
 * Appel en mode direct vers l'API de Mistral avec support du streaming.
 */
// ---- Affichage de la volumétrie des tokens ----------------------------------
const usageStatsEl = $("usageStats");
const tokenPromptEl = $("tokenPrompt");
const tokenCompletionEl = $("tokenCompletion");
const tokenTotalEl = $("tokenTotal");

function displayUsage(usage) {
    if (!usageStatsEl) return;
    if (!usage) {
        usageStatsEl.hidden = true;
        return;
    }
    const suffix = usage.estimated ? " (est.)" : "";
    tokenPromptEl.textContent = `Prompt : ${usage.prompt_tokens} tk${suffix}`;
    tokenCompletionEl.textContent = `Réponse : ${usage.completion_tokens} tk${suffix}`;
    tokenTotalEl.textContent = `Total : ${usage.total_tokens} tk${suffix}`;
    usageStatsEl.hidden = false;
}

/**
 * Tentative d'appel vers l'API de Mistral avec support du streaming.
 */
async function callMistralDirectAttempt(prompt, lang, onChunk, includeUsage) {
    const systemContent = lang === "en"
        ? "You are a concise assistant who summarizes accurately."
        : "Tu es un assistant concis qui résume fidèlement.";

    const body = {
        model: MODEL,
        messages: [
            { role: "system", content: systemContent },
            { role: "user", content: prompt }
        ],
        temperature: TEMPERATURE,
        stream: true
    };
    if (includeUsage) {
        body.stream_options = { include_usage: true };
    }

    const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const msg = data?.error?.message || JSON.stringify(data) || `HTTP ${resp.status}`;
        throw new Error(`Mistral: ${msg} [Status: ${resp.status}]`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let usage = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
            const dataLine = line.trim();
            if (!dataLine || dataLine === "data: [DONE]") continue;

            if (dataLine.startsWith("data: ")) {
                try {
                    const json = JSON.parse(dataLine.slice(6));
                    const content = json.choices?.[0]?.delta?.content || "";
                    if (content) {
                        fullText += content;
                        if (onChunk) onChunk(fullText);
                    }
                    if (json.usage) {
                        usage = json.usage;
                    }
                } catch (e) {
                    console.error("Erreur parsing chunk", e);
                }
            }
        }
    }
    return { text: fullText.trim(), usage };
}

/**
 * Appel avec gestion du repli automatique sans stream_options.
 */
async function callMistralDirect(prompt, lang, onChunk) {
    try {
        return await callMistralDirectAttempt(prompt, lang, onChunk, true);
    } catch (e) {
        const errorMsg = e.message || "";
        if (errorMsg.includes("422") || errorMsg.includes("400") || errorMsg.includes("stream_options")) {
            console.warn("stream_options non supporté par l'API, nouvel essai sans cette option...", e);
            const res = await callMistralDirectAttempt(prompt, lang, onChunk, false);
            const promptWords = prompt.trim().split(/\s+/).length;
            const completionWords = res.text.split(/\s+/).length;
            const promptTokens = Math.round(promptWords * 1.3);
            const completionTokens = Math.round(completionWords * 1.3);
            res.usage = {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                total_tokens: promptTokens + completionTokens,
                estimated: true
            };
            return res;
        }
        throw e;
    }
}

/**
 * Chaîne complète : lit la sélection → construit le prompt → appelle Mistral → affiche.
 */
async function runSummarizeFlow(auto = false) {
    try {
        statusEl.textContent = auto ? "Lecture de la sélection…" : "Traitement…";
        outputEl.hidden = true;
        outputEl.textContent = "";
        displayUsage(null);

        const sel = await getPageSelection();
        selectionRawEl.value = sel; // debug caché (non affiché)
        if (!sel || sel.trim().length === 0) {
            statusEl.textContent = "Aucune sélection détectée. Sélectionne du texte dans la page, puis clique « Résumer ».";
            return;
        }

        const currentLang = langSelectEl ? langSelectEl.value : await getTargetLanguage();

        // Construction du prompt
        const prompt = buildPromptFromTemplate(sel.trim(), currentLang);
        const cacheKey = await hashText(prompt);

        // Vérification du cache
        const cache = await chrome.storage.local.get(cacheKey);
        if (cache[cacheKey]) {
            const cachedVal = cache[cacheKey];
            statusEl.textContent = "Récupéré du cache ✅";
            
            if (typeof cachedVal === "object" && cachedVal !== null) {
                outputEl.textContent = cachedVal.summary || "";
                displayUsage(cachedVal.usage);
            } else {
                outputEl.textContent = cachedVal;
                displayUsage(null);
            }
            outputEl.hidden = false;
            return;
        }

        // Appel API avec streaming
        statusEl.textContent = "Appel à Mistral…";
        outputEl.hidden = false;
        
        const result = await callMistralDirect(prompt, currentLang, (chunk) => {
            outputEl.textContent = chunk;
            statusEl.textContent = "Génération en cours…";
        });

        if (result && result.text) {
            const cacheObj = {
                summary: result.text,
                timestamp: Date.now(),
                usage: result.usage
            };
            await chrome.storage.local.set({ [cacheKey]: cacheObj });
            displayUsage(result.usage);
            statusEl.textContent = "";
        } else {
            outputEl.textContent = "(Résumé vide)";
            displayUsage(null);
            statusEl.textContent = "";
        }
    } catch (e) {
        statusEl.textContent = e?.message || String(e);
        displayUsage(null);
    }
}

// ---- Bascule de vue ---------------------------------------------------------
function showView(view) {
    if (view === "history") {
        mainSection.hidden = true;
        historySection.hidden = false;
        renderHistory();
    } else {
        mainSection.hidden = false;
        historySection.hidden = true;
    }
}

async function renderHistory() {
    historyList.innerHTML = "<div class='muted'>Chargement…</div>";
    const all = await chrome.storage.local.get(null);
    const keys = Object.keys(all).filter(k => k.length === 64); // filtres les hash SHA256

    if (keys.length === 0) {
        historyList.innerHTML = "<div class='muted'>Aucun résumé en cache.</div>";
        return;
    }

    // Associer clés et données pour trier
    const items = keys.map(key => {
        const val = all[key];
        let summary = "";
        let timestamp = 0;
        let usage = null;

        if (typeof val === "object" && val !== null) {
            summary = val.summary || "";
            timestamp = val.timestamp || 0;
            usage = val.usage || null;
        } else {
            summary = val || "";
        }

        return { key, summary, timestamp, usage };
    });

    // Trier par date décroissante (les plus récents en premier)
    items.sort((a, b) => b.timestamp - a.timestamp);

    historyList.innerHTML = "";
    items.forEach(item => {
        const itemEl = document.createElement("div");
        itemEl.className = "history-item";
        
        let dateStr = "Date antérieure";
        if (item.timestamp > 0) {
            const dateObj = new Date(item.timestamp);
            dateStr = dateObj.toLocaleString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
        }

        let tokensStr = "";
        if (item.usage) {
            const suffix = item.usage.estimated ? " (est.)" : "";
            tokensStr = `• ${item.usage.total_tokens} tk${suffix} (${item.usage.prompt_tokens}p / ${item.usage.completion_tokens}r)`;
        }

        itemEl.innerHTML = `
            <div class="history-meta">
                <span class="history-date">${dateStr}</span>
                <span class="history-tokens">${tokensStr}</span>
            </div>
            <div class="history-text">${item.summary}</div>
            <div class="history-actions">
                <button class="btn-small copy-btn">Copier</button>
                <button class="btn-small delete-btn">Supprimer</button>
            </div>
        `;

        itemEl.querySelector(".copy-btn").addEventListener("click", async () => {
            await navigator.clipboard.writeText(item.summary);
            statusEl.textContent = "Copié !";
            setTimeout(() => statusEl.textContent = "", 1000);
        });

        itemEl.querySelector(".delete-btn").addEventListener("click", async () => {
            await chrome.storage.local.remove(item.key);
            renderHistory();
        });

        historyList.appendChild(itemEl);
    });
}

// ---- Boutons UI -------------------------------------------------------------
$("refreshSel").addEventListener("click", () => { showView("main"); runSummarizeFlow(true); });
$("summarize").addEventListener("click", () => { showView("main"); runSummarizeFlow(false); });
$("viewCache").addEventListener("click", () => showView("history"));
$("backToMain").addEventListener("click", () => showView("main"));

$("clearCache").addEventListener("click", async () => {
    if (confirm("Vider tout l'historique ?")) {
        await chrome.storage.local.clear();
        renderHistory();
    }
});

$("copy").addEventListener("click", async () => {
    try {
        const txt = outputEl.hidden ? "" : outputEl.textContent;
        if (!txt) { statusEl.textContent = "Rien à copier."; return; }
        await navigator.clipboard.writeText(txt);
        statusEl.textContent = "Résumé copié ✅";
        setTimeout(() => (statusEl.textContent = ""), 1500);
    } catch {
        statusEl.textContent = "Impossible de copier.";
    }
});

// ---- Autostart & Initialisation de la langue -------------------------------
document.addEventListener("DOMContentLoaded", async () => {
    if (langSelectEl) {
        const savedLang = await getTargetLanguage();
        langSelectEl.value = savedLang;

        langSelectEl.addEventListener("change", async () => {
            const newLang = langSelectEl.value;
            await chrome.storage.local.set({ targetLanguage: newLang });
            showView("main");
            runSummarizeFlow(false);
        });
    }
    runSummarizeFlow(true);
});
