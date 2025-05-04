# Project Robber – Backend (Rust/Tauri)

Ce document décrit en détail la partie **backend** de Project Robber, implémentée en Rust avec Tauri. Il est destiné à tout collaborateur qui a lu le README global et souhaite comprendre l’architecture, les principes et le **flux** de traitement sans avoir à plonger immédiatement dans le code.

---

## 1. Contexte et philosophie

- **Objectif** : Offrir un moteur robuste pour copier un dossier, remplacer du texte (avec variantes de casse), et renommer fichiers/dossiers, tout en restant extensible et maintenable.
- **Technologies** : Rust pour la sécurité mémoire et la performance, Tauri pour l’intégration desktop, `anyhow` pour la gestion d’erreurs, `serde` pour la communication front/back.
- **Principes** : SOLID appliqués – chaque composant a une seule responsabilité claire, facilitant tests et extensions.

---

## 2. Flux de traitement (`run_robber`)

1. **Réception de la configuration**  
   Le frontend envoie un JSON décrivant :
   - dossier source et destination  
   - options de création de sous-dossier (nom personnalisé ou timestamp)  
   - génération automatique de variantes de casse  
   - activation du renommage  
   - liste de paires (chaîne à remplacer → nouvelle chaîne)

2. **Préparation du dossier de destination**  
   - Si `create_subfolder` est vrai, on crée un sous-dossier :  
     - soit nommé par un timestamp (`YYYYMMDD_HHMMSS`),  
     - soit par un nom personnalisé fourni.  
   - Sinon, on écrit directement à la racine de la destination.

3. **Copie initiale**  
   Le service **FileManager** recrée intégralement l’arborescence de la source dans la destination, en ignorant les extensions binaires/images.

4. **Prétraitement des paires**  
   - Si l’option `variants` est active :  
     - **TextService** génère pour chaque paire `{Old, New}` trois variantes :  
       - préservant la casse initiale  
       - tout en minuscules  
       - tout en MAJUSCULES  
     - Les doublons sont éliminés automatiquement.

5. **Remplacement dans les fichiers**  
   - Parcours récursif de tous les fichiers texte restant.  
   - À chaque fichier, **TextService** lit puis réécrit son contenu en appliquant les remplacements via des expressions régulières sécurisées (`regex::escape`).

6. **Renommage post-traitement**  
   - Si `rename` est vrai :  
     - **Renamer** effectue un parcours bottom-up :  
       1. renomme d’abord les fichiers,  
       2. puis les dossiers,  
     - pour éviter les collisions de chemins.  
     - Chaque nom est mis à jour via un simple `String.replace(old, new)`.

7. **Retour et logs**  
   - Le nombre de fichiers traités est retourné au frontend.  
   - En option, un plugin de log (tauri-plugin-log) peut enregistrer les étapes pour débogage.

---

## 3. Architecture des modules

```
src-tauri/src/
├── config/
│   └── process_config.rs   # Struct `ProcessConfig` désérialisée depuis le front
├── commands/
│   └── robber.rs           # `#[tauri::command] fn run_robber(config) {...}`
├── services/
│   ├── file_manager.rs     # Gestion de la copie et du comptage
│   ├── text_service.rs     # Remplacement texte + génération variantes casse
│   └── renamer.rs          # Renommage bottom-up
├── types/
│   └── word_pair.rs        # DTO `WordPair { old, new }`
└── main.rs                 # Intégration Tauri + registration de `run_robber`
```

- **Séparation claire** :  
  - *Config* pour la désérialisation JSON.  
  - *Commands* comme point d’entrée Tauri.  
  - *Services* encapsulent la logique métier.  
  - *Types* partagés (WordPair).

---

## 4. Extensibilité et bonnes pratiques

- **SOLID** :  
  - *Single Responsibility* par module.  
  - *Open/Closed* : on peut ajouter de nouveaux services sans modifier l’existant.
- **Gestion d’erreurs** via `anyhow` avec contextes explicites.
- **Tests unitaires** faciles : chaque service (FileManager, TextService, Renamer) peut être testé isolément.
- **Progression & annulation** : prévu pour émettre des events Tauri, stocker le statut dans `state.rs` si besoin futur.

---

Ce README backend permet à tout développeur de **comprendre le rôle** de chaque fichier, **suivre** le flux de traitement et **appréhender** la philosophie générale avant d’explorer le code.
