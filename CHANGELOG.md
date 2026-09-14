# Changelog

Toutes les modifications notables apportées à ce projet seront documentées dans ce fichier.

## [1.3.0] - 2026-09-14

### Ajouts
- **Sélection de la langue du résumé** : Ajout d'une option permettant de générer les résumés en Français (🇫🇷) ou en Anglais (🇬🇧), avec le Français sélectionné par défaut.
- **Prompts bilingues modulaires** : Définition de deux templates de prompt distincts (`PROMPT_TEMPLATE_FR` et `PROMPT_TEMPLATE_EN`) dans la configuration (`config.js` et `config.sample.js`).
- **Persistance des préférences** : Sauvegarde automatique du choix de langue de l'utilisateur dans le stockage local de l'extension (`chrome.storage.local`).

### Améliorations
- **Prompt système adapté** : Envoi d'un message système en anglais ou en français selon la langue sélectionnée pour garantir la cohérence des réponses.
- **Gestion du cache multilingue** : Calcul des hashes SHA-256 basé sur le prompt final, permettant de conserver en cache les résumés en français et en anglais d'un même texte sans conflit.
- **Design & Layout** : Intégration du sélecteur de langue dans un composant `.top-bar` épuré au niveau du header.

---

## [1.2.0] - 2026-05-26

### Ajouts
- **Affichage des statistiques de tokens** : L'extension affiche désormais la consommation de tokens (tokens envoyés, tokens reçus et total) directement sous le résumé généré.
- **Tri chronologique de l'historique** : Les anciens résumés sont triés par ordre de création (les plus récents en premier).
- **Date de création dans l'historique** : Affichage de la date et de l'heure précises de génération pour chaque élément de l'historique.
- **Rappel de consommation de tokens dans l'historique** : La volumétrie consommée est également sauvegardée et affichée pour chaque résumé passé.

### Améliorations
- **Refonte graphique moderne & premium** : Nouvelle interface claire et premium avec une palette raffinée allant du bleu à l'indigo et au violet, des boutons dotés d'icônes SVG et de micro-animations interactives.
- **Mécanisme de secours (fallback)** : Si l'API cible ne supporte pas `stream_options` (renvoie une erreur HTTP 400 ou 422), l'extension effectue un repli automatique en estimant le nombre de tokens basés sur le nombre de mots du texte.
- **Rétrocompatibilité du cache** : Les anciens résumés stockés sous forme de chaînes de caractères simples sont lus sans erreur (la date et les tokens sont simplement ignorés pour ces entrées).

---

## [1.1.0] - 2026-04-13

### Ajouts
- **Streaming des réponses** : Le résumé s'affiche désormais en temps réel au fur et à mesure de sa génération.
- **Historique des résumés** : Bouton "Historique" permettant de consulter, copier ou supprimer les anciens résumés.
- **Cache local** : Les résumés sont enregistrés localement (clé basée sur le hash SHA-256 du texte). Les résumés identiques se chargent instantanément et sans appel API supplémentaire.
- **Permission `storage`** : Ajoutée au manifest pour permettre la persistance des données.

### Améliorations
- Meilleure gestion des erreurs lors des appels API.
- Retours visuels améliorés dans le popup ("Génération en cours...", "Récupéré du cache ✅").

---

## [1.0.0] - 2026-04-13

### Version Initiale
- Lecture de la sélection de texte dans l'onglet actif.
- Envoi à Mistral AI pour un résumé en un paragraphe.
- Affichage dans un popup avec bouton de copie.
- Configuration via `config.js`.
