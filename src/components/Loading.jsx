import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import './Loading.css';

const Loading = ({ fullPage = false, message = 'Yuklanmoqda...' }) => {
  return (
    <div className={`loading-container ${fullPage ? 'full-page' : ''} fade-in`}>
      <div className="loading-content glass">
        <div className="spinner-wrapper">
          <Loader2 className="spinner-icon animate-spin" size={40} />
          <div className="shimmer-ring"></div>
        </div>
        <div className="loading-text">
          <Sparkles className="spark-icon" size={16} />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
