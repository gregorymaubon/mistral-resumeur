# Résumé (1 paragraphe) – Extension Chrome (Mistral)

Extension **personnelle** qui :
- lit le **texte sélectionné** dans l’onglet actif,
- demande à **Mistral** un **résumé en un seul paragraphe en français ou en anglais** (le prompt est modifiable),
- l’affiche dans le **popup** avec un bouton **Copier**,
- affiche la **consommation de tokens** (prompt, complétion, total) du résumé,
- gère un **historique** trié par date de création décroissante avec rappel des tokens consommés.
---

## Installation

1. Copie ce dossier `mistral-resumeur/` en local.
2. Renomme `config.sample.js` en `config.js` et **édite** :
   - `API_KEY` : ta clé Mistral
   - `MODEL` : p.ex. `mistral-small-latest`
   - `API_URL` : `https://api.mistral.ai/v1/chat/completions`
3. Chrome → `chrome://extensions` → active **Mode développeur**.
4. **Charger l’extension non empaquetée** → choisis le dossier.
5. Sur une page web, **sélectionne** du texte → ouvre le **popup** :
   - *Relire la sélection* → recharge la sélection.
   - *Résumer* → envoie à Mistral et affiche le paragraphe.
   - *Copier* → met le résumé dans le presse-papiers.

> Note : sur certaines pages (chrome://, Web Store, quelques PDF), la sélection n’est pas accessible.

---

## Obtenir une clé API Mistral

1. Crée un compte sur la **plateforme Mistral**.
2. Active la **facturation** si nécessaire (certaines fonctionnalités en dépendent).
3. Génére une **clé API** (“API Keys”) et copie-la dans `config.js` (`API_KEY`).
4. Vérifie ton modèle (`MODEL`) et les **quotas/limites**.

---

## Personnalisation

- **Prompt** : modifie `PROMPT_TEMPLATE` (conserve la balise `__TEXT__`).
- **Température** : 0.3 par défaut (résumés courts et fidèles).
- **MAX_CHARS** : tronque l’entrée si tu veux limiter le coût/latence.

---

## Dépannage

- **Clé invalide/quota** : vérifie `API_KEY`, modèle, état du compte.
- **Sélection introuvable** : essaie sur une page web classique (pas `chrome://`).
- **Debug** : clic droit sur le popup → **Inspecter** pour voir la console.

---

## Licence

Usage personnel uniquement car la clé est publique dans le code. Ne pas distribuer ni publier avec la clé en clair.
