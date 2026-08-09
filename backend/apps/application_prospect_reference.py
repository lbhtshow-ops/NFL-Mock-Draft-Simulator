"""Application-layer prospect references for the mock-draft runtime.

These references are deterministic application identifiers used to bridge runtime player rows
into the Football Intelligence application catalog. They are explicitly non-canonical FID
identifiers. MDS-5B.4 adds an optional source-scoped discriminator so same-name prospects can
coexist without changing the existing references of already-materialized prospects.
"""

import re
import unicodedata
from typing import Optional

APPLICATION_PROSPECT_REFERENCE_AUTHORITY = "APPLICATION_REFERENCE_NON_CANONICAL"
APPLICATION_PROSPECT_REFERENCE_VERSION = "1.1"

# Temporary application-only disambiguation. These values do not claim canonical identity.
# The discriminator is source-scoped and is expected to be superseded by governed canonical
# FID identity when that production boundary is resumed later.
_APPLICATION_IDENTITY_DISAMBIGUATION = {
    (2027, "carter smith", "QB", "indiana"): "source-315",
    (2027, "jamari johnson", "CB", "oregon"): "source-335",
    (2027, "anthony smith", "DL", "minnesota"): "source-336",
}


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or "").strip().lower())
    ascii_value = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
    return slug


def create_application_prospect_ref(*, year: int, name: str, discriminator: Optional[str] = None) -> Optional[str]:
    """Return a deterministic non-canonical application prospect reference."""
    try:
        draft_year = int(year)
    except (TypeError, ValueError):
        return None

    slug = _slugify(name)
    if not slug:
        return None

    suffix = _slugify(discriminator) if discriminator else ""
    return f"app-prospect:{draft_year}:{slug}" + (f":{suffix}" if suffix else "")


def resolve_application_prospect_ref(*, year: int, name: str, position: Optional[str] = None, college: Optional[str] = None) -> Optional[str]:
    """Resolve the application reference from structured runtime identity when available."""
    try:
        draft_year = int(year)
    except (TypeError, ValueError):
        return None
    name_key = str(name or "").strip().lower()
    position_key = str(position or "").strip().upper()
    college_key = str(college or "").strip().lower()
    discriminator = _APPLICATION_IDENTITY_DISAMBIGUATION.get((draft_year, name_key, position_key, college_key))
    return create_application_prospect_ref(year=draft_year, name=name, discriminator=discriminator)
