/**
 * Generate DOCX file with Nisrine School System Features in French
 * For contract purposes
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');

async function generateFeaturesDocx() {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                // Title
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "LISTE DES FONCTIONNALITÉS DU SYSTÈME NISRINE SCHOOL",
                            bold: true,
                            size: 32,
                            color: "1f2937"
                        })
                    ],
                    heading: HeadingLevel.TITLE,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),

                // Section 1
                createSectionHeading("1. AUTHENTIFICATION & SÉCURITÉ"),
                createBulletPoint("Authentification multi-rôles (Super Admin, Admin, Enseignant, Étudiant)"),
                createBulletPoint("Authentification par jetons JWT sécurisés"),
                createBulletPoint("Chiffrement des mots de passe avec bcrypt (10 rounds)"),
                createBulletPoint("Contrôle d'accès basé sur les rôles (RBAC)"),
                createBulletPoint("Gestion sécurisée des sessions"),
                createBulletPoint("Déconnexion automatique à l'expiration du jeton"),
                createBulletPoint("Protection contre les attaques XSS"),
                createBulletPoint("Configuration CORS sécurisée"),
                createBulletPoint("Validation des entrées côté client et serveur"),
                createBulletPoint("Connexions HTTPS chiffrées"),
                createSpacer(),

                // Section 2
                createSectionHeading("2. GESTION DES ÉTUDIANTS"),
                createBulletPoint("Inscription en ligne avec téléchargement de photo"),
                createBulletPoint("Génération automatique de PDF d'inscription"),
                createBulletPoint("Sélection de formations multiples"),
                createBulletPoint("Système d'affectation aux groupes"),
                createBulletPoint("Suivi du statut de paiement"),
                createBulletPoint("Gestion des cartes CIN (recto/verso) avec optimisation d'image"),
                createBulletPoint("Génération automatique d'email scolaire (@nisrineschool.com)"),
                createBulletPoint("Recherche avancée et filtres multiples"),
                createBulletPoint("Export CSV des données"),
                createBulletPoint("Opérations en masse sur les étudiants"),
                createBulletPoint("Notes et commentaires par étudiant"),
                createBulletPoint("Statuts d'étudiant : Actif, Inactif, Diplômé, Abandonné"),
                createSpacer(),

                // Section 3
                createSectionHeading("3. GESTION DES SAISONS & GROUPES"),
                createBulletPoint("Organisation par années académiques (saisons)"),
                createBulletPoint("Statuts de saison : Active, Archivée, À venir"),
                createBulletPoint("Isolation complète des données entre saisons"),
                createSubHeading("Groupes de Langues :"),
                createBulletPoint("Allemand (niveaux A1, A2, B1, B2)", true),
                createBulletPoint("Anglais", true),
                createBulletPoint("Français", true),
                createBulletPoint("Ausbildung (Allemand professionnel)", true),
                createSubHeading("Groupes de Filières :"),
                createBulletPoint("Informatique", true),
                createBulletPoint("Gériatrie", true),
                createBulletPoint("Aide soignant", true),
                createBulletPoint("Agent socio-éducatif", true),
                createBulletPoint("Assistante sociale", true),
                createBulletPoint("Restauration", true),
                createBulletPoint("Cuisine", true),
                createBulletPoint("Gestion hôtelière", true),
                createBulletPoint("Sous-groupes de filières pour cours spécialisés"),
                createBulletPoint("Gestion de la capacité maximale par groupe"),
                createBulletPoint("Support de double formation (langue + filière)"),
                createSpacer(),

                // Section 4
                createSectionHeading("4. SYSTÈME DE NOTES"),
                createBulletPoint("Système de niveaux européens A1-B2 pour les langues"),
                createSubHeading("Évaluation visuelle codée par couleur :"),
                createBulletPoint("Réussi (Vert) : 60-100 points", true),
                createBulletPoint("Moyen (Orange) : 40-59 points", true),
                createBulletPoint("Échoué (Rouge) : 0-39 points", true),
                createSubHeading("Quatre types d'examens par test :"),
                createBulletPoint("Lesen (Compréhension écrite)", true),
                createBulletPoint("Hören (Compréhension orale)", true),
                createBulletPoint("Schreiben (Expression écrite)", true),
                createBulletPoint("Sprechen (Expression orale)", true),
                createBulletPoint("Mini-Tests 1-4 + Examen Final"),
                createBulletPoint("Notation traditionnelle par lettres (A-F) pour les filières"),
                createBulletPoint("Commentaires auto-générés"),
                createBulletPoint("Analyses de performance"),
                createBulletPoint("Suivi par semestre et année académique"),
                createBulletPoint("Filtrage des notes par saison"),
                createSpacer(),

                // Section 5
                createSectionHeading("5. PORTAIL ENSEIGNANT"),
                createBulletPoint("Authentification sécurisée"),
                createBulletPoint("Affectation à plusieurs formations"),
                createBulletPoint("Système de saisie des notes"),
                createBulletPoint("Filtrage des étudiants par groupe et formation"),
                createBulletPoint("Modification/suppression des notes propres"),
                createBulletPoint("Génération de codes QR pour la présence"),
                createBulletPoint("Support multi-formations"),
                createBulletPoint("Statistiques et rapports"),
                createSpacer(),

                // Section 6
                createSectionHeading("6. PORTAIL ÉTUDIANT/PARENT"),
                createBulletPoint("Tableau de bord avec accès rapide"),
                createBulletPoint("Consultation des notes par formation"),
                createBulletPoint("Évaluations codées par couleur"),
                createBulletPoint("Suivi de progression"),
                createBulletPoint("Affichage du statut de paiement"),
                createBulletPoint("Consultation des messages"),
                createBulletPoint("Scan QR pour la présence"),
                createBulletPoint("Changement de thème"),
                createBulletPoint("Installation PWA (Progressive Web App)"),
                createSpacer(),

                // Section 7
                createSectionHeading("7. SYSTÈME DE PRÉSENCE"),
                createBulletPoint("Génération de codes QR par l'enseignant"),
                createBulletPoint("Codes à durée limitée (personnalisable)"),
                createBulletPoint("Suivi en temps réel"),
                createBulletPoint("Marquage automatique des absences"),
                createBulletPoint("Tableau de bord statistiques"),
                createBulletPoint("Export Excel des données de présence"),
                createBulletPoint("Filtrage par saison"),
                createBulletPoint("Rapports quotidiens, mensuels et par étudiant"),
                createBulletPoint("Saisie manuelle de présence (système de secours)"),
                createSpacer(),

                // Section 8
                createSectionHeading("8. GESTION DES PAIEMENTS"),
                createBulletPoint("Suivi des paiements par étudiant"),
                createBulletPoint("Rappels automatiques (exécution toutes les 60 minutes)"),
                createBulletPoint("Indicateurs visuels (En attente/En retard/Payé)"),
                createBulletPoint("Statistiques du tableau de bord"),
                createBulletPoint("Fonction \"Marquer comme payé\" en un clic"),
                createBulletPoint("Filtrage par saison active uniquement"),
                createBulletPoint("Historique des paiements"),
                createBulletPoint("Cycles de paiement mensuels"),
                createSpacer(),

                // Section 9
                createSectionHeading("9. MESSAGERIE & NOTIFICATIONS"),
                createBulletPoint("Notifications en temps réel via WebSocket (Socket.IO)"),
                createBulletPoint("Icône de cloche avec compteur de badges"),
                createBulletPoint("Alertes sonores avec option de mise en sourdine"),
                createBulletPoint("Messagerie privée aux étudiants"),
                createBulletPoint("Types de messages : Info, Rappel, Paiement, Annonce, Alerte"),
                createBulletPoint("Annonces à l'échelle de l'école"),
                createBulletPoint("Support multilingue complet"),
                createBulletPoint("Nettoyage automatique après 30 jours"),
                createBulletPoint("Notifications navigateur"),
                createSpacer(),

                // Section 10
                createSectionHeading("10. SYSTÈME DE CAISSE"),
                createBulletPoint("Suivi mensuel des revenus et dépenses"),
                createBulletPoint("Gestion des transactions (CRUD complet)"),
                createSubHeading("Catégories personnalisables :"),
                createBulletPoint("Revenus : Frais de scolarité, frais d'examen, vente de matériel, etc.", true),
                createBulletPoint("Dépenses : Salaires, loyer, services publics, matériel, etc.", true),
                createBulletPoint("Calculs automatiques"),
                createSubHeading("Visualisation des données :"),
                createBulletPoint("Graphique circulaire (distribution par catégories)", true),
                createBulletPoint("Graphique à barres (comparaison mensuelle)", true),
                createBulletPoint("Graphique linéaire (tendances dans le temps)", true),
                createBulletPoint("Vue d'ensemble annuelle"),
                createBulletPoint("Export PDF avec graphiques"),
                createBulletPoint("Notes administratives par transaction"),
                createBulletPoint("Détection des chevauchements de paiements"),
                createSpacer(),

                // Section 11
                createSectionHeading("11. GESTION DES RENDEZ-VOUS"),
                createBulletPoint("Saisie manuelle des rendez-vous clients"),
                createBulletPoint("Niveaux de priorité : Haute, Moyenne, Basse (codés par couleur)"),
                createBulletPoint("Suivi du statut : En attente, Terminé, Annulé"),
                createBulletPoint("Filtrage par date, statut, priorité"),
                createBulletPoint("Recherche par nom/téléphone"),
                createBulletPoint("Tableau de bord statistiques"),
                createBulletPoint("Export PDF des listes quotidiennes"),
                createBulletPoint("Support multilingue complet"),
                createSpacer(),

                // Section 12
                createSectionHeading("12. SYSTÈME D'ÉVALUATIONS & AVIS"),
                createBulletPoint("Système d'évaluation 5 étoiles"),
                createBulletPoint("Avis écrits des étudiants"),
                createBulletPoint("Modération par administrateur"),
                createBulletPoint("Affichage sur le site web public"),
                createBulletPoint("Pagination pour nombreux avis"),
                createBulletPoint("Statistiques et note moyenne"),
                createSpacer(),

                // Section 13
                createSectionHeading("13. SERVICES EXTERNES"),
                createSubHeading("Service CV (Lebenslauf)"),
                createBulletPoint("Demandes de création de CV", true),
                createBulletPoint("Téléchargement de documents", true),
                createBulletPoint("Suivi du statut de la demande", true),
                createBulletPoint("Activation/désactivation du service", true),
                createSubHeading("Service Candidature (Bewerbungsservice)"),
                createBulletPoint("Gestion des candidatures pour l'Allemagne", true),
                createBulletPoint("Types : Ausbildung (Apprentissage) et Arbeit (Travail)", true),
                createSubHeading("Catégories de métiers :"),
                createBulletPoint("Pflege (Soins/Infirmerie)", true),
                createBulletPoint("Verkäufer (Vente)", true),
                createBulletPoint("Gastronomie (Hôtellerie, Cuisine, Restauration)", true),
                createBulletPoint("Fleischer (Boucher)", true),
                createBulletPoint("Maurer (Maçon)", true),
                createBulletPoint("Autres", true),
                createSubHeading("Pipeline de statuts :"),
                createBulletPoint("En attente → Nouveau → Erstgespräch → Vorvertrag → Interview → Vertrag → Botschaft → Visum → Terminé", true),
                createBulletPoint("Suivi des diplômes"),
                createBulletPoint("Historique des changements de statut"),
                createBulletPoint("Téléchargement de documents sur MEGA.nz"),
                createSubHeading("Service Traduction"),
                createBulletPoint("Demandes de traduction de documents", true),
                createBulletPoint("Support multi-fichiers (jusqu'à 25 fichiers)", true),
                createBulletPoint("Langues source et cible", true),
                createBulletPoint("Niveaux d'urgence", true),
                createBulletPoint("Suivi du statut", true),
                createSpacer(),

                // Section 14
                createSectionHeading("14. OUTILS ADMINISTRATIFS"),
                createBulletPoint("Gestion des employés (admins)"),
                createBulletPoint("Système de points de crédit"),
                createBulletPoint("Classement des employés"),
                createBulletPoint("Journal d'activité"),
                createBulletPoint("Suivi des sessions de connexion"),
                createBulletPoint("Paramètres système"),
                createBulletPoint("Réinitialisation de mot de passe"),
                createBulletPoint("Historique des inscriptions"),
                createBulletPoint("Contrôle d'activation/désactivation des services"),
                createSpacer(),

                // Section 15
                createSectionHeading("15. SAUVEGARDE & RÉCUPÉRATION"),
                createBulletPoint("Sauvegarde complète par saison"),
                createBulletPoint("Intégration MEGA.nz pour stockage cloud"),
                createBulletPoint("Génération de fichiers Excel organisés"),
                createBulletPoint("Structure de dossiers par groupe et étudiant"),
                createBulletPoint("Extraction des photos et documents"),
                createBulletPoint("Progression en temps réel de la sauvegarde"),
                createBulletPoint("Téléchargement ZIP complet"),
                createSpacer(),

                // Section 16
                createSectionHeading("16. SITE WEB PUBLIC"),
                createBulletPoint("Page d'accueil avec vidéo de fond"),
                createSubHeading("Présentation des services :"),
                createBulletPoint("Cours de langue allemande (A1-C1)", true),
                createBulletPoint("Support visa étudiant", true),
                createBulletPoint("Intégration culturelle", true),
                createBulletPoint("Préparation aux soins infirmiers", true),
                createBulletPoint("Formation hôtelière", true),
                createBulletPoint("Services éducatifs", true),
                createBulletPoint("Section \"Qui sommes-nous\""),
                createBulletPoint("Galerie photos et vidéos de la vie étudiante"),
                createBulletPoint("Formulaire d'inscription en ligne"),
                createBulletPoint("Formulaire de contact"),
                createBulletPoint("Affichage des avis étudiants"),
                createBulletPoint("Accès aux portails (Étudiant/Enseignant)"),
                createSpacer(),

                // Section 17
                createSectionHeading("17. DESIGN & INTERFACE"),
                createBulletPoint("Design Glassmorphism moderne"),
                createBulletPoint("Thème accent doré"),
                createBulletPoint("Motifs Zelij marocains traditionnels"),
                createBulletPoint("Animations fluides"),
                createBulletPoint("États de chargement"),
                createBulletPoint("Dialogues modaux"),
                createBulletPoint("Mises en page par cartes"),
                createBulletPoint("Design responsive (mobile, tablette, desktop)"),
                createBulletPoint("Support RTL pour l'arabe"),
                createSpacer(),

                // Section 18
                createSectionHeading("18. SYSTÈME MULTILINGUE"),
                createSubHeading("4 langues supportées :"),
                createBulletPoint("Allemand (DE)", true),
                createBulletPoint("Anglais (EN)", true),
                createBulletPoint("Français (FR)", true),
                createBulletPoint("Arabe (AR) avec RTL", true),
                createBulletPoint("Changement de langue instantané sans rechargement"),
                createBulletPoint("Fichier JSON centralisé pour les traductions"),
                createBulletPoint("Couverture de traduction à 100%"),
                createSpacer(),

                // Section 19
                createSectionHeading("19. APPLICATION MOBILE (PWA)"),
                createBulletPoint("Progressive Web App installable"),
                createBulletPoint("Fonctionne sur tous les appareils (Android, iOS, Desktop)"),
                createBulletPoint("Capacités hors ligne"),
                createBulletPoint("Notifications push natives"),
                createBulletPoint("Interface optimisée pour mobile"),
                createBulletPoint("Scan QR intégré pour la présence"),
                createSpacer(),

                // Section 20
                createSectionHeading("20. PERFORMANCE & OPTIMISATION"),
                createBulletPoint("Pagination côté serveur (95% plus rapide)"),
                createBulletPoint("Optimisation d'images (60-80% réduction de taille)"),
                createBulletPoint("Chargement différé des photos"),
                createBulletPoint("Mise en cache pour requêtes fréquentes"),
                createBulletPoint("Temps de chargement de page < 2 secondes"),
                createBulletPoint("Réponses API < 500ms"),
                createBulletPoint("Support de 1000+ étudiants"),
                createBulletPoint("100+ utilisateurs simultanés"),
                createSpacer(),

                // Statistics
                createSectionHeading("STATISTIQUES DU SYSTÈME"),
                createBulletPoint("Fonctionnalités totales : 150+"),
                createBulletPoint("Rôles utilisateurs : 4"),
                createBulletPoint("Langues : 4"),
                createBulletPoint("Formations : 12 (4 langues + 8 filières)"),
                createSpacer(),

                // Footer
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Développé par Zigma Media 2025",
                            bold: true,
                            size: 22
                        })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 400 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: "Pour Nisrine School, Fès, Maroc",
                            size: 22
                        })
                    ],
                    alignment: AlignmentType.CENTER
                })
            ]
        }]
    });

    // Generate and save the document
    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(__dirname, '..', 'FONCTIONNALITES_NISRINE_CONTRAT.docx');
    fs.writeFileSync(outputPath, buffer);
    
    console.log('✅ Document DOCX créé avec succès!');
    console.log(`📄 Fichier: ${outputPath}`);
    
    return outputPath;
}

// Helper functions
function createSectionHeading(text) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 26,
                color: "1f2937"
            })
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 200 },
        border: {
            bottom: {
                color: "FFCC00",
                space: 1,
                size: 6,
                style: BorderStyle.SINGLE
            }
        }
    });
}

function createSubHeading(text) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                bold: true,
                size: 22,
                color: "374151"
            })
        ],
        spacing: { before: 150, after: 100 }
    });
}

function createBulletPoint(text, indented = false) {
    return new Paragraph({
        children: [
            new TextRun({
                text: (indented ? "    • " : "• ") + text,
                size: 22
            })
        ],
        spacing: { after: 80 },
        indent: indented ? { left: 720 } : undefined
    });
}

function createSpacer() {
    return new Paragraph({
        children: [],
        spacing: { after: 200 }
    });
}

// Run the generator
generateFeaturesDocx()
    .then(() => {
        console.log('🎉 Génération terminée!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Erreur:', err);
        process.exit(1);
    });
