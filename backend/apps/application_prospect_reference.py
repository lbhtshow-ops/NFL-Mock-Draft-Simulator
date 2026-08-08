"""Application-layer prospect references for the mock-draft runtime.

These references are deterministic application identifiers used to bridge legacy runtime
player rows to the Football Intelligence application catalog. They are explicitly not
canonical FID identifiers and do not perform canonical identifier issuance.
"""

import re
import unicodedata
from typing import Optional

APPLICATION_PROSPECT_REFERENCE_AUTHORITY = "APPLICATION_REFERENCE_NON_CANONICAL"
APPLICATION_PROSPECT_REFERENCE_VERSION = "1.0"


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or "").strip().lower())
    ascii_value = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
    return slug


def create_application_prospect_ref(*, year: int, name: str) -> Optional[str]:
    """Return the deterministic non-canonical application prospect reference."""
    try:
        draft_year = int(year)
    except (TypeError, ValueError):
        return None

    slug = _slugify(name)
    if not slug:
        return None

    return f"app-prospect:{draft_year}:{slug}"
