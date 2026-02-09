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
