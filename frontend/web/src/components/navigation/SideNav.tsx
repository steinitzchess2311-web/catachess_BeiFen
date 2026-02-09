import React, { useState, useEffect } from "react";

interface NavItem {
  id: string;
  label: string;
  icon?: string;
}

interface SideNavProps {
  items: NavItem[];
}

const SideNav: React.FC<SideNavProps> = ({ items }) => {
  const [activeSection, setActiveSection] = useState<string>(items[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const sections = items.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 150; // Offset for header

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(items[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120; // Offset for header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: "140px",
        left: "max(24px, calc((100vw - 1400px) / 2))",
        width: "220px",
        background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "12px",
        padding: "24px 0",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        backdropFilter: "blur(10px)",
        zIndex: 100,
      }}
    >
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
        }}
      >
        {items.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <li key={item.id} style={{ marginBottom: "4px" }}>
              <button
                onClick={() => scrollToSection(item.id)}
                style={{
                  width: "100%",
                  padding: "12px 20px",
                  border: "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: "0.95rem",
                  color: isActive ? "#8b7355" : "#5a5a5a",
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.3s ease",
                  position: "relative",
                  borderLeft: isActive ? "3px solid #8b7355" : "3px solid transparent",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#8b7355";
                    e.currentTarget.style.transform = "translateX(4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#5a5a5a";
                    e.currentTarget.style.transform = "translateX(0)";
                  }
                }}
              >
                {item.icon && <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default SideNav;
