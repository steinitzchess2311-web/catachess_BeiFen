import React from "react";
import chessbaseImg from "../../assets/chessbase.jpg";
import lichessImg from "../../assets/lichess.png";
import chesstempoImg from "../../assets/chesstempo.jpg";

const SponsorshipPage = () => {
  return (
    <div
      style={{
        padding: "48px 24px 80px",
        fontFamily: "'Roboto', sans-serif",
        background:
          "linear-gradient(135deg, rgba(255, 250, 245, 0.95) 0%, rgba(255, 245, 235, 0.95) 50%, rgba(255, 240, 230, 0.95) 100%)",
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
            marginBottom: "60px",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "16px",
              letterSpacing: "2px",
            }}
          >
            SPONSORSHIP
          </h1>
          <p
            style={{
              fontSize: "1.8rem",
              fontWeight: 600,
              color: "#ff6b35",
              marginBottom: "0",
            }}
          >
            AKA Your Help Matters!!!
          </p>
        </div>

        {/* Founders Section */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "16px",
            padding: "40px",
            marginBottom: "50px",
            boxShadow: "0 8px 32px rgba(255, 140, 0, 0.15)",
            border: "2px solid rgba(255, 140, 0, 0.1)",
          }}
        >
          <p
            style={{
              fontSize: "1.2rem",
              lineHeight: "2",
              color: "#333",
              marginBottom: "1.5rem",
            }}
          >
            This website is actually started and <strong>FULLY developed</strong> by 2 high
            school students: <strong style={{ color: "#ff8c00" }}>Quanhao Li (CataDragon)</strong> and{" "}
            <strong style={{ color: "#ff8c00" }}>Jorlanda Chen</strong>? They are young dreamers,
            PRO chess players, and are trying to easier chess players' lives:
          </p>
        </div>

        {/* Problems Section - Alternating Layout */}
        <div style={{ marginBottom: "50px" }}>
          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: 700,
              color: "#333",
              marginBottom: "40px",
              textAlign: "center",
            }}
          >
            The Problem with Existing Tools
          </h2>

          {/* ChessBase - Image Left */}
          <div
            style={{
              display: "flex",
              gap: "40px",
              marginBottom: "40px",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div style={{ flex: "0 0 45%" }}>
              <img
                src={chessbaseImg}
                alt="ChessBase"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              />
            </div>
            <div style={{ flex: "1" }}>
              <h3
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 600,
                  color: "#ff8c00",
                  marginBottom: "16px",
                }}
              >
                ChessBase
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: "1.8",
                  color: "#555",
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
              gap: "40px",
              marginBottom: "40px",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
              flexDirection: "row-reverse",
            }}
          >
            <div style={{ flex: "0 0 45%" }}>
              <img
                src={lichessImg}
                alt="Lichess Study"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              />
            </div>
            <div style={{ flex: "1" }}>
              <h3
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 600,
                  color: "#ff8c00",
                  marginBottom: "16px",
                }}
              >
                Lichess Study
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: "1.8",
                  color: "#555",
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
              gap: "40px",
              marginBottom: "40px",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.8)",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
            }}
          >
            <div style={{ flex: "0 0 45%" }}>
              <img
                src={chesstempoImg}
                alt="ChessTempo"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              />
            </div>
            <div style={{ flex: "1" }}>
              <h3
                style={{
                  fontSize: "1.6rem",
                  fontWeight: 600,
                  color: "#ff8c00",
                  marginBottom: "16px",
                }}
              >
                ChessTempo Opening
              </h3>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: "1.8",
                  color: "#555",
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
            background: "linear-gradient(135deg, rgba(255, 140, 0, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%)",
            borderRadius: "16px",
            padding: "40px",
            marginBottom: "50px",
            border: "3px solid rgba(255, 140, 0, 0.3)",
          }}
        >
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              color: "#ff6b35",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            How does ChessorTag solve that?
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "24px",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#ff8c00",
                  marginBottom: "12px",
                }}
              >
                FREE!
              </h3>
              <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: "1.6" }}>
                FREE for all users! No premium tiers, no hidden costs.
              </p>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#ff8c00",
                  marginBottom: "12px",
                }}
              >
                Organized
              </h3>
              <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: "1.6" }}>
                Easily create folder and subfolder systems to keep everything neat.
              </p>
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.9)",
                padding: "24px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  color: "#ff8c00",
                  marginBottom: "12px",
                }}
              >
                Clear PGN
              </h3>
              <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: "1.6" }}>
                CLEAR PGN parsing technology - import your games seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Imitator Section */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%)",
            borderRadius: "20px",
            padding: "50px",
            marginBottom: "50px",
            border: "4px solid #ff8c00",
            boxShadow: "0 12px 40px rgba(255, 140, 0, 0.25)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h2
              style={{
                fontSize: "3rem",
                fontWeight: 800,
                color: "#ff6b35",
                marginBottom: "16px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              And......we got our OWN, NEW thing:
            </h2>
            <h3
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: "24px",
              }}
            >
              ChessorTag Imitator!!!!!
            </h3>
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "12px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <p
              style={{
                fontSize: "1.2rem",
                lineHeight: "2",
                color: "#333",
                marginBottom: "1.5rem",
              }}
            >
              ChessorTag imitator is our core inventive algorithm that <strong>does not use neural
              network imitation</strong>, but ranks the top 8 Stockfish moves by the{" "}
              <strong style={{ color: "#ff8c00" }}>
                probability that a specific player would choose them
              </strong>
              . This......
            </p>
            <ul
              style={{
                fontSize: "1.1rem",
                lineHeight: "2",
                color: "#555",
                paddingLeft: "2rem",
                listStyleType: "none",
              }}
            >
              <li style={{ marginBottom: "16px" }}>
                <span style={{ color: "#ff8c00", fontWeight: 700, marginRight: "8px" }}>✓</span>
                Allows LLMs to <strong>explain moves in the style of a target player</strong>{" "}
                (which is epoch-making). If you give an FEN to ChatGPT or Gemini etc, they
                generate wrong ideas. But with our system, <strong>LLMs can actively reflect what
                players are thinking</strong>. We are making TOP players from William Steinitz to
                Magnus Carlsen your <strong style={{ color: "#ff6b35" }}>PERSONAL CHESS COACH!</strong>
              </li>
              <li style={{ marginBottom: "16px" }}>
                <span style={{ color: "#ff8c00", fontWeight: 700, marginRight: "8px" }}>✓</span>
                Helps you to <strong>prepare against your opponent easily!</strong> You can have
                clear focus on which opening variation to study deeper when preparing!
              </li>
            </ul>
          </div>
        </div>

        {/* Funding Plans */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "16px",
            padding: "40px",
            marginBottom: "50px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
          }}
        >
          <h2
            style={{
              fontSize: "2.2rem",
              fontWeight: 700,
              color: "#333",
              marginBottom: "30px",
              textAlign: "center",
            }}
          >
            With your funds, we will:
          </h2>
          <ul
            style={{
              fontSize: "1.2rem",
              lineHeight: "2.2",
              color: "#555",
              paddingLeft: "2rem",
              listStyleType: "none",
            }}
          >
            <li style={{ marginBottom: "20px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "32px",
                  height: "32px",
                  background: "#ff8c00",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "32px",
                  marginRight: "12px",
                  fontWeight: 700,
                }}
              >
                1
              </span>
              Improve ChessorTag imitator's logic, so it better imitates players' styles
            </li>
            <li style={{ marginBottom: "20px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "32px",
                  height: "32px",
                  background: "#ff8c00",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "32px",
                  marginRight: "12px",
                  fontWeight: 700,
                }}
              >
                2
              </span>
              Hold <strong>HIGH FUNDS TOURNAMENTS</strong> (see steinitzchess.org). Encourage
              up-and-coming players to improve
            </li>
            <li style={{ marginBottom: "20px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "32px",
                  height: "32px",
                  background: "#ff8c00",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "32px",
                  marginRight: "12px",
                  fontWeight: 700,
                }}
              >
                3
              </span>
              <strong>Advertising!</strong> Ask PRO players to use and comment on our product, so
              more people can know this
            </li>
            <li style={{ marginBottom: "20px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "32px",
                  height: "32px",
                  background: "#ff8c00",
                  color: "white",
                  borderRadius: "50%",
                  textAlign: "center",
                  lineHeight: "32px",
                  marginRight: "12px",
                  fontWeight: 700,
                }}
              >
                4
              </span>
              Buy bubble tea and Clash Royale boarding pass 🧋
            </li>
          </ul>
        </div>

        {/* CTA Section */}
        <div
          style={{
            background: "linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)",
            borderRadius: "20px",
            padding: "50px",
            textAlign: "center",
            boxShadow: "0 12px 48px rgba(255, 107, 53, 0.4)",
          }}
        >
          <h2
            style={{
              fontSize: "2.8rem",
              fontWeight: 800,
              color: "white",
              marginBottom: "24px",
              textTransform: "uppercase",
              letterSpacing: "2px",
            }}
          >
            YOUR HELP IS EXTREMELY CRUCIAL TO US!
          </h2>
          <p
            style={{
              fontSize: "1.3rem",
              color: "rgba(255, 255, 255, 0.95)",
              marginBottom: "32px",
              lineHeight: "1.8",
            }}
          >
            Contact us at <strong>info@steinitzchess.org</strong> for sponsorship inquiries
          </p>
          <a
            href="mailto:info@steinitzchess.org"
            style={{
              display: "inline-block",
              background: "white",
              color: "#ff6b35",
              padding: "16px 48px",
              borderRadius: "50px",
              fontSize: "1.2rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-3px)";
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
