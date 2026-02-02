# Fonctionnalité TELC - Gestion des Examens de Certification en Langue Allemande

## Description du Service

La fonctionnalité **TELC** (The European Language Certificates) est un système complet de gestion des candidats aux examens de certification en langue allemande, intégré au panneau d'administration de l'école Nisrine.

---

## Fonctionnalités Incluses

### 1. Gestion des Candidats

- **Création manuelle des candidats** avec informations complètes (nom, CIN, email, téléphone, niveau d'examen, ville)
- **Modification et suppression** des fiches candidats
- **Transfert de candidats** entre différents mois d'examen avec historique de suivi
- **Filtrage et recherche** par mois, niveau, statut des résultats ou recherche textuelle
- **Suivi du statut de paiement** (en attente / payé)

### 2. Planification Mensuelle des Examens

- **Création de sessions d'examen mensuelles** avec limites de capacité personnalisables
- **Places de réserve d'urgence** (ex : 150 places régulières + 50 places de réserve)
- **Suivi de capacité** avec barres de progression visuelles
- **Débordement automatique** vers le mois suivant lorsque la capacité est atteinte
- **Alertes super-administrateur** lorsque la capacité principale est atteinte
- **Verrouillage des mois** pour empêcher toute modification ultérieure
- **Déverrouillage de la réserve** (super-administrateur uniquement) pour ajouts d'urgence

### 3. Distribution des Résultats

Trois catégories de résultats sont gérées :

- **Réussi (Passed)** : Examens écrit (Schriftlich) et oral (Mündlich) réussis
- **Échoué (Failed)** : Les deux examens échoués
- **Réussite partielle (Partial Pass)** : Un seul examen réussi (certificat délivré pour le module réussi)

Fonctionnalités associées :

- **Téléchargement de certificats** pour les candidats ayant réussi ou partiellement réussi
- **Envoi groupé d'emails** par catégorie avec pièces jointes PDF (certificats)
- **Suivi du statut d'envoi des emails** par candidat

### 4. Modèles d'Emails Personnalisables

- **Modèles HTML personnalisables** pour chaque catégorie de résultat
- **Support de variables dynamiques** pour contenu personnalisé :
  - Nom du candidat
  - Niveau d'examen
  - Mois d'examen
  - Résultats écrit et oral
  - Coordonnées de l'école
- **Prévisualisation** avant envoi
- **Réinitialisation aux valeurs par défaut**

### 5. Niveaux d'Examen Supportés

| Niveau | Description |
|--------|-------------|
| A1, A2 | Niveaux débutants |
| B1, B2 | Niveaux intermédiaires |
| C1, C2 | Niveaux avancés |

### 6. Sécurité et Traçabilité

- Authentification requise pour toutes les opérations
- Historique complet des modifications et transferts de candidats
- Stockage sécurisé des certificats
- Droits d'accès différenciés (administrateur / super-administrateur)

### 7. Support Multilingue

- Interface disponible en **allemand, anglais, français et arabe**
- Support RTL (droite à gauche) pour l'arabe

---

## Résumé

Cette fonctionnalité permet une gestion professionnelle et complète du processus d'inscription, de suivi et de distribution des résultats pour les examens de certification TELC en langue allemande, depuis l'inscription du candidat jusqu'à l'envoi automatisé des certificats par email.
