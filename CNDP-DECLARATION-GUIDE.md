# 🇲🇦 Guide de Déclaration CNDP — Nisrine School

## 📋 Résumé
La **CNDP (Commission Nationale de contrôle de la protection des Données à caractère Personnel)** au Maroc exige que toute organisation collectant des données personnelles sensibles (notamment le **CIN - Carte d'Identité Nationale**) déclare ce traitement.

---

## ⚖️ Base Légale
- **Loi 09-08** relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel
- **Article 3** : Obligation de déclaration avant tout traitement de données personnelles
- **Données sensibles traitées par Nisrine School :**
  - Numéro de CIN (carte d'identité nationale)
  - Photos d'identité des étudiants
  - Données de santé (si applicable pour certaines formations professionnelles)
  - Coordonnées des mineurs (étudiants < 18 ans)

---

## 📝 Étapes de Déclaration

### 1. Créer un compte sur le portail CNDP
- **URL :** https://www.cndp.ma/
- **Section :** "Espace Déclarant" → "Créer un compte"
- **Informations requises :**
  - Raison sociale : **Nisrine School** (ou nom juridique officiel)
  - Adresse : Fez, Morocco
  - Responsable du traitement : [Nom du directeur/gérant]
  - Email de contact : nisrineschool2024@gmail.com
  - Téléphone : +212 664 648 455

### 2. Remplir le formulaire de déclaration
**Type de déclaration :** Déclaration de traitement de données à caractère personnel

**Finalités du traitement :**
- Gestion des inscriptions et dossiers étudiants
- Gestion pédagogique (notes, présences, diplômes)
- Communication avec les parents/tuteurs légaux
- Émission de certificats et attestations
- Gestion financière (paiements, rappels)

**Catégories de données collectées :**
- **Identification :** Nom, prénom, date de naissance, CIN, photo d'identité
- **Coordonnées :** Adresse, téléphone, email
- **Données familiales :** Nom/CIN des parents (si étudiant mineur)
- **Données pédagogiques :** Niveau d'études, formations suivies, notes, présences
- **Données financières :** Montants payés, historique de paiements

**Catégories de personnes concernées :**
- Étudiants (majeurs et mineurs)
- Parents/tuteurs légaux
- Professeurs (si traités séparément)

**Destinataires des données :**
- Personnel administratif de Nisrine School
- Professeurs (pour les données pédagogiques uniquement)
- Organismes certificateurs (Goethe Institut, etc.) si nécessaire

**Durée de conservation :**
- **Étudiants actifs :** Pendant toute la durée de la formation + 1 an
- **Étudiants inactifs :** 5 ans après la dernière inscription (pour archivage légal)
- **Données financières :** 10 ans (obligation comptable marocaine)

**Mesures de sécurité :**
- Hébergement sécurisé (MongoDB Atlas avec chiffrement au repos)
- Authentification JWT pour accès admin
- 2FA (authentification à deux facteurs) pour les comptes admin
- Backup automatique quotidien
- HTTPS obligatoire (certificat SSL)
- reCAPTCHA v3 sur tous les formulaires publics

**Transfert de données hors Maroc :**
- **Oui** — Données hébergées sur **MongoDB Atlas (USA)** et **Vercel (USA)**
- **Base légale :** Clauses contractuelles types (MongoDB et Vercel sont conformes RGPD/SOC2)
- **Mention obligatoire dans la déclaration**

### 3. Joindre les documents requis
- **Statuts de l'entreprise** (ou équivalent pour l'école)
- **Registre de commerce** (si applicable)
- **Modèle de formulaire de collecte** (copie du formulaire d'inscription `register.html`)
- **Politique de confidentialité** (fichier `privacy-policy.html`)

### 4. Payer les frais de déclaration
- **Montant :** ~500 MAD (vérifier le tarif actuel sur le site CNDP)
- **Modes de paiement :** Virement bancaire, chèque, ou paiement en ligne

### 5. Recevoir le récépissé de déclaration
- **Délai :** 1-3 mois après dépôt du dossier
- **Récépissé :** Numéro de déclaration officiel CNDP
- **Obligation :** Afficher ce numéro dans la Politique de Confidentialité du site

---

## 📌 Actions Post-Déclaration

### 1. Ajouter le numéro CNDP à la Privacy Policy
Une fois le récépissé obtenu, ajouter cette section dans `privacy-policy.html` :

```html
<h2>Déclaration CNDP</h2>
<p>
  Conformément à la loi marocaine 09-08, le traitement des données personnelles de Nisrine School 
  a été déclaré auprès de la Commission Nationale de contrôle de la protection des Données à caractère Personnel (CNDP).
</p>
<p><strong>Numéro de déclaration CNDP :</strong> [Numéro obtenu]</p>
<p>
  Pour toute question relative à la protection de vos données personnelles, vous pouvez contacter la CNDP : 
  <a href="https://www.cndp.ma">www.cndp.ma</a>
</p>
```

### 2. Mettre à jour le formulaire d'inscription
Ajouter une mention légale obligatoire :
```html
<p style="font-size:11px;color:#666;margin-top:10px">
  Les données collectées sont traitées conformément à la loi 09-08 et à notre 
  <a href="/privacy-policy.html">Politique de Confidentialité</a>. 
  Déclaration CNDP n° [Numéro].
</p>
```

### 3. Tenir un registre des traitements (obligation CNDP)
Créer un document interne listant :
- Tous les traitements de données effectués
- Finalités de chaque traitement
- Catégories de données traitées
- Durées de conservation
- Mesures de sécurité appliquées

---

## ⚠️ Sanctions en Cas de Non-Déclaration
- **Amende administrative :** 20 000 à 100 000 MAD
- **Peine d'emprisonnement :** Possible en cas de manquement grave
- **Fermeture temporaire :** La CNDP peut ordonner la suspension du traitement

---

## 📞 Contact CNDP
- **Site web :** https://www.cndp.ma
- **Email :** contact@cndp.ma
- **Téléphone :** +212 537 57 74 00
- **Adresse :** Avenue Annakhil, Hay Riad, Rabat

---

## ✅ Checklist
- [ ] Créer un compte sur le portail CNDP
- [ ] Remplir le formulaire de déclaration en ligne
- [ ] Joindre les documents requis (statuts, formulaire inscription, privacy policy)
- [ ] Payer les frais de déclaration
- [ ] Attendre le récépissé (1-3 mois)
- [ ] Ajouter le numéro CNDP à la Privacy Policy
- [ ] Ajouter la mention légale au formulaire d'inscription
- [ ] Créer un registre des traitements interne

---

**Date de création :** 20 Mai 2026  
**Responsable :** Nisrine El fadil
**Statut :** 🔴 À compléter — Déclaration non encore effectuée
