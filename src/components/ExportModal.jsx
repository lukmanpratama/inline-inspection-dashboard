import React from 'react';

const ExportModal = ({ visible, message, progress, total }) => {
  if (!visible) return null;

  const pct = total > 0 ? Math.round((progress / total) * 100) : null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(10, 5, 32, 0.82)',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1A0F5A 0%, #0A0520 100%)',
        border: '1px solid rgba(255,106,0,0.35)',
        borderRadius: 16,
        padding: '40px 52px',
        minWidth: 360,
        textAlign: 'center',
        boxShadow: '0 0 60px rgba(255,106,0,0.15)',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: 'white',
      }}>
        {/* Spinner */}
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            border: '4px solid rgba(255,255,255,0.1)',
            borderTop: '4px solid #FF6A00',
            animation: 'spin 0.9s linear infinite',
          }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1.5,
                      textTransform: 'uppercase', color: '#FF6A00', marginBottom: 8 }}>
          Exporting PDF
        </div>

        {/* Message */}
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: pct != null ? 20 : 0 }}>
          {message || 'Please wait…'}
        </div>

        {/* Progress Bar (only when total > 0) */}
        {pct != null && (
          <>
            <div style={{
              height: 6,
              borderRadius: 99,
              background: 'rgba(255,255,255,0.1)',
              overflow: 'hidden',
              marginBottom: 8,
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #FF6A00, #ff9f50)',
                borderRadius: 99,
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              Week {progress} of {total} &nbsp;({pct}%)
            </div>
          </>
        )}
      </div>

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ExportModal;
