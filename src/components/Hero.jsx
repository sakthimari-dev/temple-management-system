import React from "react";
import { Link } from "react-router-dom";
import templeImage from "../assets/temple.png";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">

      <div className="hero-container">

        {/* LEFT CONTENT */}
        <div className="hero-content">

          <p className="hero-subtitle">
            WELCOME TO THE SACRED TEMPLE
          </p>

          <div className="hero-line"></div>


          <h1 className="hero-title">
            ஸ்ரீ சித்தி விநாயகர்
            <br />
          திருக்கோயில்
          </h1>

          <p className="hero-description">
        "திருநெல்வேலி மாவட்டம், அம்பாசமுத்திரம், கல்லூரி சாலையில் அமைந்துள்ள அருள்மிகு விநாயகர் திருக்கோவில். பக்தர்கள் ஆன்மிக அமைதியையும், விநாயகப் பெருமானின் அருளாசியையும் பெற தரிசிக்கும் புனித ஆலயம்." 🙏
          </p>

       <div className="hero-buttons">

  <Link to="/dashboard" className="hero-btn primary-btn">
    கோவில் வரலாறு
  </Link>

  <Link to="/expenses" className="hero-btn secondary-btn">
    காணிக்கை
  </Link>

</div>

        </div>

        {/* RIGHT IMAGE */}

        <div className="hero-image">

          <img
            src={templeImage}
            alt="Temple"
          />

          <div className="image-overlay"></div>

        </div>

      </div>

    </section>
  );
}