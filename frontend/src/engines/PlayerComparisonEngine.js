function normalizePosition(position = "") {
  return position.toUpperCase();
}

const comparisonProfiles = {
  QB: {
    highEnd: "Modern Franchise Quarterback",
    starter: "NFL Starting Quarterback",
    developmental: "Developmental Starting Quarterback",
  },

  RB: {
    highEnd: "Explosive Three-Down Running Back",
    starter: "Starting NFL Running Back",
    developmental: "Rotational Offensive Weapon",
  },

  WR: {
    highEnd: "Primary NFL Receiving Threat",
    starter: "Starting NFL Wide Receiver",
    developmental: "Developmental Receiving Weapon",
  },

  TE: {
    highEnd: "Complete NFL Tight End",
    starter: "Starting NFL Tight End",
    developmental: "Developmental Move Tight End",
  },

  OT: {
    highEnd: "Pro Bowl Offensive Tackle",
    starter: "Starting NFL Offensive Tackle",
    developmental: "Developmental Swing Tackle",
  },

  IOL: {
    highEnd: "Pro Bowl Interior Offensive Lineman",
    starter: "Starting Interior Offensive Lineman",
    developmental: "Developmental Interior Lineman",
  },

  DL: {
    highEnd: "Impact Interior Defensive Lineman",
    starter: "Starting Defensive Lineman",
    developmental: "Rotational Defensive Lineman",
  },

  DT: {
    highEnd: "Impact Interior Defensive Lineman",
    starter: "Starting Defensive Tackle",
    developmental: "Rotational Defensive Tackle",
  },

  EDGE: {
    highEnd: "Pro Bowl Edge Rusher",
    starter: "Starting NFL Edge Defender",
    developmental: "Rotational Pass Rusher",
  },

  LB: {
    highEnd: "Three-Down NFL Linebacker",
    starter: "Starting NFL Linebacker",
    developmental: "Developmental Linebacker",
  },

  CB: {
    highEnd: "Shutdown Cornerback",
    starter: "Starting NFL Cornerback",
    developmental: "Developmental Coverage Defender",
  },

  S: {
    highEnd: "All-Pro Safety",
    starter: "Starting NFL Safety",
    developmental: "Versatile Defensive Back",
  },
};

function getComparisonTier(grade = 0) {
  if (grade >= 94) return "highEnd";
  if (grade >= 88) return "starter";
  return "developmental";
}

export function getPlayerComparison(player = {}, evaluation = {}) {
  const position = normalizePosition(player?.position || evaluation?.position);
  const grade = evaluation?.overallGrade || evaluation?.grade || 0;

  const profile = comparisonProfiles[position];

  if (!profile) {
    return "NFL Draft Prospect";
  }

  const tier = getComparisonTier(grade);

  return profile[tier] || profile.starter;
}

export default {
  getPlayerComparison,
};