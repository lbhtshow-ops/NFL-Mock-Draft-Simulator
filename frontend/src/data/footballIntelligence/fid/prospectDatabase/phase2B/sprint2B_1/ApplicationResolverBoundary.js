import { fixtureResolver } from "./FixtureResolver.js";

export const ApplicationResolverBoundary = Object.freeze({
  resolveProspect(reference) { return fixtureResolver.resolve(reference); },
  resolveProspects(references) { return fixtureResolver.resolveMany(references); }
});

