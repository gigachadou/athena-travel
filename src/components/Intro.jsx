import React, { useState, useEffect } from 'react';
import logo from '../assets/logo.png';
import './Intro.css';

const Intro = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2; // Increment by 2% every 70ms for ~3.5s
      });
    }, 70);

    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <div className="intro-container">
      <div className="intro-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      <div className="intro-content">
        <div className="logo-container">
          <img src={logo} alt="Athena Travel Logo" className="intro-logo" />
          <div className="logo-glow"></div>
        </div>
        <h1 className="intro-title">Athena Travel</h1>
        <p className="intro-subtitle">Discover the World with Us</p>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default Intro;