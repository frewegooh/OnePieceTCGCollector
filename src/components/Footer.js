import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>© 2024 Long Live Nerds</p>
        <p>
        Long Live Nerds isn’t endorsed by Bandai, Toei Animation, or ©Eiichiro Oda/Shueisha and doesn’t reflect the views or opinions of Bandai or anyone officially involved in producing or managing One Piece TCG.
        </p>
        <p className='termsPrivacy'>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/privacy">Privacy Policy</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
