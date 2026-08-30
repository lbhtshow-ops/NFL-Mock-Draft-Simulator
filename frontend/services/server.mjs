/**
 * Compatibility entrypoint for the LBHT Canonical FIE Decision API.
 *
 * The canonical runtime lives in ./fieDecisionApi/server.mjs.
 * Keep this file as a thin delegation layer so historical deployment commands
 * that still execute `node services/server.mjs` cannot bypass the canonical
 * production composition, Research Repository availability runtime,
 * forced-refresh behavior, or additive Decision API namespaces.
 */
import "./fieDecisionApi/server.mjs";
