"""2027 application-facing development prospect projection.

This module intentionally does not represent canonical FID persistence. It exposes the
latest repository-approved Phase 2A.3C preparation/enrichment cohort to the legacy draft
runtime so product work can continue while REF / Sprint 17C remains paused.
"""

PROJECTION_VERSION = "2027-dev-cohort-2a3c-v2"
PROJECTION_STATUS = "DEVELOPMENT_FIXTURE_PROJECTION"
PROJECTION_SOURCE = "FID_2027_PREPARATION_ENRICHMENT_COHORT_2A3C"
PROJECTION_TEMPORAL_REFERENCE = "2026-08-03"

# Ordering remains an application-development ordering only. It is not an LBHT Big Board,
# player evaluation, consensus ranking, or Draft Intelligence recommendation.
# Program/position fields below mirror the latest 2A.3C repository preparation records.
PROSPECTS_2027 = (
    {"name": "DJ Lagway", "position": "QB", "college": "Baylor"},
    {"name": "Dylan Raiola", "position": "QB", "college": "Oregon"},
    {"name": "Jordan Seaton", "position": "OT", "college": "LSU"},
    {"name": "Brandon Baker", "position": "OT", "college": "Texas"},
    {"name": "Jeremiah Smith", "position": "WR", "college": "Ohio State"},
    {"name": "Cam Coleman", "position": "WR", "college": "Texas"},
    {"name": "Nate Frazier", "position": "RB", "college": "Georgia"},
    {"name": "Caden Durham", "position": "RB", "college": "LSU"},
    {"name": "Colin Simmons", "position": "EDGE", "college": "Texas"},
    {"name": "Dylan Stewart", "position": "EDGE", "college": "South Carolina"},
    {"name": "Kam Franklin", "position": "DE", "college": "Ole Miss"},
    {"name": "KJ Bolden", "position": "DB", "college": "Georgia"},
    {"name": "Zabien Brown", "position": "DB", "college": "Alabama"},
    {"name": "Koi Perich", "position": "DB", "college": "Minnesota"},
    {"name": "Sammy Brown", "position": "LB", "college": "Clemson"},
    {"name": "Caleb Odom", "position": "TE", "college": "Ole Miss"},
)


def projection_rows():
    """Return legacy-runtime player rows for the bounded development projection."""
    return [
        {
            "name": prospect["name"],
            "position": prospect["position"],
            "college": prospect["college"],
            "rank": index,
            "year": 2027,
        }
        for index, prospect in enumerate(PROSPECTS_2027, start=1)
    ]
