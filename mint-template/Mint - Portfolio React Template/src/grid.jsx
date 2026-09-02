import React from "react";

/**
 * Mini-remplacement de react-flexbox-grid (abandonnée, incompatible React 19).
 * API conservée : <Row> et <Col xs sm md lg> avec 12 colonnes.
 */
const colClass = (prop, size) => (size ? `col-${prop}-${size}` : "");

export const Row = ({ className = "", children, ...rest }) => (
  <div className={`row ${className}`} {...rest}>
    {children}
  </div>
);

export const Col = ({ xs, sm, md, lg, className = "", children, ...rest }) => {
  const classes = [
    colClass("xs", xs),
    colClass("sm", sm),
    colClass("md", md),
    colClass("lg", lg),
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};
