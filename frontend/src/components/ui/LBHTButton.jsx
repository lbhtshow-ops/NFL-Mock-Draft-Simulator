import React from "react";

function LBHTButton({
  children,
  className = "",
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
}) {
  const classes = [
    "lbht-button",
    `lbht-button--${variant}`,
    `lbht-button--${size}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default LBHTButton;