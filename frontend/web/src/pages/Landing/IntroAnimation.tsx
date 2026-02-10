import React, { useState, useEffect } from "react";
import logo from "../../assets/chessortag_pure_logo.png";

/**
 * IntroAnimation - Splash screen with logo fade-in/fade-out effect
 * Shows a black screen with inverted logo, then fades out to reveal the landing page
 */
const IntroAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [opacity, setOpacity] = useState(0.9);

  useEffect(() => {
    // Start fading out after 0.5 seconds
    const fadeTimer = setTimeout(() => {
      setOpacity(0);
    }, 500);

    // Complete animation after fade out (0.5s delay + 0.7s fade)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1200);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        opacity: opacity,
        transition: "opacity 0.7s ease-out",
        pointerEvents: opacity === 0 ? "none" : "auto",
      }}
    >
      <img
        src={logo}
        alt="ChessorTag Logo"
        style={{
          width: "480px",
          height: "480px",
          objectFit: "contain",
          filter: "invert(1)", // Invert colors: black background, white logo
          opacity: opacity > 0 ? 1 : 0,
          transition: "opacity 0.7s ease-out",
        }}
      />
    </div>
  );
};

export default IntroAnimation;
