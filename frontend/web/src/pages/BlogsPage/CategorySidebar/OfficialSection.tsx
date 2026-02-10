/**
 * OfficialSection component - Chessortag Official collapsible section
 */

import React from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import pureLogo from "../../../assets/chessortag_pure_logo.png";
import { OfficialSectionProps } from "./types";

const OfficialSection: React.FC<OfficialSectionProps> = ({
  activeCategory,
  isOfficialOpen,
  setIsOfficialOpen,
  onCategoryClick,
}) => {
  const officialSubItems = [
    { id: "allblogs", label: "All Blogs" },
    { id: "about", label: "Our Stories" },
    { id: "function", label: "Functions Intro" },
  ];

  return (
    <Collapsible.Root open={isOfficialOpen} onOpenChange={setIsOfficialOpen}>
      <Collapsible.Trigger asChild>
        <button
          style={{
            background: isOfficialOpen ? "rgba(139, 115, 85, 0.1)" : "transparent",
            border: "none",
            borderLeft: isOfficialOpen ? "4px solid #8b7355" : "4px solid transparent",
            padding: "14px 25px",
            textAlign: "left",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: isOfficialOpen ? 600 : 500,
            color: isOfficialOpen ? "#2c2c2c" : "#5a5a5a",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            if (!isOfficialOpen) {
              e.currentTarget.style.background = "rgba(139, 115, 85, 0.05)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isOfficialOpen) {
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <img
            src={pureLogo}
            alt="Chessortag"
            style={{
              width: "24px",
              height: "24px",
              objectFit: "contain",
            }}
          />
          <span style={{ flex: 1 }}>Chessortag Official</span>
        </button>
      </Collapsible.Trigger>

      <Collapsible.Content
        style={{
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.87, 0, 0.13, 1)",
        }}
      >
        <div
          style={{
            paddingLeft: "54px",
            paddingTop: "4px",
            paddingBottom: "4px",
          }}
        >
          {officialSubItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onCategoryClick(item.id)}
              style={{
                background: activeCategory === item.id ? "rgba(139, 115, 85, 0.08)" : "transparent",
                border: "none",
                padding: "10px 25px 10px 20px",
                textAlign: "left",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: activeCategory === item.id ? 600 : 400,
                color: activeCategory === item.id ? "#8b7355" : "#6a6a6a",
                transition: "all 0.15s ease",
                display: "block",
                width: "100%",
                borderRadius: "6px",
                marginBottom: "2px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139, 115, 85, 0.08)";
                e.currentTarget.style.color = "#8b7355";
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== item.id) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6a6a6a";
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
};

export default OfficialSection;
