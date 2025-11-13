const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ManagedStudent',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    studentEmail: {
        type: String,
        required: true
    },
    formation: {
        type: String,
        required: true,
        enum: [
            'Allemand', 'Anglais', 'Français', 'Ausbildung',
            'Gériatrie', 'Aide soignant', 'Agent socio éducatif', 
            'Assistante sociale', 'Restauration', 'Cuisine', 
            'Informatique', 'Gestion hôtelière'
        ]
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    groupName: {
        type: String,
        required: true
    },
    // For language formations (Allemand, Anglais, Français, Ausbildung) and branch modules
    examType: {
        type: String,
        enum: [
            // Language exam types
            'Lesen', 'Hören', 'Schreiben', 'Sprechen',
            // Branch module types
            'connaissancesTechniques', 'projetPratique', 'resolutionProblemes', 'documentationRapport', 'participationRegularite',
            'hygieneSecurite', 'communicationPatients', 'techniquesSoins', 'stagePratique', 'comportementAssiduite',
            'maitriseGestes', 'respectProtocoles', 'relationPatient', 'rapportDossier', 'participationPonctualite',
            'connaissanceBesoins', 'communicationInteraction', 'organisationActivites', 'dossierProjet', 'presenceComportement',
            'analyseCas', 'communicationEcoute', 'rapportTerrain', 'implicationPro', 'ethiqueRespect',
            'techniquesCulinaires', 'hygieneAlimentaire', 'travailEquipe', 'creativitePresentation', 'disciplinePonctualite'
        ]
    },
    score: {
        type: Number,
        min: 0,
        max: 100
    },
    maxScore: {
        type: Number,
        default: 100
    },
    // For branch formations - specific grading fields (out of 20)
    branchGrades: {
        // Gériatrie
        hygieneSecurite: { type: Number, min: 0, max: 20 },
        communicationPatients: { type: Number, min: 0, max: 20 },
        techniquesSoins: { type: Number, min: 0, max: 20 },
        stagePratique: { type: Number, min: 0, max: 20 },
        comportementAssiduite: { type: Number, min: 0, max: 20 },
        
        // Aide soignant
        maitriseGestes: { type: Number, min: 0, max: 20 },
        respectProtocoles: { type: Number, min: 0, max: 20 },
        relationPatient: { type: Number, min: 0, max: 20 },
        rapportDossier: { type: Number, min: 0, max: 20 },
        participationPonctualite: { type: Number, min: 0, max: 20 },
        
        // Agent socio éducatif
        connaissanceBesoins: { type: Number, min: 0, max: 20 },
        communicationInteraction: { type: Number, min: 0, max: 20 },
        organisationActivites: { type: Number, min: 0, max: 20 },
        dossierProjet: { type: Number, min: 0, max: 20 },
        presenceComportement: { type: Number, min: 0, max: 20 },
        
        // Assistante sociale
        analyseCas: { type: Number, min: 0, max: 20 },
        communicationEcoute: { type: Number, min: 0, max: 20 },
        rapportTerrain: { type: Number, min: 0, max: 20 },
        implicationPro: { type: Number, min: 0, max: 20 },
        ethiqueRespect: { type: Number, min: 0, max: 20 },
        
        // Restauration / Cuisine
        techniquesCulinaires: { type: Number, min: 0, max: 20 },
        hygieneAlimentaire: { type: Number, min: 0, max: 20 },
        travailEquipe: { type: Number, min: 0, max: 20 },
        creativitePresentation: { type: Number, min: 0, max: 20 },
        disciplinePonctualite: { type: Number, min: 0, max: 20 },
        
        // Informatique
        connaissancesTechniques: { type: Number, min: 0, max: 20 },
        projetPratique: { type: Number, min: 0, max: 20 },
        resolutionProblemes: { type: Number, min: 0, max: 20 },
        documentationRapport: { type: Number, min: 0, max: 20 },
        participationRegularite: { type: Number, min: 0, max: 20 }
    },
    // NEW: A1-B2 Level System (for language formations only)
    languageLevel: {
        type: String,
        enum: ['A1', 'A2', 'B1', 'B2'],
        required: function() {
            return ['Allemand', 'Anglais', 'Français', 'Ausbildung'].includes(this.formation);
        }
    },
    testType: {
        type: String,
        enum: ['miniTest', 'finalExam'],
        required: function() {
            return ['Allemand', 'Anglais', 'Français', 'Ausbildung'].includes(this.formation);
        }
    },
    testNumber: {
        type: Number,
        enum: [1, 2, 3, 4],
        required: function() {
            return this.testType === 'miniTest';
        }
    },
    
    examDate: {
        type: Date,
        required: true
    },
    
    // Legacy fields - kept for backward compatibility and branch formations
    semester: {
        type: String,
        enum: ['Semester 1', 'Semester 2'],
        required: function() {
            return !['Allemand', 'Anglais', 'Français', 'Ausbildung'].includes(this.formation);
        }
    },
    examNumber: {
        type: Number,
        enum: [1, 2, 3, 4, 5],
        required: function() {
            return !['Allemand', 'Anglais', 'Français', 'Ausbildung'].includes(this.formation);
        },
        default: 1
    },
    academicYear: {
        type: String,
        required: true,
        default: function() {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            // Academic year starts in September (month 8)
            if (month >= 8) {
                return `${year}-${year + 1}`;
            } else {
                return `${year - 1}-${year}`;
            }
        }
    },
    comments: {
        type: String,
        trim: true,
        default: ''
    },
    
    // NEW: Visual Evaluation System
    evaluationStatus: {
        type: String,
        enum: ['approved', 'mid', 'failed'],
        required: true,
        default: function() {
            const percentage = (this.score / this.maxScore) * 100;
            if (percentage >= 70) return 'approved';
            if (percentage >= 50) return 'mid';
            return 'failed';
        }
    },
    autoComment: {
        type: String,
        trim: true,
        default: ''
    },
    performanceData: {
        type: Map,
        of: Number,
        default: {}
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    uploadedByName: {
        type: String,
        required: true
    },
    uploadedByEmail: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp and auto-generate evaluation before saving
gradeSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Auto-calculate evaluation status
    if (this.score !== undefined && this.maxScore) {
        const percentage = (this.score / this.maxScore) * 100;
        if (percentage >= 70) {
            this.evaluationStatus = 'approved';
        } else if (percentage >= 50) {
            this.evaluationStatus = 'mid';
        } else {
            this.evaluationStatus = 'failed';
        }
        
        // Auto-generate comment if not provided
        if (!this.autoComment) {
            this.autoComment = this.generateAutoComment(percentage);
        }
    }
    
    next();
});

// Index for faster queries
gradeSchema.index({ student: 1, formation: 1, examType: 1, semester: 1, examNumber: 1, academicYear: 1 });
gradeSchema.index({ student: 1, formation: 1, languageLevel: 1, testType: 1 }); // NEW: A1-B2 index
gradeSchema.index({ group: 1, formation: 1 });
gradeSchema.index({ uploadedBy: 1 });
gradeSchema.index({ evaluationStatus: 1 }); // NEW: Evaluation index

// Virtual to calculate percentage
gradeSchema.virtual('percentage').get(function() {
    return ((this.score / this.maxScore) * 100).toFixed(2);
});

// Virtual to get grade letter (legacy)
gradeSchema.virtual('gradeLetter').get(function() {
    const percentage = (this.score / this.maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
});

// Method to generate auto comment based on score
gradeSchema.methods.generateAutoComment = function(percentage) {
    const isLanguage = ['Allemand', 'Anglais', 'Français', 'Ausbildung'].includes(this.formation);
    
    if (percentage >= 90) {
        return isLanguage 
            ? `Excellent performance in ${this.formation}! Outstanding ${this.examType || 'exam'} results.`
            : `Excellent work! All competencies mastered.`;
    } else if (percentage >= 70) {
        return isLanguage
            ? `Good performance in ${this.formation}. ${this.examType || 'Exam'} passed successfully.`
            : `Good work. Competencies achieved.`;
    } else if (percentage >= 50) {
        return isLanguage
            ? `Average performance in ${this.formation}. ${this.examType || 'Exam'} needs improvement.`
            : `Satisfactory. Some competencies need reinforcement.`;
    } else {
        return isLanguage
            ? `Below expectations in ${this.formation}. Additional practice required for ${this.examType || 'exam'}.`
            : `Needs significant improvement. Additional support recommended.`;
    }
};

// Static method to get student progress by level (A1-B2)
gradeSchema.statics.getLanguageProgress = async function(studentId, formation) {
    const levels = ['A1', 'A2', 'B1', 'B2'];
    const progress = {};
    
    for (const level of levels) {
        const miniTests = await this.find({
            student: studentId,
            formation,
            languageLevel: level,
            testType: 'miniTest'
        }).sort({ testNumber: 1 });
        
        const finalExam = await this.findOne({
            student: studentId,
            formation,
            languageLevel: level,
            testType: 'finalExam'
        });
        
        progress[level] = {
            miniTests: miniTests.length,
            miniTestsCompleted: miniTests.filter(t => t.evaluationStatus === 'approved').length,
            finalExam: finalExam ? {
                completed: true,
                status: finalExam.evaluationStatus,
                score: finalExam.score
            } : { completed: false },
            totalTests: miniTests.length + (finalExam ? 1 : 0),
            maxTests: 5 // 4 mini + 1 final
        };
    }
    
    return progress;
};

// Static method to get performance data for charts
gradeSchema.statics.getPerformanceData = async function(studentId, formation) {
    const grades = await this.find({
        student: studentId,
        formation
    }).sort({ createdAt: 1 });
    
    const data = {
        labels: [],
        scores: [],
        evaluations: {
            approved: 0,
            mid: 0,
            failed: 0
        }
    };
    
    grades.forEach(grade => {
        const label = grade.languageLevel 
            ? `${grade.languageLevel} ${grade.testType === 'miniTest' ? 'T' + grade.testNumber : 'Final'}`
            : `S${grade.semester?.slice(-1)} E${grade.examNumber}`;
        
        data.labels.push(label);
        data.scores.push(grade.score);
        data.evaluations[grade.evaluationStatus]++;
    });
    
    return data;
};

module.exports = mongoose.model('Grade', gradeSchema);
