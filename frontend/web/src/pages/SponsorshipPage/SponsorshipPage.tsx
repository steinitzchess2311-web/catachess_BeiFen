import React from "react";
import chessbaseImg from "../../assets/chessbase.jpg";
import lichessImg from "../../assets/lichess.png";
import chesstempoImg from "../../assets/chesstempo.jpg";

const SponsorshipPage = () => {
  return (
    <div
      style={{
        padding: "40px 24px 70px",
        fontFamily: "'Roboto', sans-serif",
        background:
          "linear-gradient(135deg, rgba(250, 248, 245, 0.95) 0%, rgba(245, 242, 238, 0.95) 50%, rgba(242, 238, 233, 0.95) 100%)",
        minHeight: "calc(100vh - 64px)",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* Hero Section */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          <h1
            style={{
              fontSize: "2.8rem",
              fontWeight: 800,
              color: "#2c2c2c",
              marginBottom: "12px",
              letterSpacing: "1px",
            }}
          >
            SPONSORSHIP
          </h1>
          <p
            style={{
              fontSize: "1.4rem",
              fontWeight: 600,
              color: "#8b7355",
              marginBottom: "0",
            }}
          >
            AKA Your Help Matters!!!
          </p>
        </div>

        {/* Founders Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "12px",
            padding: "32px",
            marginBottom: "45px",
            boxShadow: "0 4px 20px rgba(139, 115, 85, 0.08)",
            border: "1px solid rgba(139, 115, 85, 0.15)",
          }}
        >
          <p
            style={{
              fontSize: "1.05rem",
              lineHeight: "1.9",
              color: "#4a4a4a",
              marginBottom: "0",
            }}
          >
            This website is actually started and <strong>FULLY developed</strong> by 2 high
            school students: <strong style={{ color: "#8b7355" }}>Quanhao Li (CataDragon)</strong> and{" "}
            <strong style={{ color: "#8b7355" }}>Jorlanda Chen</strong>? They are young dreamers,
            PRO chess players, and are trying to easier chess players' lives:
          </p>
        </div>

        {/* Problems Section - Alternating Layout */}
        <div style={{ marginBottom: "45px" }}>
          <h2
            style={{
              fontSize: "1.9rem",
              fontWeight: 700,
              color: "#2c2c2c",
              marginBottom: "35px",
              textAlign: "center",
            }}
          >
            The Problem with Existing Tools
          </h2>

          {/* ChessBase - Image Left */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginBottom: "32px",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.75)",
              borderRadius: "10px",
              padding: "24px",
              boxShadow: "0 3px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div style={{ flex: "0 0 38%" }}>
              <img
                src={chessbaseImg}
                alt="ChessBase"
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
                }}
              />
            </div>
            <div style={{ flex: "1" }}>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "#8b7355",
                  marginBottom: "12px",
                }}
              >
                ChessBase
              </h3>
              <p
                style={{
                  fontSize: "0.98rem",
                  lineHeight: "1.7",
                  color: "#5a5a5a",
                }}
              >
                Pro players are all using ChessBase to keep their chess repertoires and materials
                organized, yet ChessBase is <strong>REALLY unfriendly</strong> towards normal chess
                players: <strong>Extremely unfriendly for Mac users</strong>, and,{" "}
                <strong>EXPENSIVE!</strong>
              </p>
            </div>
          </div>

          {/* Lichess - Image Right */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginBottom: "32px",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.75)",
              borderRadius: "10px",
              padding: "24px",
              boxShadow: "0 3px 12px rgba(0, 0, 0, 0.06)",
              flexDirection: "row-reverse",
            }}
          >
            <div style={{ flex: "0 0 38%" }}>
              <img
                src={lichessImg}
                alt="Lichess Study"
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
                }}
              />
            </div>
            <div style={{ flex: "1" }}>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "#8b7355",
                  marginBottom: "12px",
                }}
              >
                Lichess Study
              </h3>
              <p
                style={{
                  fontSize: "0.98rem",
                  lineHeight: "1.7",
                  color: "#5a5a5a",
                }}
              >
                Lichess study is good! However, you <strong>cannot intuitively organize</strong>{" "}
                your materials! You cannot create <strong>folders and subfolders</strong> to keep
                your materials organized.
              </p>
            </div>
          </div>

          {/* ChessTempo - Image Left */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              marginBottom: "32px",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.75)",
              borderRadius: "10px",
              padding: "24px",
              boxShadow: "0 3px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <div style={{ flex: "0 0 38%" }}>
              <img
                src={chesstempoImg}
                alt="ChessTempo"
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
                }}
              />
            </div>
            <div style={{ flex: "1" }}>
              <h3
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 600,
                  color: "#8b7355",
                  marginBottom: "12px",
                }}
              >
                ChessTempo Opening
              </h3>
              <p
                style={{
                  fontSize: "0.98rem",
                  lineHeight: "1.7",
                  color: "#5a5a5a",
                }}
              >
                ChessTempo opening is also good! But there are{" "}
                <strong>limitations when opening a PGN file</strong>, making it harder to import
                your existing chess materials.
              </p>
            </div>
          </div>
        </div>

        {/* Solution Section */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(139, 115, 85, 0.08) 0%, rgba(160, 130, 95, 0.08) 100%)",
            borderRadius: "12px",
            padding: "35px",
            marginBottom: "45px",
            border: "2px solid rgba(139, 115, 85, 0.2)",
          }}
        >
          <h2
            style={{
              fontSize: "2.1rem",
              fontWeight: 700,
              color: "#8b7355",
              marginBottom: "28px",
              textAlign: "center",
            }}
          >
            How does ChessorTag solve that?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "20px",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#8b7355",
                  marginBottom: "10px",
                }}
              >
                FREE!
              </h3>
              <p style={{ fontSize: "0.98rem", color: "#5a5a5a", lineHeight: "1.6" }}>
                FREE for all users! No premium tiers, no hidden costs.
              </p>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#8b7355",
                  marginBottom: "10px",
                }}
              >
                Organized
              </h3>
              <p style={{ fontSize: "0.98rem", color: "#5a5a5a", lineHeight: "1.6" }}>
                Easily create folder and subfolder systems to keep everything neat.
              </p>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 3px 10px rgba(0, 0, 0, 0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: "#8b7355",
                  marginBottom: "10px",
                }}
              >
                Clear PGN
              </h3>
              <p style={{ fontSize: "0.98rem", color: "#5a5a5a", lineHeight: "1.6" }}>
                CLEAR PGN parsing technology - import your games seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Imitator Section - NO BORDER */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "12px",
            padding: "40px",
            marginBottom: "45px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "25px" }}>
            <h2
              style={{
                fontSize: "2.3rem",
                fontWeight: 800,
                color: "#2c2c2c",
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              And......we got our OWN, NEW thing:
            </h2>
            <h3
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: "#8b7355",
                marginBottom: "20px",
              }}
            >
              ChessorTag Imitator!!!!!
            </h3>
          </div>
          <div
            style={{
              background: "rgba(245, 242, 238, 0.5)",
              borderRadius: "10px",
              padding: "28px",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                fontSize: "1.05rem",
                lineHeight: "1.9",
                color: "#4a4a4a",
                marginBottom: "1.3rem",
              }}
            >
              ChessorTag imitator is our core inventive algorithm that <strong>does not use neural
              network imitation</strong>, but ranks the top 8 Stockfish moves by the{" "}
              <strong style={{ color: "#8b7355" }}>
                probability that a specific player would choose them
              </strong>
              . This......
            </p>
            <ul
              style={{
                fontSize: "0.98rem",
                lineHeight: "1.9",
                color: "#5a5a5a",
                paddingLeft: "1.8rem",
                listStyleType: "none",
              }}
            >
              <li style={{ marginBottom: "14px" }}>
                <span style={{ color: "#8b7355", fontWeight: 700, marginRight: "8px" }}>✓</span>
                Allows LLMs to <strong>explain moves in the style of a target player</strong>{" "}
                (which is epoch-making). If you give an FEN to ChatGPT or Gemini etc, they
                generate wrong ideas. But with our system, <strong>LLMs can actively reflect what
                players are thinking</strong>. We are making TOP players from William Steinitz to
                Magnus Carlsen your <strong style={{ color: "#8b7355" }}>PERSONAL CHESS COACH!</strong>
              </li>
              <li style={{ marginBottom: "14px" }}>
                <span style={{ color: "#8b7355", fontWeight: 700, marginRight: "8px" }}>✓</span>
                Helps you to <strong>prepare against your opponent easily!</strong> You can have
                clear focus on which opening variation to study deeper when preparing!
              </li>
            </ul>
          </div>
        </div>

        {/* Funding Plans */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: "12px",
            padding: "35px",
            marginBottom: "45px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h2
            style={{
              fontSize: "1.9rem",
              fontWeight: 700,
              color: "#2c2c2c",
              marginBottom: "28px",
              textAlign: "center",
            }}
          >
            With your funds, we will:
          </h2>
          <ul
            style={{
              fontSize: "1.05rem",
              lineHeight: "2",
              color: "#5a5a5a",
              paddingLeft: "1.8rem",
              listStyleType: "none",
            }}
          >
            <li style={{ marginBottom: "18px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "28px",
                  background: "#8b7355",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "28px",
                  marginRight: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                1
              </span>
              Improve ChessorTag imitator's logic, so it better imitates players' styles
            </li>
            <li style={{ marginBottom: "18px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "28px",
                  background: "#8b7355",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "28px",
                  marginRight: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                2
              </span>
              Hold <strong>HIGH FUNDS TOURNAMENTS</strong> (see steinitzchess.org). Encourage
              up-and-coming players to improve
            </li>
            <li style={{ marginBottom: "18px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "28px",
                  background: "#8b7355",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "28px",
                  marginRight: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                3
              </span>
              <strong>Advertising!</strong> Ask PRO players to use and comment on our product, so
              more people can know this
            </li>
            <li style={{ marginBottom: "18px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "28px",
                  height: "28px",
                  background: "#8b7355",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "28px",
                  marginRight: "10px",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                }}
              >
                4
              </span>
              <span style={{ textDecoration: "line-through" }}>
                Buy bubble tea and Clash Royale boarding pass
              </span>
            </li>
          </ul>
        </div>

        {/* CTA Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #8b7355 0%, #a0825f 100%)",
            borderRadius: "16px",
            padding: "45px",
            textAlign: "center",
            boxShadow: "0 8px 32px rgba(139, 115, 85, 0.3)",
          }}
        >
          <h2
            style={{
              fontSize: "2.3rem",
              fontWeight: 800,
              color: "white",
              marginBottom: "20px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            YOUR HELP IS EXTREMELY CRUCIAL TO US!
          </h2>
          <p
            style={{
              fontSize: "1.15rem",
              color: "rgba(255, 255, 255, 0.95)",
              marginBottom: "28px",
              lineHeight: "1.7",
            }}
          >
            Contact us at <strong>info@steinitzchess.org</strong> for sponsorship inquiries
          </p>
          <a
            href="mailto:info@steinitzchess.org"
            style={{
              display: "inline-block",
              background: "white",
              color: "#8b7355",
              padding: "14px 42px",
              borderRadius: "50px",
              fontSize: "1.05rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default SponsorshipPage;
