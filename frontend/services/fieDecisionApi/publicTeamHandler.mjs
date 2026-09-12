import { buildPublicNFLTeamBundle, PUBLIC_NFL_TEAM_BUNDLE_CONTRACT, PUBLIC_NFL_TEAM_BUNDLE_VERSION } from "./publicTeamProjection.mjs";

const TEAM_ROUTE = /^\/v1\/nfl\/teams\/([A-Za-z]{2,3})$/;

function headers(allowedOrigin, cacheControl = "public, max-age=60, s-maxage=300, stale-while-revalidate=900") {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": allowedOrigin || "*",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Cache-Control": cacheControl,
  };
}

function response(statusCode, body, allowedOrigin, cacheControl) {
  return { statusCode, headers: headers(allowedOrigin, cacheControl), body };
}

export function createFiePublicNFLTeamHandler({ allowedOrigin = "*", buildTeamBundle = buildPublicNFLTeamBundle } = {}) {
  return async function publicNFLTeamHandler({ method, path } = {}) {
    if (method === "OPTIONS") return response(204, null, allowedOrigin, "no-store");
    if (method !== "GET") return response(405, { contract: "LBHTFIEPublicNFLTeamError", version: PUBLIC_NFL_TEAM_BUNDLE_VERSION, error: { code: "METHOD_NOT_ALLOWED", message: "GET is required for public NFL team requests." } }, allowedOrigin, "no-store");

    const match = TEAM_ROUTE.exec(path || "");
    if (!match) return response(404, { contract: "LBHTFIEPublicNFLTeamError", version: PUBLIC_NFL_TEAM_BUNDLE_VERSION, error: { code: "TEAM_ROUTE_NOT_FOUND", message: "Unknown public NFL team route." } }, allowedOrigin, "no-store");

    const team = match[1].toUpperCase();
    const bundle = buildTeamBundle(team, { season: 2026 });
    if (!bundle) return response(404, { contract: "LBHTFIEPublicNFLTeamError", version: PUBLIC_NFL_TEAM_BUNDLE_VERSION, error: { code: "TEAM_NOT_FOUND", message: `Canonical NFL team intelligence is unavailable for ${team}.` } }, allowedOrigin, "no-store");

    return response(200, { ...bundle, contract: PUBLIC_NFL_TEAM_BUNDLE_CONTRACT, version: PUBLIC_NFL_TEAM_BUNDLE_VERSION }, allowedOrigin);
  };
}

export default { createFiePublicNFLTeamHandler };
