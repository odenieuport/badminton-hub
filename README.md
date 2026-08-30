# Badminton Hub

Application tout-en-un pour le badminton belge. Ce premier chantier couvre la
**gestion des classements et des rankings**, selon le règlement fédéral C700
(FRBB/LFBB/BV) : 12 niveaux de classement (1 = le plus élevé, 12 = le plus
bas), un par discipline (simple, double, mixte), calculés à partir de points
gagnés en tête-à-tête lors des tournois, interclubs et championnats.

Site public en lecture (rankings, fiches joueurs, simulateur), géré par un
petit nombre d'administrateurs authentifiés.

## Stack technique

React 19, TypeScript, Vite, Tailwind CSS v4, React Router, Supabase
(PostgreSQL + Auth), Vitest.

## Démarrage

```bash
npm install
cp .env.example .env.local   # renseigner l'URL et la clé publiable Supabase
npm run dev
npm run build
npm run lint
npm run test
```

## Architecture

- `src/lib/ranking-engine/` — moteur de calcul pur (sans dépendance React ni
  Supabase), qui implémente fidèlement le règlement C700 : grille de points
  (art. 715.2), validité des matchs (art. 715.3/715.5), calcul des moyennes de
  montée/descente (art. 715.4/715.5), évaluation du classement et protection
  26 semaines (art. 710/711/713), inactivité (art. 716), limite entre
  disciplines (art. 712), et un simulateur de progression. Couvert par 37
  tests unitaires (`npm run test`).
- `supabase/migrations/` — schéma PostgreSQL : `players`, `matches`,
  `player_rankings` (état courant), `ranking_history` (historique),
  `profiles` (rôles). Lecture publique (RLS), écriture réservée aux comptes
  `admin`/`superadmin`.
- `src/lib/rankingService.ts` — pont entre le moteur et Supabase :
  recalcul des moyennes après chaque match saisi, et évaluation mensuelle
  (date pivot, art. 713) qui met à jour classements et historique.
- `src/pages/` — pages publiques (`/`, `/rankings`, `/joueurs/:id`,
  `/simulateur`) et espace admin (`/admin/*`) : gestion des joueurs, saisie
  de matchs, import CSV en masse, déclenchement de l'évaluation mensuelle.

## Comptes admin

Un nouveau compte créé via `/admin/login` (« S'inscrire ») n'a **aucun
privilège** par défaut (rôle `pending`). Pour le promouvoir en administrateur,
un premier `superadmin` doit être créé manuellement en base :

```sql
update public.profiles set role = 'superadmin' where id = '<uuid auth.users>';
```

Ensuite, la gestion des rôles peut se faire depuis la table `profiles`
(un `superadmin` peut promouvoir d'autres comptes en `admin`).

## Limites connues / suite

- **Annexe 1 du règlement (points bonus tournois)** n'a pas pu être intégrée
  au moteur de calcul : elle est référencée par le règlement C700 mais n'était
  pas jointe au document fourni. À ajouter dès qu'elle est disponible.
- **Import/scraping depuis lfbb.be** : l'import CSV manuel de matchs est
  implémenté (voir `/admin/import`), mais un import automatique depuis le
  site de la LFBB n'a pas pu être développé (accès réseau à lfbb.be bloqué
  dans cet environnement de développement, et aucune API publique connue). À
  étudier séparément si un format d'export exploitable existe.
- L'évaluation mensuelle est déclenchée manuellement depuis l'espace admin
  (`/admin/evaluation`) plutôt que planifiée automatiquement ; une tâche
  planifiée (ex. Supabase Edge Function + cron) pourra automatiser le premier
  lundi de chaque mois.
