import { useState, useEffect } from 'react';
import { teacherAPI } from '../../../services/api';
import { branchGradingConfig, isBranchFormation } from '../../../config/branchGradingConfig';
import { useLanguage } from '../../../context/LanguageContext';
import './SubjectLabelsEditor.css';

const SubjectLabelsEditor = ({ formation, customLabels, onLabelsUpdated }) => {
  const { t } = useLanguage();
  const [labels, setLabels] = useState({});
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  const isBranch = isBranchFormation(formation);
  const config = branchGradingConfig[formation];

  useEffect(() => {
    if (customLabels) {
      setLabels({ ...customLabels });
    }
  }, [customLabels]);

  if (!isBranch || !config) return null;

  const handleLabelChange = (key, value) => {
    setLabels(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const response = await teacherAPI.updateSubjectLabels(labels);
      const updatedLabels = response.data.customSubjectLabels || {};
      onLabelsUpdated(updatedLabels);
      setMessage(t('subjectNamesSaved'));
      setIsEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving subject labels:', error);
      setMessage(t('failedToSaveSubjectNames'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to defaults by clearing all custom labels for this formation's fields
    const resetLabels = { ...labels };
    config.fields.forEach(field => {
      delete resetLabels[field.key];
    });
    setLabels(resetLabels);
  };

  const handleCancel = () => {
    setLabels({ ...customLabels });
    setIsEditing(false);
    setMessage('');
  };

  return (
    <div className="subject-labels-editor">
      <div className="labels-header">
        <h4>
          <i className="fas fa-tags"></i>
          {t('subjectNames')}
        </h4>
        {!isEditing ? (
          <button className="btn-edit-labels" onClick={() => setIsEditing(true)}>
            <i className="fas fa-pen"></i> {t('customize')}
          </button>
        ) : (
          <div className="labels-actions">
            <button className="btn-reset-labels" onClick={handleReset} title="Reset to defaults">
              <i className="fas fa-undo"></i>
            </button>
            <button className="btn-cancel-labels" onClick={handleCancel}>
              {t('cancel')}
            </button>
            <button className="btn-save-labels" onClick={handleSave} disabled={saving}>
              {saving ? <><i className="fas fa-spinner fa-spin"></i> {t('saving')}</> : <><i className="fas fa-check"></i> {t('save')}</>}
            </button>
          </div>
        )}
      </div>

      {message && (
        <div className={`labels-message ${message === t('failedToSaveSubjectNames') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className={`labels-grid ${isEditing ? 'editing' : ''}`}>
        {config.fields.map(field => {
          const customLabel = labels[field.key];
          const displayLabel = customLabel || field.label;
          
          return (
            <div key={field.key} className="label-item">
              <div className="label-default">
                <span className="label-key-badge">{field.weight}%</span>
                <span className="label-default-name">{field.label}</span>
              </div>
              {isEditing ? (
                <input
                  type="text"
                  className="label-input"
                  value={customLabel || ''}
                  onChange={(e) => handleLabelChange(field.key, e.target.value)}
                  placeholder={field.label}
                />
              ) : (
                customLabel && customLabel !== field.label && (
                  <div className="label-custom">
                    <i className="fas fa-arrow-right"></i>
                    <span>{customLabel}</span>
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectLabelsEditor;
