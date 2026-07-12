import React from "react";

function LBHTCard({
  children,
  className = "",
  variant = "default",
  hover = false,
  onClick,
}) {
  const classes = [
    "lbht-card",
    `lbht-card--${variant}`,
    hover ? "lbht-card--hover" : "",
    onClick ? "lbht-card--clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
}

export default LBHTCard;