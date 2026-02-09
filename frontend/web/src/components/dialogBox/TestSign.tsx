import React, { useState } from 'react';
import './TestSign.css';

const TestSign: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="test-sign-banner">
      <div className="test-sign-content">
        <div className="test-sign-icon">🚧</div>
        <div className="test-sign-text">
          <strong>Currently under renovation.</strong> Beta testers are welcomed to send your suggestions to{' '}
          <a href="mailto:info@steinitzchess.org" className="test-sign-link">
            info@steinitzchess.org
          </a>{' '}
          or WeChat{' '}
          <span className="test-sign-wechat">Wxib_l3c01kg3a10086</span>
        </div>
      </div>
      <button
        className="test-sign-close"
        onClick={() => setIsVisible(false)}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default TestSign;
