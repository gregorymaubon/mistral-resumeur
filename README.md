# Résumé (1 paragraphe) – Extension Chrome (Mistral)

Extension **personnelle** qui :
- lit le **texte sélectionné** dans l’onglet actif,
- demande à **Mistral** un **résumé en un seul paragraphe en français ou en anglais** (le prompt est modifiable),
- l’affiche dans le **popup** avec un bouton **Copier**,
- affiche la **consommation de tokens** (prompt, complétion, total) du résumé,
- permet de **configurer sa clé API Mistral** directement depuis l'interface du popup,
- gère un **historique** trié par date de création décroissante avec rappel des tokens consommés.

---

## Installation

1. Copie ce dossier `mistral_resumeur/` en local.
2. (Optionnel) Renomme `config.sample.js` en `config.js` si tu souhaites personnaliser le modèle ou le prompt par défaut.
3. Chrome → `chrome://extensions` → active le **Mode développeur**.
4. **Charger l’extension non empaquetée** → choisis le dossier.
5. Au premier lancement, une fenêtre modale s'ouvre automatiquement pour vous inviter à saisir votre **Clé API Mistral**. Vous pouvez également la modifier à tout moment via l'icône **Paramètres (⚙️)** en haut à droite.
6. Sur une page web, **sélectionne** du texte → ouvre le **popup** :
   - *Relire la sélection* → recharge la sélection.
   - *Résumer* → envoie à Mistral et affiche le paragraphe.
   - *Copier* → met le résumé dans le presse-papiers.

> Note : sur certaines pages (chrome://, Web Store, quelques PDF), la sélection n’est pas accessible.

---

## Obtenir et configurer une clé API Mistral

1. Crée un compte sur la **plateforme Mistral** (console.mistral.ai).
2. Active la **facturation** si nécessaire.
3. Génère une **clé API** (“API Keys”).
4. Saisis la clé API directement dans la fenêtre qui s'affiche au lancement du popup (ou via le bouton ⚙️). La clé est enregistrée dans le stockage local de ton navigateur (`chrome.storage.local`).

---

## Personnalisation

- **Prompt** : modifie `PROMPT_TEMPLATE_FR` ou `PROMPT_TEMPLATE_EN` dans `config.js` (conserve la balise `__TEXT__`).
- **Température** : 0.3 par défaut (résumés courts et fidèles).
- **MAX_CHARS** : tronque l’entrée si tu veux limiter le coût/latence.

---

## Dépannage

- **Clé invalide/quota** : si la clé API est invalide, expirée ou manquante, l'extension ouvrira automatiquement la fenêtre de saisie pour vous inviter à la vérifier et à la remplacer.
- **Sélection introuvable** : essaie sur une page web classique (pas `chrome://`).
- **Debug** : clic droit sur le popup → **Inspecter** pour voir la console.

---

## Licence

Usage personnel. Ne pas distribuer ni publier avec des clés API en clair.

