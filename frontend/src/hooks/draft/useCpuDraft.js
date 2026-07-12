import { useEffect } from "react";

export default function useCpuDraft({
  currentPick,
  isUserPick,
  availableProspects = [],
  cpuDelay = 1000,
  onCpuPick,
}) {
  useEffect(() => {
    if (isUserPick || !currentPick || !availableProspects.length) {
      return;
    }

    const cpuPickTimer = setTimeout(() => {
      onCpuPick?.();
    }, cpuDelay);

    return () => clearTimeout(cpuPickTimer);
  }, [
    currentPick,
    isUserPick,
    availableProspects.length,
    cpuDelay,
    onCpuPick,
  ]);
}