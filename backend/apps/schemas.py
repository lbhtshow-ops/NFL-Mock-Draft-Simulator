"""
Defines Pydantic schemas for creating, reading, and updating players, teams, draft picks, mock drafts, mock draft picks, and user-controlled teams in the PostgreSQL database.
"""


# Import necessary packages and modules
from pydantic import BaseModel
from typing import Optional


# Pydantic schema to create Player
class PlayerCreate(BaseModel):
    name: str
    position: str
    college: str
    rank: int
    year: int


# Pydantic schema to read Player data
class PlayerBase(BaseModel):
    id: int
    name: str
    position: str
    college: str
    rank: int
    year: int

    class Config:
        from_attributes = True


# Pydantic schema to update Player data
class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    college: Optional[str] = None
    rank: Optional[int] = None
    year: Optional[int] = None


# Pydantic schema to create Team
class TeamCreate(BaseModel):
    name: str
    qb: int
    rb: int
    wr: int
    te: int
    ot: int
    iol: int
    de: int
    dt: int
    lb: int
    cb: int
    s: int
    year: int


# Pydantic schema to read Team data
class TeamBase(BaseModel):
    id: int
    name: str
    qb: int
    rb: int
    wr: int
    te: int
    ot: int
    iol: int
    de: int
    dt: int
    lb: int
    cb: int
    s: int
    year: int

    class Config:
        from_attributes = True


# Pydantic schema to update Team data
class TeamUpdate(BaseModel):
    name: Optional[str] = None
    qb: Optional[int] = None
    rb: Optional[int] = None
    wr: Optional[int] = None
    te: Optional[int] = None
    ot: Optional[int] = None
    iol: Optional[int] = None
    de: Optional[int] = None
    dt: Optional[int] = None
    lb: Optional[int] = None
    cb: Optional[int] = None
    s: Optional[int] = None
    year: Optional[int] = None


# Pydantic schema to create DraftPick
class DraftPickCreate(BaseModel):
    pick_number: int
    round: int
    year: int
    current_team_id: int
    original_team_id: int


# Pydantic schema to read DraftPick data
class DraftPickBase(BaseModel):
    id: int
    pick_number: int
    round: int
    year: int
    current_team_id: int
    original_team_id: int

    class Config:
        from_attributes = True


# Pydantic schema to update DraftPick data
class DraftPickUpdate(BaseModel):
    pick_number: Optional[int] = None
    round: Optional[int] = None
    year: Optional[int] = None
    current_team_id: Optional[int] = None
    original_team_id: Optional[int] = None


# Pydantic schema to create MockDraft
class MockDraftCreate(BaseModel):
    name: Optional[str] = "Mock Draft"
    num_rounds: int
    year: int


# Pydantic schema to read MockDraft data
class MockDraftBase(BaseModel):
    id: int
    name: str
    num_rounds: int
    year: int

    class Config:
        from_attributes = True


# Pydantic schema to update MockDraft data
class MockDraftUpdate(BaseModel):
    name: Optional[str] = None
    num_rounds: Optional[str] = None
    year: Optional[int] = None


# Pydantic schema to create MockDraftPick
class MockDraftPickCreate(BaseModel):
    mock_draft_id: int
    team_id: int
    draft_pick_id: int
    original_team_id: int


# Pydantic schema to read MockDraftPick data
class MockDraftPickBase(BaseModel):
    id: int
    mock_draft_id: int
    player_id: Optional[int]
    team_id: int
    draft_pick_id: int
    original_team_id: int

    draft_pick: DraftPickBase
    team: TeamBase
    player: Optional[PlayerBase]
    original_team: TeamBase

    class Config:
        from_attributes = True


# Pydantic schema to update MockDraftPick data
class MockDraftPickUpdate(BaseModel):
    mock_draft_id: Optional[int] = None
    player_id: Optional[int] = None
    team_id: Optional[int] = None
    draft_pick_id: Optional[int] = None
    original_team_id: Optional[int] = None


# Pydantic schema to create UserControlledTeam
class UserControlledTeamCreate(BaseModel):
    mock_draft_id: int
    team_id: int


# Pydantic schema to read UserControlledTeam data
class UserControlledTeamBase(BaseModel):
    id: int
    mock_draft_id: int
    team_id: int

    class Config:
        from_attributes = True


# Pydantic schema to update UserControlledTeam data
class UserControlledTeamUpdate(BaseModel):
    mock_draft_id: Optional[int] = None
    team_id: Optional[int] = None