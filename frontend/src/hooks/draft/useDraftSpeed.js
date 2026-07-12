import { useState } from "react";

const draftSpeedSettings = {
  slow: {
    label: "Slow",
    delay: 2000,
  },
  normal: {
    label: "Normal",
    delay: 1000,
  },
  fast: {
    label: "Fast",
    delay: 300,
  },
};

export default function useDraftSpeed(defaultSpeed = "normal") {
  const [draftSpeed, setDraftSpeed] = useState(defaultSpeed);

  const activeDraftSpeed =
    draftSpeedSettings[draftSpeed] || draftSpeedSettings.normal;

  return {
    draftSpeed,
    setDraftSpeed,
    activeDraftSpeed,
    draftSpeedSettings,
  };
}