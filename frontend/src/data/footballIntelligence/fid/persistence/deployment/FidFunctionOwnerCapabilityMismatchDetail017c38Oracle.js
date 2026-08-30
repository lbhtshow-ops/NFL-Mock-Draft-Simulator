import { AUTHORITATIVE_017C37_FIELD_ORDER, MANDATORY_017C38_ADDITIONS } from "./FidFunctionOwnerCapabilityMismatchDetail017c38ResultContract.js";

export function evaluate017c38ContractSolvability({ authoritativeOrder = AUTHORITATIVE_017C37_FIELD_ORDER, additions = MANDATORY_017C38_ADDITIONS, removals = [] } = {}) {
  const failures = [];
  if (authoritativeOrder.length !== 21) failures.push("authoritative_field_count_not_21");
  const absentAdditions = additions.filter((field) => !authoritativeOrder.includes(field));
  if (absentAdditions.length !== additions.length) failures.push("addition_set_not_independent");
  const resultingCount = authoritativeOrder.length + absentAdditions.length - removals.length;
  if (resultingCount !== 21) failures.push("exact_21_field_count_unsatisfied");
  if (removals.length === 0 && absentAdditions.length > 0) failures.push("replacement_or_removal_mapping_missing");
  for (const removal of removals) if (!authoritativeOrder.includes(removal)) failures.push(`invalid_removal_${removal}`);
  return Object.freeze({ solvable: failures.length === 0, authoritativeCount: authoritativeOrder.length,
    absentAdditions: Object.freeze(absentAdditions), removalsRequired: absentAdditions.length,
    specifiedRemovals: removals.length, resultingCount, failures: Object.freeze([...new Set(failures)]) });
}

export default evaluate017c38ContractSolvability;
