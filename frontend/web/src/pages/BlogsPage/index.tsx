import React from "react";
import PageTransition from "../../components/animation/PageTransition";
import CategorySidebar from "./CategorySidebar";
import ContentArea from "./ContentArea";

const BlogsPage = () => {
  return (
    <PageTransition>
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
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {/* Header */}
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
              BLOGS
            </h1>
            <p
              style={{
                fontSize: "1.4rem",
                fontWeight: 600,
                color: "#8b7355",
                marginBottom: "0",
              }}
            >
              Insights, Tutorials & Chess Knowledge
            </p>
          </div>

          {/* Main Layout: Sidebar + Content */}
          <div
            style={{
              display: "flex",
              gap: "30px",
              alignItems: "flex-start",
            }}
          >
            <CategorySidebar />
            <ContentArea />
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default BlogsPage;
