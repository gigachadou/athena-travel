import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useAnimation } from 'framer-motion';
import logo from '../assets/logo.png';
import './Hero.css';

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const controls = useAnimation();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 1, ease: "easeOut" }
    });
  }, [controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  const logoVariants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
      scale: 1,
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 1.5,
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      }
    }
  };

  const titleVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 1,
      }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <motion.section
      ref={heroRef}
      className="hero-section"
      style={{ y, opacity }}
    >
      {/* Animated Background */}
      <div className="hero-background">
        {/* Gradient Mesh */}
        <motion.div
          className="hero-gradient-mesh"
          animate={{
            background: [
              "linear-gradient(45deg, #0a0a0a, #1a1a1a, #ff6b35)",
              "linear-gradient(135deg, #0a0a0a, #2a2a2a, #ff6b35)",
              "linear-gradient(225deg, #0a0a0a, #1a1a1a, #ff6b35)",
              "linear-gradient(315deg, #0a0a0a, #2a2a2a, #ff6b35)",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />

        {/* Moving Light Rays */}
        <motion.div
          className="hero-light-rays"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <div className="hero-light-ray-1"></div>
          <div className="hero-light-ray-2"></div>
        </motion.div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="hero-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Glassmorphism Layers */}
        <motion.div
          className="hero-glassmorphism"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Animated Lines */}
        <motion.div
          className="hero-animated-lines"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <motion.div
            className="hero-line-horizontal"
            animate={{ scaleX: [0, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
          <motion.div
            className="hero-line-vertical"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity, delay: 2 }}
          />
        </motion.div>
      </div>

      {/* Mouse Follow Light Orb */}
      <motion.div
        className="hero-mouse-orb"
        animate={{
          x: mousePosition.x * 100 - 192,
          y: mousePosition.y * 100 - 192,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 20 }}
      />

      {/* Noise Texture Overlay */}
      <div className="hero-noise-overlay">
        <div className="bg-noise w-full h-full"></div>
      </div>

      {/* Main Content */}
      <motion.div
        className="hero-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div
          className="hero-logo-container"
          variants={logoVariants}
        >
          <motion.div
            className="hero-logo-wrapper"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <img
              src={logo}
              alt="Athena Travel Logo"
              className="hero-logo"
            />
            {/* Logo Glow */}
            <motion.div
              className="hero-logo-glow"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Particle Burst */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="hero-particle-burst"
                style={{
                  top: '50%',
                  left: '50%',
                }}
                animate={{
                  x: Math.cos(i * 45 * Math.PI / 180) * 60,
                  y: Math.sin(i * 45 * Math.PI / 180) * 60,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.5 + i * 0.1,
                }}
              />
            ))}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="hero-title"
          variants={titleVariants}
        >
          {["Discover", "the", "World", "with", "Athena"].map((word, index) => (
            <motion.span
              key={index}
              className="inline-block mr-4 mb-2"
              variants={wordVariants}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="hero-subtitle"
          variants={itemVariants}
        >
          Embark on extraordinary journeys with our premium travel experiences
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          className="hero-cta-container"
          variants={itemVariants}
        >
          <motion.button
            className="hero-cta-primary"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span>Start Your Journey</span>
            <motion.div
              className="hero-cta-shine"
            />
            {/* Ripple Effect */}
            <motion.div
              className="hero-cta-ripple"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.6 }}
              style={{ originX: 0.5, originY: 0.5 }}
            />
          </motion.button>

          <motion.button
            className="hero-cta-secondary"
            whileHover={{
              scale: 1.05,
              borderColor: "rgba(255, 107, 53, 0.5)",
              boxShadow: "0 0 30px rgba(255, 107, 53, 0.3)"
            }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Explore Destinations</span>
            <motion.div
              className="absolute inset-0 border-2 border-carrot/50 rounded-full"
              initial={{ scale: 1, opacity: 0 }}
              whileHover={{ scale: 1.1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>

        {/* Floating Cards/Icons */}
        <motion.div
          className="hero-floating-card hero-floating-card-1"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <span className="text-2xl">✈️</span>
        </motion.div>

        <motion.div
          className="hero-floating-card hero-floating-card-2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <span className="text-2xl">🏖️</span>
        </motion.div>

        <motion.div
          className="hero-floating-card hero-floating-card-3"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <span className="text-2xl">🏔️</span>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        className="hero-scroll-indicator"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.section>
  );
};

export default Hero;