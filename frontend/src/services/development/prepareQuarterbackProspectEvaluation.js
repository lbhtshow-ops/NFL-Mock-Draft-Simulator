import { resolveProspect } from "../../data/draft/prospects/resolveProspect.js";
import { resolvePlayerContext } from "../../engines/context/PlayerContextResolver.js";
import { getProductionIntelligenceResult } from "../../engines/ProductionEngine.js";
import { getAthleticIntelligenceResult } from "../../engines/AthleticIntelligenceEngine.js";
import { getFootballIQIntelligenceResult } from "../../engines/FootballIQEngine.js";
import { getSchemeFitIntelligenceResult } from "../../engines/SchemeFitEngine.js";
import { getPlayerTraitIntelligenceResult } from "../../engines/PlayerTraitEngine.js";
import { readProspectIntelligenceSource } from "../../engines/playerEvaluation/prospectModels/shared/ProspectModelSourceAdapter.js";
import { evaluateQuarterbackProspect } from "../../engines/playerEvaluation/prospectModels/quarterback/QuarterbackProspectModel.js";
import {
  isProspectPositionModelResult,
  validateProspectPositionModelResult,
} from "../../engines/playerEvaluation/prospectModels/ProspectPositionModelContract.js";

const SOURCE_DOMAINS = Object.freeze({
  production: "production",
  athleticism: "athleticism",
  footballIQ: "footballIQ",
  schemeFit: "schemeFit",
  playerTraits: "playerTraits",
});

function emptyMap(value = null) {
  return {
    production: value,
    athleticism: value,
    footballIQ: value,
    schemeFit: value,
    playerTraits: value,
  };
}

function normalizeEntry(entry, fallbackCode = "ORCHESTRATION_VALIDATION") {
  return {
    code:
      typeof entry?.code === "string" && entry.code.trim()
        ? entry.code.trim()
        : fallbackCode,
    path: typeof entry?.path === "string" ? entry.path : "",
    message: typeof entry?.message === "string" ? entry.message : "",
  };
}

function deduplicateEntries(entries = []) {
  const seen = new Set();
  return entries.map((entry) => normalizeEntry(entry)).filter((entry) => {
    const key = `${entry.code}\u0000${entry.path}\u0000${entry.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeProspectSummary(player) {
  if (!player) return null;
  return {
    id: player.canonicalId || player.playerId || player.prospectId || player.id,
    name: player.displayName || player.name || player.player || null,
    position: player.displayPosition || player.position || null,
    school: player.displaySchool || player.school || player.college || null,
    draftClass:
      player.bio?.classYear || player.draftClass || player.classYear || null,
  };
}

function createFailure({ code, message, prospect = null, player = null, playerId = null, context = null, intelligence = null, adaptedSources = null, result = null, validation = null, details = null }) {
  const errors = deduplicateEntries(
    validation?.errors || [{ code, path: "orchestration", message }]
  );
  const warnings = deduplicateEntries(validation?.warnings || []);
  return {
    success: false,
    prospect,
    player,
    playerId,
    context,
    intelligence: intelligence || emptyMap(),
    adaptedSources: adaptedSources || emptyMap(),
    result,
    readiness: {
      status: "FAILED",
      missingRequirements: [],
      missingOptional: [],
    },
    coverage: {
      production: "INVALID",
      footballIQ: "INVALID",
      playerTraits: "INVALID",
      athleticIntelligence: "INVALID",
      schemeFit: "INVALID",
    },
    validation: { valid: false, errors, warnings },
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

function getCoverageStatus(source) {
  if (!source?.validShape || source?.validation?.valid === false) return "INVALID";
  if (!source.available) return "UNAVAILABLE";
  if (
    source.dataState === "INSUFFICIENT_SAMPLE" ||
    source.missingEvidence?.length > 0
  ) {
    return "PARTIAL";
  }
  if (source.usability?.usableForScore) return "AVAILABLE";
  if (source.value != null && source.usability?.usableForContext) return "AVAILABLE";
  if (source.usability?.usableForContext) return "PARTIAL";
  return "UNAVAILABLE";
}

function deriveCoverage(adaptedSources) {
  return {
    production: getCoverageStatus(adaptedSources.production),
    footballIQ: getCoverageStatus(adaptedSources.footballIQ),
    playerTraits: getCoverageStatus(adaptedSources.playerTraits),
    athleticIntelligence: getCoverageStatus(adaptedSources.athleticism),
    schemeFit: getCoverageStatus(adaptedSources.schemeFit),
  };
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))];
}

function deriveReadiness({ success, result }) {
  if (!success) {
    return { status: "FAILED", missingRequirements: [], missingOptional: [] };
  }

  const components = result?.components || {};
  const excluded = Array.isArray(result?.aggregation?.excludedComponents)
    ? result.aggregation.excludedComponents
    : [];
  const missingRequirements = uniqueStrings([
    ...(result?.aggregation?.criticalMissingComponents || []),
    ...Object.entries(components)
      .filter(([, component]) =>
        (component?.required || component?.critical) && !component?.available
      )
      .map(([key]) => key),
  ]);
  const optionalExcluded = excluded.filter(({ key }) => {
    const component = components[key];
    return !component?.required && !component?.critical;
  });
  const missingOptional = uniqueStrings(
    optionalExcluded.flatMap(({ key }) => [
      key,
      ...(components[key]?.missingEvidence || []),
    ])
  );

  if (!result?.available || typeof result?.overallGrade !== "number") {
    return { status: "NOT READY", missingRequirements, missingOptional };
  }

  if (optionalExcluded.length > 0 || result?.aggregation?.normalizationApplied) {
    return { status: "PARTIAL", missingRequirements, missingOptional };
  }

  return { status: "READY", missingRequirements, missingOptional };
}

export function prepareQuarterbackProspectEvaluation({
  prospect,
  includeDiagnostics = false,
} = {}) {
  if (!prospect || typeof prospect !== "object") {
    return createFailure({
      code: "INVALID_SERVICE_INPUT",
      message: "A prospect object is required for quarterback evaluation preparation.",
    });
  }

  try {
    const prospectId =
      prospect.canonicalId || prospect.playerId || prospect.prospectId || prospect.id;
    const player = resolveProspect(prospectId);

    if (!player) {
      return createFailure({
        code: "PROSPECT_RESOLUTION_FAILED",
        message: "The selected prospect could not be resolved.",
        prospect: normalizeProspectSummary(prospect),
      });
    }

    const playerId =
      player.canonicalId || player.playerId || player.prospectId || player.id;
    const prospectSummary = normalizeProspectSummary(player);
    const context = resolvePlayerContext(player);
    const engineOptions = { playerContext: context };
    const intelligence = {
      production: getProductionIntelligenceResult(player, engineOptions),
      athleticism: getAthleticIntelligenceResult(player, engineOptions),
      footballIQ: getFootballIQIntelligenceResult(player, engineOptions),
      schemeFit: getSchemeFitIntelligenceResult(player, engineOptions),
      playerTraits: getPlayerTraitIntelligenceResult(player, engineOptions),
    };
    const adaptedSources = Object.fromEntries(
      Object.entries(intelligence).map(([key, source]) => [
        key,
        readProspectIntelligenceSource(source, {
          expectedDomain: SOURCE_DOMAINS[key],
        }),
      ])
    );
    const result = evaluateQuarterbackProspect({
      player,
      playerId,
      position: "QB",
      context,
      intelligence,
      scouting: null,
      options: { includeDiagnostics },
    });
    const shallowValid = isProspectPositionModelResult(result);
    const fullValidation = validateProspectPositionModelResult(result);
    const validation = {
      valid: Boolean(shallowValid && fullValidation.valid),
      errors: deduplicateEntries(fullValidation.errors),
      warnings: deduplicateEntries(fullValidation.warnings),
    };

    if (!validation.valid) {
      return createFailure({
        code: "INVALID_QB_MODEL_RESULT",
        message: "Quarterback evaluation returned an invalid model result.",
        prospect: prospectSummary,
        player,
        playerId,
        context,
        intelligence,
        adaptedSources,
        result,
        validation,
      });
    }

    const success = true;
    return {
      success,
      prospect: prospectSummary,
      player,
      playerId,
      context,
      intelligence,
      adaptedSources,
      result,
      readiness: deriveReadiness({ success, result }),
      coverage: deriveCoverage(adaptedSources),
      validation,
      error: null,
    };
  } catch (error) {
    return createFailure({
      code: "QB_EVALUATION_ORCHESTRATION_FAILED",
      message: "Quarterback prospect evaluation preparation failed.",
      details:
        includeDiagnostics === true
          ? {
              name: typeof error?.name === "string" ? error.name : "Error",
              message:
                typeof error?.message === "string"
                  ? error.message
                  : "Quarterback evaluation preparation failed.",
            }
          : null,
    });
  }
}

export default { prepareQuarterbackProspectEvaluation };
