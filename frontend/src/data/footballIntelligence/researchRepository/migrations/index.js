export * from "./researchMigrationConstants.js";
export * from "./ResearchMigrationInputContract.js";
export * from "./ResearchMigrationBuilder.js";
export * from "./ResearchMigrationValidation.js";
export * from "./ResearchMigrationResultContract.js";

import constants from "./researchMigrationConstants.js";
import input from "./ResearchMigrationInputContract.js";
import builder from "./ResearchMigrationBuilder.js";
import validation from "./ResearchMigrationValidation.js";
import result from "./ResearchMigrationResultContract.js";
export default Object.freeze({ ...constants, ...input, ...builder, ...validation, ...result });
