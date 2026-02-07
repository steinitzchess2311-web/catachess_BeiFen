import React from "react";
import { EnvelopeClosedIcon, GlobeIcon, ChatBubbleIcon } from "@radix-ui/react-icons";
import "./Footer.css";

interface FooterProps {
  isVisible: boolean;
}

const Footer: React.FC<FooterProps> = ({ isVisible }) => {
  return (
    <footer className={`app-footer ${isVisible ? "visible" : ""}`}>
      <div className="footer-gradient-overlay"></div>
      <div className="footer-content">
        <div className="footer-section footer-main">
          <div className="footer-brand">
            <div className="brand-icon">♔</div>
            <div className="brand-text">
              <p className="brand-title">Developed by</p>
              <p className="brand-names">CataDragon & SiciDeer</p>
            </div>
          </div>
        </div>

        <div className="footer-section footer-contact">
          <h3 className="footer-heading">Contact</h3>
          <div className="contact-item">
            <EnvelopeClosedIcon className="contact-icon" />
            <a href="mailto:info@steinitzchess.org" className="contact-link">
              info@steinitzchess.org
            </a>
          </div>
          <div className="contact-item">
            <ChatBubbleIcon className="contact-icon" />
            <span className="contact-label">WeChat ID:</span>
            <span className="contact-text">Wxib_l3c01kg3a10086</span>
          </div>
          <div className="contact-item">
            <GlobeIcon className="contact-icon" />
            <a
              href="https://steinitzchess.org"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-link"
            >
              steinitzchess.org
            </a>
          </div>
        </div>

        <div className="footer-section footer-appreciation">
          <h3 className="footer-heading">Appreciated Individuals</h3>
          <div className="appreciation-grid">
            <span className="appreciation-name">Cata Long</span>
            <span className="appreciation-name">Jorlanda Chen</span>
            <span className="appreciation-name">Yiping Lou</span>
            <span className="appreciation-name">Zhian Chen</span>
            <span className="appreciation-name">Liren Ding</span>
            <span className="appreciation-name">Yaochen Yu</span>
            <span className="appreciation-name">ZiFei Luo</span>
            <span className="appreciation-name">Yuxuan Zheng</span>
            <span className="appreciation-name">Ziyang Huang</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-divider"></div>
        <p className="footer-copyright">
          © {new Date().getFullYear()} HaJiMiBo South North Green Bean.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
