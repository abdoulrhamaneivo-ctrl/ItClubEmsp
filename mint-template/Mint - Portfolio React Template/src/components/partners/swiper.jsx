import React from "react";
// Grille responsive simple en remplacement du swiper (lib abandonnée).
// SCSS
import "./partners.scss";
// Components
import PartnerBox from "./partnerBox";
// Assets
import Partner01 from "../../assets/partners/partner01.svg";
import Partner02 from "../../assets/partners/partner02.svg";
import Partner03 from "../../assets/partners/partner03.svg";
import Partner04 from "../../assets/partners/partner04.svg";
import Partner05 from "../../assets/partners/partner05.svg";
import Partner06 from "../../assets/partners/partner06.svg";

const Partners = () => {
  const partners = [Partner01, Partner02, Partner03, Partner04, Partner05, Partner06];

  return (
    <div id="partners">
      <div className="wrapper partners-grid">
        {partners.map((preview, i) => (
          <div key={i}>
            <PartnerBox partner={preview} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Partners;
