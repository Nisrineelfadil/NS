/**
 * Determines if a formation is a branch (vs language)
 */
export const isBranchFormation = (formation) => {
  const branchFormations = [
    'Gériatrie',
    'Aide soignant',
    'Agent socio éducatif',
    'Assistante sociale',
    'Restauration',
    'Cuisine',
    'Informatique',
    'Gestion hôtelière'
  ];
  return branchFormations.includes(formation);
};

/**
 * Returns the number of exams for a given formation
 * Languages: 4 exams
 * Branches: 5 exams
 */
export const getExamCount = (formation) => {
  return isBranchFormation(formation) ? 5 : 4;
};

/**
 * Validates if an exam number is valid for a formation
 */
export const isValidExamNumber = (examNumber, formation) => {
  const maxExams = getExamCount(formation);
  return examNumber >= 1 && examNumber <= maxExams;
};
