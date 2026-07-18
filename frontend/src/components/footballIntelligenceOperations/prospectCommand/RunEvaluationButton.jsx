export default function RunEvaluationButton({
  disabled,
  isRunning,
  hasEvaluation,
  onRunEvaluation,
}) {
  return (
    <button
      className="fio-run-evaluation"
      type="button"
      disabled={disabled}
      onClick={onRunEvaluation}
    >
      {isRunning
        ? "Running Evaluation…"
        : hasEvaluation
        ? "Re-run Evaluation"
        : "Run Evaluation"}
    </button>
  );
}
