import http from "node:http";

import {
  createFieDecisionApiHandler,
} from "./handler.mjs";

import { createFieDecisionProductionComposition } from "./productionComposition.mjs";
import { createLE3JProductionConsumerAcceptanceFixture } from "./le3jAcceptanceFixture.mjs";
import { createFieV2C3ShadowComposition } from "./shadowComposition.mjs";
import { createFieV2C3ShadowHandler } from "./shadowHandler.mjs";
import { createFiePublicNFLTeamHandler } from "./publicTeamHandler.mjs";

const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.FIE_API_ALLOWED_ORIGIN || "*";

const acceptanceFixture = createLE3JProductionConsumerAcceptanceFixture();
const production = createFieDecisionProductionComposition({
  acceptanceFixture,
});

const shadow = createFieV2C3ShadowComposition();
const shadowHandler = createFieV2C3ShadowHandler({
  getShadowDecision: shadow.getShadowDecision,
  shadowToken: process.env.FIE_V2_C3_SHADOW_TOKEN || "",
  allowedOrigin,
});

const publicTeamHandler = createFiePublicNFLTeamHandler({
  allowedOrigin,
});
const acceptanceController = Object.freeze({
  authorize: acceptanceFixture.authorize,
  status: acceptanceFixture.status,
  activate: () => acceptanceFixture.activate({ production }),
  deactivate: acceptanceFixture.deactivate,
});

const handler = createFieDecisionApiHandler({
  buildMatchup: production.buildMatchup,
  getDecision: production.getDecision,
  acceptanceController,
  allowedOrigin,
});

const readJson = (req) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        reject(new Error("Request body exceeds 1 MB."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      if (!chunks.length) return resolve(null);
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });

    req.on("error", reject);
  });

http
  .createServer(async (req, res) => {
    try {
      const body = req.method === "POST" ? await readJson(req) : null;
      const path = new URL(req.url, `http://${req.headers.host || "localhost"}`).pathname;
      const out = path === "/internal/shadow/v2/c3/game-decisions"
        ? await shadowHandler({ method: req.method, path, body, headers: req.headers })
        : path.startsWith("/v1/nfl/teams/")
          ? await publicTeamHandler({ method: req.method, path, headers: req.headers })
          : await handler({ method: req.method, path, body });
      res.writeHead(out.statusCode, out.headers);
      res.end(out.body === null ? "" : JSON.stringify(out.body));
    } catch (error) {
      res.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": allowedOrigin,
        "Cache-Control": "no-store",
      });
      res.end(
        JSON.stringify({
          contract: "LBHTFIEDecisionApiError",
          version: "1.0.0",
          error: {
            code: "INTERNAL_ERROR",
            message: error.message,
          },
        })
      );
    }
  })
  .listen(port, "0.0.0.0", () =>
    console.log(`LBHT Canonical FIE Decision API listening on 0.0.0.0:${port}`)
  );
