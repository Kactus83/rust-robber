# Project Robber

**Project Robber** est un outil de copie, de remplacement et de renommage de fichiers (Tauri + Rust) piloté par une interface Angular.  
Il permet de :

- Copier un dossier source vers une destination (optionnellement dans un sous-dossier à horodater ou nommé).  
- Rechercher et remplacer des paires de mots dans les fichiers copiés (avec variantes de casse).  
- Renommer fichiers et dossiers selon ces mêmes paires.  
- Afficher une barre de progression en temps réel via des événements Tauri.

---

## 📦 Prérequis

1. **Node.js & npm**  
   - Windows/macOS/Linux : installez la dernière LTS depuis  
     https://nodejs.org/

2. **Rust & Cargo**  
   - Windows : [rustup-init.exe](https://rustup.rs/)  
   - macOS/Linux :  
     ```bash
     curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
     ```

3. **Tauri prerequisites**  
   - Windows : 
     - Installez Visual Studio 2022 (Desktop workload C/C++), 
     - GTK (via MSYS2).  
   - macOS :  
     ```bash
     brew install gtk+3 libappindicator
     ```
   - Linux (Ubuntu/Debian) :  
     ```bash
     sudo apt update
     sudo apt install libwebkit2gtk-4.0-dev libgtk-3-dev build-essential curl
     ```

4. **Angular CLI** (option : recommandé)  
   ```bash
   npm install -g @angular/cli
   ```

---

## 🚀 Installation & setup

Cloner le dépôt et installer les dépendances front-end et back-end :

```bash
git clone https://votre.repo/project-robber.git
cd project-robber

# 1. Front-end Angular
cd src/app
npm install

# 2. Back-end Tauri / Rust
cd ../../src-tauri
cargo install tauri-cli     # si nécessaire
```

Sous Windows, ouvrez un terminal **MSYS2 MinGW 64-bit** pour la partie Rust/Tauri.

---

## 🛠️ Mode développement

### Lancer le front-end Angular

```bash
# dans src/app
npm run start
# ou
ng serve --open
```

Le dev-server Angular écoute par défaut sur http://localhost:4200.

### Lancer Tauri (UI + Rust)

Ouvrez un autre terminal pointant sur `src-tauri` (MSYS2 sous Windows) :

```bash
cd src-tauri
npm install            # installe @tauri-apps/api
tauri dev
```

> **Note** : `tauri dev` compile le binaire Rust en dev, puis lance la fenêtre Tauri pointant sur http://localhost:4200.

---

## 📦 Build de production

1. **Compiler Angular**  
   ```bash
   # dans src/app
   npm run build -- --prod
   ```
   Les fichiers compilés sont générés dans `src/app/dist`.

2. **Packager Tauri**  
   ```bash
   cd src-tauri
   tauri build
   ```
   - Windows : `.msi`/`.exe` dans `src-tauri/target/release/bundle`.  
   - macOS : `.app` et `.dmg`.  
   - Linux : `.AppImage` ou `.deb`.

---

## 📁 Structure du projet

```
project-robber/
├─ src/
│  ├─ app/               # code Angular (TS, HTML, SCSS)
│  │  ├─ components/
│  │  ├─ services/
│  │  └─ types/
│  └─ tauri.conf.json    # config Tauri
├─ src-tauri/
│  ├─ src/
│  │  ├─ commands/       # impl. Rust des commandes Tauri
│  │  ├─ services/       # logiques de copie, rename, text
│  │  ├─ types/
│  │  └─ main.rs         # bootstrap Tauri
│  ├─ Cargo.toml
│  └─ tauri.conf.json
└─ README.md
```

---

## 🎯 Points clés

- **Progression** : émises du début à la fin, couvrant copie (0–30%) + remplacement (30–100%).  
- **Filtrage** : seuls les fichiers identifiés par le diagnostic (avec occurrences) sont traités.  
- **Renommage** : optionnel, utilise mêmes paires.  
- **UI Angular** : abonnée aux événements `robber-progress`.

