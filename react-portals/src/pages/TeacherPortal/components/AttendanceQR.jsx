import { useState, useEffect } from 'react';
import { useTeacherAuth } from '../../../context/TeacherAuthContext';
import { useLanguage } from '../../../context/LanguageContext';
import { teacherAPI } from '../../../services/api';
import QRCode from 'qrcode';
import './AttendanceQR.css';

const AttendanceQR = () => {
  const { user } = useTeacherAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedFormation, setSelectedFormation] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [qrValidity, setQrValidity] = useState(30);
  const [lateThreshold, setLateThreshold] = useState(15);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [session, setSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (user?.formations?.length === 1) {
      setSelectedFormation(user.formations[0]);
    }
  }, [user]);

  useEffect(() => {
    if (selectedFormation) {
      fetchGroups();
    }
  }, [selectedFormation]);

  useEffect(() => {
    if (session) {
      const timer = setInterval(() => {
        const now = new Date();
        const expiresAt = new Date(session.qrExpiresAt);
        const diff = expiresAt - now;

        if (diff <= 0) {
          setTimeRemaining(t('expired'));
          clearInterval(timer);
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [session]);

  const fetchGroups = async () => {
    try {
      // For attendance, we just need all groups the teacher is assigned to
      const response = await teacherAPI.getGroups();
      const groupsData = Array.isArray(response.data) ? response.data : (response.data.groups || []);
      
      // The groups already have currentStudentCount from the backend
      // Just use that directly
      const groupsWithCount = groupsData.map(group => ({
        ...group,
        studentCount: group.currentStudentCount || 0
      }));
      
      setGroups(groupsWithCount);
    } catch (error) {
      console.error('Error fetching groups:', error);
      alert(t('failedToLoadGroups'));
    }
  };

  const generateQR = async () => {
    if (!selectedFormation || !selectedGroup || !classDate || !startTime || !endTime) {
      alert(t('fillAllFields'));
      return;
    }

    try {
      setLoading(true);

      const classStartTime = new Date(`${classDate}T${startTime}`);
      const classEndTime = new Date(`${classDate}T${endTime}`);

      const response = await fetch('/api/attendance/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        },
        body: JSON.stringify({
          groupId: selectedGroup,
          formation: selectedFormation,
          date: classDate,
          classStartTime: classStartTime.toISOString(),
          classEndTime: classEndTime.toISOString(),
          qrValidityMinutes: qrValidity,
          lateThresholdMinutes: lateThreshold
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate QR code');
      }

      const data = await response.json();
      setQrCodeData(data.qrCode);
      setSession(data.session);
      alert(t('qrGeneratedSuccess'));

    } catch (error) {
      console.error('Error generating QR:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrCodeData) return;

    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `attendance-qr-${session.groupName}-${new Date().toISOString()}.png`;
    link.click();
  };

  const cancelSession = async () => {
    if (!session) return;

    const confirmed = window.confirm(
      `\u26a0\ufe0f ${t('cancelSessionConfirm')}\n\n` +
      `${t('group')}: ${session.groupName}\n` +
      `${t('formation')}: ${session.formation}\n\n` +
      `${t('cancelSessionWarning')}`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/attendance/cancel/${session.sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('teacherToken')}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('failedToCancelSession'));
      }

      const data = await response.json();
      alert(`\u2705 ${t('sessionCancelledSuccess')}\n\n${data.deletedRecords} ${t('pendingRecordsDeleted')}`);
      
      // Clear the QR code display
      setQrCodeData(null);
      setSession(null);
      setTimeRemaining(null);

    } catch (error) {
      console.error('Error cancelling session:', error);
      alert(`\u274c ${t('error')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormationDisabled = user?.formations?.length === 1;

  return (
    <div className="attendance-qr">
      <div className="qr-generator-card">
        <h2>
          <i className="fas fa-qrcode"></i>
          {t('generateAttendanceQR')}
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label>
              <i className="fas fa-book"></i> {t('formation')}
            </label>
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              disabled={isFormationDisabled}
            >
              <option value="">{t('chooseFormation')}</option>
              {user?.formations?.map(formation => (
                <option key={formation} value={formation}>{formation}</option>
              ))}
            </select>
            {isFormationDisabled && (
              <small className="auto-assigned">({t('autoAssigned')})</small>
            )}
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-users"></i> {t('group')}
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!selectedFormation}
            >
              <option value="">{t('chooseGroup')}</option>
              {groups.map(group => (
                <option key={group._id} value={group._id}>
                  {group.name} ({group.studentCount || 0} {t('students')})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-calendar"></i> {t('date')}
            </label>
            <input
              type="date"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-clock"></i> {t('classStartTime')}
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-clock"></i> {t('classEndTime')}
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-hourglass-half"></i> {t('qrValidityMinutes')}
            </label>
            <input
              type="number"
              value={qrValidity}
              onChange={(e) => setQrValidity(parseInt(e.target.value))}
              min="5"
              max="120"
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-user-clock"></i> {t('lateThresholdMinutes')}
            </label>
            <input
              type="number"
              value={lateThreshold}
              onChange={(e) => setLateThreshold(parseInt(e.target.value))}
              min="0"
              max="60"
            />
          </div>
        </div>

        <button
          className="btn-generate"
          onClick={generateQR}
          disabled={loading || !selectedFormation || !selectedGroup}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> {t('generating')}
            </>
          ) : (
            <>
              <i className="fas fa-qrcode"></i> {t('generateQRCode')}
            </>
          )}
        </button>
      </div>

      {qrCodeData && session && (
        <div className="qr-display-card">
          <h2>
            <i className="fas fa-qrcode"></i>
            {t('scanThisQRCode')}
          </h2>

          <div className="qr-info">
            <div className="info-item">
              <i className="fas fa-users"></i>
              <span>{session.groupName}</span>
            </div>
            <div className="info-item">
              <i className="fas fa-book"></i>
              <span>{session.formation}</span>
            </div>
            <div className="info-item">
              <i className="fas fa-calendar"></i>
              <span>{new Date(session.date).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <i className="fas fa-clock"></i>
              <span>{new Date(session.classStartTime).toLocaleTimeString()} - {new Date(session.classEndTime).toLocaleTimeString()}</span>
            </div>
            <div className="info-item">
              <i className="fas fa-user-graduate"></i>
              <span>{session.totalStudents} {t('students')}</span>
            </div>
          </div>

          <div className="qr-code-container">
            <img src={qrCodeData} alt="Attendance QR Code" />
            <div className={`qr-timer ${timeRemaining === t('expired') || (timeRemaining && timeRemaining.startsWith('0:')) ? 'expiring' : ''}`}>
              <i className="fas fa-hourglass-half"></i>
              <span>{t('expiresIn')}: {timeRemaining || '--:--'}</span>
            </div>
          </div>

          {/* Session ID Display */}
          <div className="session-id-card">
            <div className="session-id-header">
              <i className="fas fa-key"></i>
              <span>{t('manualEntryCode')}</span>
            </div>
            <div className="session-id-display">
              <code>{session.sessionId}</code>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(session.sessionId);
                  alert(t('sessionIdCopied'));
                }}
                title={t('copySessionId')}
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
            <p className="session-id-note">
              <i className="fas fa-info-circle"></i>
              {t('manualEntryNote')}
            </p>
          </div>

          <div className="qr-actions">
            <button className="btn-download" onClick={downloadQR}>
              <i className="fas fa-download"></i> {t('downloadQR')}
            </button>
            <button 
              className="btn-cancel" 
              onClick={cancelSession}
              disabled={loading}
              title={t('cancelSessionTitle')}
            >
              <i className="fas fa-times-circle"></i> {t('cancelSession')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceQR;
