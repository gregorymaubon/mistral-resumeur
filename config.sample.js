/**
 * FICHIER DE CONFIG – USAGE PERSO (clé visible côté client)
 * ---------------------------------------------------------
 * Copie ce fichier en "config.js", ajoute ta clé Mistral et adapte si besoin.
 * popup.html charge "config.js" avant "popup.js".
 *
 * Si CORS bloque les appels directs, utilise le proxy Cloudflare (worker/worker.js)
 * et remplace API_URL par l'URL de ton Worker (voir README).
 */

window.MISTRAL_CONFIG = {
    /**
     * Clé API Mistral – "Authorization: Bearer <KEY>"
     * Obtenir une clé : voir README > "Obtenir une clé API Mistral"
     */
    API_KEY: "VOTRE_CLE_API_MISTRAL_ICI",

    /**
     * Modèle conseillé pour un bon ratio qualité/vitesse/coût.
     * Exemples possibles (vérifier la doc Mistral) :
     *  - "mistral-small-3.1"
     *  - "mistral-medium-2508"
     */
    MODEL: "mistral-small-3.1",

    /**
     * Température : 0.0–1.0. 0.3 = concis/contrôlé → bien pour du résumé.
     */
    TEMPERATURE: 0.3,

    /**
     * Templates de prompt (FR & EN). "__TEXT__" sera remplacé par la sélection.
     */
    PROMPT_TEMPLATE_FR: [
        "Tu es un assistant concis.",
        "Consigne : Résume le texte ci-dessous en UN SEUL paragraphe en français (3 à 5 phrases),",
        "clair, fidèle et synthétique, sans puces, sans titres, sans ajout d’informations externes.",
        "",
        "Texte :",
        "__TEXT__"
    ].join("\n"),

    PROMPT_TEMPLATE_EN: [
        "You are a concise assistant.",
        "Instruction: Summarize the text below in ONE SINGLE paragraph in English (3 to 5 sentences),",
        "clear, faithful, and concise, without bullet points, titles, or adding external information.",
        "",
        "Text:",
        "__TEXT__"
    ].join("\n"),

    get PROMPT_TEMPLATE() {
        return this.PROMPT_TEMPLATE_FR;
    },

    /**
     * URL d’appel :
     *  - mode direct API Mistral : "https://api.mistral.ai/v1/chat/completions"
     *  - OU ton proxy Cloudflare Worker (si tu souhaites cacher la clé + gérer CORS)
     */
    API_URL: "https://api.mistral.ai/v1/chat/completions",

    /**
     * Limite de caractères envoyés (0 = pas de limite).
     * Pratique si tu résumes des pages très longues.
     */
    MAX_CHARS: 0,

    /**
     * Utiliser le proxy Cloudflare ?
     * - false : appelle l'API Mistral directement depuis le navigateur.
     * - true  : appelle le Worker (API_URL doit pointer sur le Worker).
     */
    USE_PROXY: false
};

