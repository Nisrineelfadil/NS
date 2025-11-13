// Branch-specific grading configurations
// Each branch has specific grading fields with their weights and labels

export const branchGradingConfig = {
    'Gériatrie': {
        icon: 'fa-user-nurse',
        color: '#9b59b6',
        fields: [
            { key: 'hygieneSecurite', label: 'Hygiene et sécurité', weight: 20, maxScore: 20 },
            { key: 'communicationPatients', label: 'Communication avec les patients', weight: 20, maxScore: 20 },
            { key: 'techniquesSoins', label: 'Techniques de soins', weight: 30, maxScore: 20 },
            { key: 'stagePratique', label: 'Stage pratique / application', weight: 20, maxScore: 20 },
            { key: 'comportementAssiduite', label: 'Comportement & assiduité', weight: 10, maxScore: 20 }
        ]
    },
    'Aide soignant': {
        icon: 'fa-hand-holding-medical',
        color: '#3498db',
        fields: [
            { key: 'maitriseGestes', label: 'Maîtrise des gestes techniques', weight: 30, maxScore: 20 },
            { key: 'respectProtocoles', label: 'Respect des protocoles d\'hygiène', weight: 25, maxScore: 20 },
            { key: 'relationPatient', label: 'Relation patient / écoute', weight: 20, maxScore: 20 },
            { key: 'rapportDossier', label: 'Rapport ou dossier pratique', weight: 15, maxScore: 20 },
            { key: 'participationPonctualite', label: 'Participation et ponctualité', weight: 10, maxScore: 20 }
        ]
    },
    'Agent socio éducatif': {
        icon: 'fa-users',
        color: '#e67e22',
        fields: [
            { key: 'connaissanceBesoins', label: 'Connaissance des besoins sociaux', weight: 25, maxScore: 20 },
            { key: 'communicationInteraction', label: 'Communication & interaction', weight: 25, maxScore: 20 },
            { key: 'organisationActivites', label: 'Organisation d\'activités éducatives', weight: 20, maxScore: 20 },
            { key: 'dossierProjet', label: 'Dossier / projet de terrain', weight: 20, maxScore: 20 },
            { key: 'presenceComportement', label: 'Présence & comportement', weight: 10, maxScore: 20 }
        ]
    },
    'Assistante sociale': {
        icon: 'fa-hands-helping',
        color: '#1abc9c',
        fields: [
            { key: 'analyseCas', label: 'Analyse de cas sociaux', weight: 30, maxScore: 20 },
            { key: 'communicationEcoute', label: 'Communication & écoute active', weight: 25, maxScore: 20 },
            { key: 'rapportTerrain', label: 'Rapport de terrain', weight: 20, maxScore: 20 },
            { key: 'implicationPro', label: 'Implication & professionnalisme', weight: 15, maxScore: 20 },
            { key: 'ethiqueRespect', label: 'Éthique & respect', weight: 10, maxScore: 20 }
        ]
    },
    'Restauration': {
        icon: 'fa-utensils',
        color: '#e74c3c',
        fields: [
            { key: 'techniquesCulinaires', label: 'Techniques culinaires / service', weight: 30, maxScore: 20 },
            { key: 'hygieneAlimentaire', label: 'Hygiène & sécurité alimentaire', weight: 25, maxScore: 20 },
            { key: 'travailEquipe', label: 'Travail d\'équipe', weight: 20, maxScore: 20 },
            { key: 'creativitePresentation', label: 'Créativité & présentation', weight: 15, maxScore: 20 },
            { key: 'disciplinePonctualite', label: 'Discipline & ponctualité', weight: 10, maxScore: 20 }
        ]
    },
    'Cuisine': {
        icon: 'fa-utensils',
        color: '#e74c3c',
        fields: [
            { key: 'techniquesCulinaires', label: 'Techniques culinaires / service', weight: 30, maxScore: 20 },
            { key: 'hygieneAlimentaire', label: 'Hygiène & sécurité alimentaire', weight: 25, maxScore: 20 },
            { key: 'travailEquipe', label: 'Travail d\'équipe', weight: 20, maxScore: 20 },
            { key: 'creativitePresentation', label: 'Créativité & présentation', weight: 15, maxScore: 20 },
            { key: 'disciplinePonctualite', label: 'Discipline & ponctualité', weight: 10, maxScore: 20 }
        ]
    },
    'Informatique': {
        icon: 'fa-laptop-code',
        color: '#34495e',
        fields: [
            { key: 'connaissancesTechniques', label: 'Connaissances techniques / théorie', weight: 20, maxScore: 20 },
            { key: 'projetPratique', label: 'Projet pratique / codage', weight: 35, maxScore: 20 },
            { key: 'resolutionProblemes', label: 'Résolution de problèmes', weight: 20, maxScore: 20 },
            { key: 'documentationRapport', label: 'Documentation & rapport', weight: 15, maxScore: 20 },
            { key: 'participationRegularite', label: 'Participation & régularité', weight: 10, maxScore: 20 }
        ]
    },
    'Gestion hôtelière': {
        icon: 'fa-hotel',
        color: '#16a085',
        fields: [
            { key: 'techniquesCulinaires', label: 'Techniques de gestion', weight: 30, maxScore: 20 },
            { key: 'hygieneAlimentaire', label: 'Standards de qualité', weight: 25, maxScore: 20 },
            { key: 'travailEquipe', label: 'Leadership & équipe', weight: 20, maxScore: 20 },
            { key: 'creativitePresentation', label: 'Service client', weight: 15, maxScore: 20 },
            { key: 'disciplinePonctualite', label: 'Professionnalisme', weight: 10, maxScore: 20 }
        ]
    }
};

export const languageFormations = ['Allemand', 'Anglais', 'Français', 'Ausbildung'];

export const branchFormations = [
    'Gériatrie', 'Aide soignant', 'Agent socio éducatif', 
    'Assistante sociale', 'Restauration', 'Cuisine', 
    'Informatique', 'Gestion hôtelière'
];

export const isBranchFormation = (formation) => {
    return branchFormations.includes(formation);
};

export default branchGradingConfig;
