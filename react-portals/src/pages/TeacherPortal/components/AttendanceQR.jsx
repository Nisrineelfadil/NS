import { useState, useEffect } from 'react';
import { useTeacherAuth } from '../../../context/TeacherAuthContext';
import { teacherAPI } from '../../../services/api';
import QRCode from 'qrcode';
import './AttendanceQR.css';

const AttendanceQR = () => {
  const { user } = useTeacherAuth();
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
          setTimeRemaining('Expired');
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
      alert('Failed to load groups');
    }
  };

  const generateQR = async () => {
    if (!selectedFormation || !selectedGroup || !classDate || !startTime || !endTime) {
      alert('Please fill in all required fields');
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
      alert('QR Code generated successfully!');

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
      `⚠️ Cancel this attendance session?\n\n` +
      `Group: ${session.groupName}\n` +
      `Formation: ${session.formation}\n\n` +
      `This will:\n` +
      `• Cancel the QR code\n` +
      `• Delete all pending attendance records\n` +
      `• Students will NOT be marked absent\n\n` +
      `This action cannot be undone. Continue?`
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
        throw new Error(error.error || 'Failed to cancel session');
      }

      const data = await response.json();
      alert(`✅ Session cancelled successfully!\n\n${data.deletedRecords} pending record(s) deleted.\nStudents will not be marked absent.`);
      
      // Clear the QR code display
      setQrCodeData(null);
      setSession(null);
      setTimeRemaining(null);

    } catch (error) {
      console.error('Error cancelling session:', error);
      alert(`❌ Error: ${error.message}`);
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
          Generate Attendance QR Code
        </h2>

        <div className="form-grid">
          <div className="form-group">
            <label>
              <i className="fas fa-book"></i> Formation
            </label>
            <select
              value={selectedFormation}
              onChange={(e) => setSelectedFormation(e.target.value)}
              disabled={isFormationDisabled}
            >
              <option value="">Choose Formation...</option>
              {user?.formations?.map(formation => (
                <option key={formation} value={formation}>{formation}</option>
              ))}
            </select>
            {isFormationDisabled && (
              <small className="auto-assigned">(Auto-assigned)</small>
            )}
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-users"></i> Group
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              disabled={!selectedFormation}
            >
              <option value="">Choose Group...</option>
              {groups.map(group => (
                <option key={group._id} value={group._id}>
                  {group.name} ({group.studentCount || 0} students)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-calendar"></i> Date
            </label>
            <input
              type="date"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-clock"></i> Class Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-clock"></i> Class End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>
              <i className="fas fa-hourglass-half"></i> QR Validity (minutes)
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
              <i className="fas fa-user-clock"></i> Late Threshold (minutes)
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
              <i className="fas fa-spinner fa-spin"></i> Generating...
            </>
          ) : (
            <>
              <i className="fas fa-qrcode"></i> Generate QR Code
            </>
          )}
        </button>
      </div>

      {qrCodeData && session && (
        <div className="qr-display-card">
          <h2>
            <i className="fas fa-qrcode"></i>
            Scan This QR Code
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
              <span>{session.totalStudents} students</span>
            </div>
          </div>

          <div className="qr-code-container">
            <img src={qrCodeData} alt="Attendance QR Code" />
            <div className={`qr-timer ${timeRemaining === 'Expired' || (timeRemaining && timeRemaining.startsWith('0:')) ? 'expiring' : ''}`}>
              <i className="fas fa-hourglass-half"></i>
              <span>Expires in: {timeRemaining || '--:--'}</span>
            </div>
          </div>

          {/* Session ID Display */}
          <div className="session-id-card">
            <div className="session-id-header">
              <i className="fas fa-key"></i>
              <span>Manual Entry Code</span>
            </div>
            <div className="session-id-display">
              <code>{session.sessionId}</code>
              <button
                className="btn-copy"
                onClick={() => {
                  navigator.clipboard.writeText(session.sessionId);
                  alert('Session ID copied to clipboard!');
                }}
                title="Copy Session ID"
              >
                <i className="fas fa-copy"></i>
              </button>
            </div>
            <p className="session-id-note">
              <i className="fas fa-info-circle"></i>
              Students can enter this code manually if they can't scan the QR code
            </p>
          </div>

          <div className="qr-actions">
            <button className="btn-download" onClick={downloadQR}>
              <i className="fas fa-download"></i> Download QR
            </button>
            <button 
              className="btn-cancel" 
              onClick={cancelSession}
              disabled={loading}
              title="Cancel this session if it was created by mistake"
            >
              <i className="fas fa-times-circle"></i> Cancel Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceQR;
