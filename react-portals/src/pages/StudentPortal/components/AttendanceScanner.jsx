import { useState, useEffect, useRef } from 'react';
import { useStudentAuth } from '../../../context/StudentAuthContext';
import { studentAPI } from '../../../services/api';
import './AttendanceScanner.css';

const AttendanceScanner = () => {
  const { user } = useStudentAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    formation: '',
    startDate: '',
    endDate: ''
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    loadHistory();
    return () => {
      stopScanning();
    };
  }, [filters]);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(() => {
          scanQRCode();
        }, 500);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Failed to access camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    setScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        processQRCode(code.data);
        stopScanning();
      }
    } catch (error) {
      // jsQR not loaded, use alternative method
      console.log('Waiting for QR code...');
    }
  };

  const processQRCode = async (qrData) => {
    try {
      const data = JSON.parse(qrData);
      const { sessionId, groupId, timestamp } = data;

      if (!sessionId || !groupId) {
        throw new Error('Invalid QR code format');
      }

      const response = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        },
        body: JSON.stringify({
          sessionId,
          groupId,
          timestamp
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to mark attendance');
      }

      setResult({
        type: 'success',
        message: result.message,
        status: result.status,
        session: result.session
      });

      // Reload history and stats immediately
      setTimeout(async () => {
        await loadHistory();
      }, 500); // Small delay to ensure backend has updated

    } catch (error) {
      console.error('Error processing QR code:', error);
      setResult({
        type: 'error',
        message: error.message
      });
    }
  };

  const loadHistory = async () => {
    try {
      let url = '/api/attendance/student/history?limit=50';
      if (filters.formation) url += `&formation=${filters.formation}`;
      if (filters.startDate) url += `&startDate=${filters.startDate}`;
      if (filters.endDate) url += `&endDate=${filters.endDate}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('studentToken')}`
        }
      });

      if (!response.ok) throw new Error('Failed to load history');

      const data = await response.json();
      setHistory(data.records || []);
      setStats(data.stats || null);

    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const closeResult = () => {
    setResult(null);
  };

  return (
    <div className="attendance-scanner">
      {/* Scanner Card */}
      <div className="scanner-card">
        <h2>
          <i className="fas fa-qrcode"></i>
          Scan Attendance QR Code
        </h2>
        <p className="instruction">
          Point your camera at the teacher's QR code to mark your attendance
        </p>

        <div className="scanner-container">
          {!scanning ? (
            <div className="scanner-placeholder">
              <i className="fas fa-camera"></i>
              <p>Click "Start Scanning" to open camera</p>
            </div>
          ) : (
            <div className="video-container">
              <video ref={videoRef} autoPlay playsInline />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
          )}
        </div>

        <div className="scanner-actions">
          {!scanning ? (
            <button className="btn-start-scan" onClick={startScanning}>
              <i className="fas fa-camera"></i> Start Scanning
            </button>
          ) : (
            <button className="btn-stop-scan" onClick={stopScanning}>
              <i className="fas fa-stop"></i> Stop Scanning
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="stats-summary">
          <div className="stat-item">
            <i className="fas fa-check-circle"></i>
            <div>
              <span className="stat-value">{stats.present}</span>
              <span className="stat-label">Present</span>
            </div>
          </div>
          <div className="stat-item">
            <i className="fas fa-clock"></i>
            <div>
              <span className="stat-value">{stats.late}</span>
              <span className="stat-label">Late</span>
            </div>
          </div>
          <div className="stat-item">
            <i className="fas fa-times-circle"></i>
            <div>
              <span className="stat-value">{stats.absent}</span>
              <span className="stat-label">Absent</span>
            </div>
          </div>
          <div className="stat-item">
            <i className="fas fa-percentage"></i>
            <div>
              <span className="stat-value">{stats.attendanceRate}%</span>
              <span className="stat-label">Attendance Rate</span>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="history-card">
        <h2>
          <i className="fas fa-history"></i>
          My Attendance History
        </h2>

        <div className="filters">
          <select
            value={filters.formation}
            onChange={(e) => setFilters({ ...filters, formation: e.target.value })}
          >
            <option value="">All Formations</option>
            {user?.formation?.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
            {user?.filiere?.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-times"></i>
              <p>No attendance records yet</p>
            </div>
          ) : (
            history.map(record => (
              <div key={record._id} className="history-item">
                <div className="history-info">
                  <h3>{record.formation} - {record.groupName}</h3>
                  <p><i className="fas fa-calendar"></i> {new Date(record.date).toLocaleDateString()}</p>
                  <p><i className="fas fa-user"></i> {record.teacherName}</p>
                  {record.scanTime && (
                    <p><i className="fas fa-clock"></i> Scanned at {new Date(record.scanTime).toLocaleTimeString()}</p>
                  )}
                </div>
                <span className={`status-badge ${record.status}`}>
                  {record.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Result Modal */}
      {result && (
        <div className="result-modal active" onClick={closeResult}>
          <div className="result-content" onClick={(e) => e.stopPropagation()}>
            <div className={`result-icon ${result.type}`}>
              {result.type === 'success' ? (
                <i className="fas fa-check-circle"></i>
              ) : (
                <i className="fas fa-times-circle"></i>
              )}
            </div>
            <h2>{result.type === 'success' ? 'Attendance Marked!' : 'Error'}</h2>
            <p>{result.message}</p>
            {result.session && (
              <div className="result-details">
                <p><strong>Group:</strong> {result.session.groupName}</p>
                <p><strong>Formation:</strong> {result.session.formation}</p>
                <p><strong>Teacher:</strong> {result.session.teacherName}</p>
                <p><strong>Date:</strong> {new Date(result.session.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> <span className={`status-badge ${result.status}`}>{result.status}</span></p>
              </div>
            )}
            <button className="btn-close-modal" onClick={closeResult}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Load jsQR library */}
      <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>
    </div>
  );
};

export default AttendanceScanner;
