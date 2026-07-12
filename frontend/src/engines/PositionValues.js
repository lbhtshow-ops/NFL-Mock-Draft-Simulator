export const positionValues = {
  QB: 1.35,
  OT: 1.18,
  DE: 1.18,
  WR: 1.12,
  CB: 1.12,
  DT: 1.05,
  IOL: 1.0,
  TE: 0.92,
  S: 0.88,
  LB: 0.85,
  RB: 0.78,
};

export const getPositionValue = (position) => {
  return positionValues[position] || 1;
};