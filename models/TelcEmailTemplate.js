const mongoose = require('mongoose');

const telcEmailTemplateSchema = new mongoose.Schema({
    // Template type
    category: {
        type: String,
        required: true,
        enum: ['passed', 'failed', 'partial'],
        unique: true
    },

    // Email subject
    subject: {
        type: String,
        required: true,
        trim: true
    },

    // Email body (HTML supported)
    body: {
        type: String,
        required: true
    },

    // Available placeholders for reference
    // {{candidateName}} - Full name of candidate
    // {{examLevel}} - A1, A2, B1, B2, C1, C2
    // {{examMonth}} - e.g., "January 2025"
    // {{schriftlichResult}} - Passed/Failed (for partial)
    // {{muendlichResult}} - Passed/Failed (for partial)
    // {{schoolName}} - Nisrine School
    // {{schoolPhone}} - Contact phone
    // {{schoolEmail}} - Contact email

    // Is active
    isActive: {
        type: Boolean,
        default: true
    },

    // Admin tracking
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    lastModifiedByName: {
        type: String
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

// Update timestamp on save
telcEmailTemplateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to get template by category
telcEmailTemplateSchema.statics.getTemplate = async function(category) {
    let template = await this.findOne({ category, isActive: true });
    
    // If no template exists, create default
    if (!template) {
        template = await this.createDefaultTemplate(category);
    }
    
    return template;
};

// Static method to create default templates
telcEmailTemplateSchema.statics.createDefaultTemplate = async function(category) {
    const defaults = {
        passed: {
            subject: 'Herzlichen Glückwunsch! Sie haben die TELC {{examLevel}} Prüfung bestanden',
            body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #28a745;">Herzlichen Glückwunsch, {{candidateName}}!</h2>
    
    <p>Wir freuen uns, Ihnen mitteilen zu können, dass Sie die <strong>TELC {{examLevel}}</strong> Prüfung im <strong>{{examMonth}}</strong> erfolgreich bestanden haben!</p>
    
    <p>Ihr Zertifikat finden Sie im Anhang dieser E-Mail.</p>
    
    <p>Wir gratulieren Ihnen zu diesem großartigen Erfolg und wünschen Ihnen alles Gute für Ihre Zukunft!</p>
    
    <hr style="border: 1px solid #eee; margin: 20px 0;">
    
    <p style="color: #666;">
        Mit freundlichen Grüßen,<br>
        <strong>{{schoolName}}</strong><br>
        Tel: {{schoolPhone}}<br>
        Email: {{schoolEmail}}
    </p>
</div>
            `.trim()
        },
        failed: {
            subject: 'TELC {{examLevel}} Prüfungsergebnis - {{examMonth}}',
            body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #dc3545;">Liebe/r {{candidateName}},</h2>
    
    <p>Leider müssen wir Ihnen mitteilen, dass Sie die <strong>TELC {{examLevel}}</strong> Prüfung im <strong>{{examMonth}}</strong> nicht bestanden haben.</p>
    
    <p>Wir möchten Sie ermutigen, nicht aufzugeben! Mit weiterer Vorbereitung können Sie die Prüfung beim nächsten Mal bestehen.</p>
    
    <p>Bitte kontaktieren Sie uns, wenn Sie sich für den nächsten Prüfungstermin anmelden möchten oder wenn Sie Fragen haben.</p>
    
    <hr style="border: 1px solid #eee; margin: 20px 0;">
    
    <p style="color: #666;">
        Mit freundlichen Grüßen,<br>
        <strong>{{schoolName}}</strong><br>
        Tel: {{schoolPhone}}<br>
        Email: {{schoolEmail}}
    </p>
</div>
            `.trim()
        },
        partial: {
            subject: 'TELC {{examLevel}} Prüfungsergebnis - Teilerfolg - {{examMonth}}',
            body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #ffc107;">Liebe/r {{candidateName}},</h2>
    
    <p>Wir möchten Ihnen Ihre Ergebnisse der <strong>TELC {{examLevel}}</strong> Prüfung im <strong>{{examMonth}}</strong> mitteilen:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Schriftlich</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: {{schriftlichResult === 'Bestanden' ? '#28a745' : '#dc3545'}};">{{schriftlichResult}}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border: 1px solid #ddd;"><strong>Mündlich</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; color: {{muendlichResult === 'Bestanden' ? '#28a745' : '#dc3545'}};">{{muendlichResult}}</td>
        </tr>
    </table>
    
    <p>Ihr Teilzertifikat für die bestandenen Module finden Sie im Anhang dieser E-Mail.</p>
    
    <p>Sie können die nicht bestandenen Module bei einem zukünftigen Prüfungstermin wiederholen. Bitte kontaktieren Sie uns für weitere Informationen.</p>
    
    <hr style="border: 1px solid #eee; margin: 20px 0;">
    
    <p style="color: #666;">
        Mit freundlichen Grüßen,<br>
        <strong>{{schoolName}}</strong><br>
        Tel: {{schoolPhone}}<br>
        Email: {{schoolEmail}}
    </p>
</div>
            `.trim()
        }
    };

    const defaultTemplate = defaults[category];
    if (!defaultTemplate) {
        throw new Error(`Unknown template category: ${category}`);
    }

    return await this.create({
        category,
        subject: defaultTemplate.subject,
        body: defaultTemplate.body
    });
};

// Static method to initialize all default templates
telcEmailTemplateSchema.statics.initializeDefaults = async function() {
    const categories = ['passed', 'failed', 'partial'];
    
    for (const category of categories) {
        const exists = await this.findOne({ category });
        if (!exists) {
            await this.createDefaultTemplate(category);
        }
    }
};

// Method to render template with data
telcEmailTemplateSchema.methods.render = function(data) {
    let subject = this.subject;
    let body = this.body;
    
    const placeholders = {
        '{{candidateName}}': data.candidateName || '',
        '{{examLevel}}': data.examLevel || '',
        '{{examMonth}}': data.examMonth || '',
        '{{schriftlichResult}}': data.schriftlichResult || '',
        '{{muendlichResult}}': data.muendlichResult || '',
        '{{schoolName}}': data.schoolName || 'Nisrine School',
        '{{schoolPhone}}': data.schoolPhone || '+212 6XX XXX XXX',
        '{{schoolEmail}}': data.schoolEmail || 'contact@nisrineschool.com'
    };
    
    for (const [placeholder, value] of Object.entries(placeholders)) {
        subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        body = body.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    }
    
    return { subject, body };
};

module.exports = mongoose.model('TelcEmailTemplate', telcEmailTemplateSchema);
