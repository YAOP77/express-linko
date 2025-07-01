# Linko – Back-end (Node.js/Express)

## Description
Ce dossier contient l'API REST et le serveur WebSocket pour la plateforme de chat Linko. Il gère l'authentification, la gestion des utilisateurs, des salons (rooms), des messages et l'upload de fichiers.

## Installation

1. Cloner le dépôt et se placer dans le dossier `server-express` :
   ```bash
   cd server-express
   ```
2. Installer les dépendances :
   ```bash
   npm install
   ```
3. Configurer les variables d'environnement dans un fichier `.env` (voir `.env.example`).
4. Lancer le serveur :
   ```bash
   npm start
   ```

## Fonctionnalités principales
- Authentification JWT
- Gestion des utilisateurs et des salons
- Messagerie en temps réel (Socket.io)
- Upload de fichiers (avatars, médias)

## Structure des dossiers
- `controllers/` : Logique métier
- `models/` : Schémas Mongoose
- `routes/` : Endpoints API
- `uploads/` : Fichiers uploadés

## Prérequis
- Node.js >= 14
- MongoDB

## Auteur
Ton nom ou équipe
