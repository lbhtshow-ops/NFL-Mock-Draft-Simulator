"""
Defines CRUD operations for players, teams, draft picks, mock drafts, mock draft picks, and user-controlled teams in the PostgreSQL database using SQLAlchemy ORM.
"""


# Import necessary packages
from sqlalchemy.orm import Session
from sqlalchemy import text
from . import models, schemas


# Create player and add to database
def create_player(db: Session, player: schemas.PlayerCreate):
    db_player = models.Player(name=player.name, position=player.position, college=player.college, rank=player.rank, year=player.year)
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


# Retrieve player from database by ID
def get_player(db: Session, player_id: int):
    return db.query(models.Player).filter(models.Player.id == player_id).first()


# Retrieve all players from database, filtered by year with pagination support
def get_players(db: Session, year: int = 2025):
    return db.query(models.Player).filter(models.Player.year == year).all()


# Update player information in the database
def update_player(db: Session, player_id: int, player: schemas.PlayerUpdate):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if db_player.name:
        if player.name:
            db_player.name = player.name
        if player.position:
            db_player.position = player.position
        if player.college:
            db_player.college = player.college
        if player.rank:
            db_player.rank = player.rank
        if player.year:
            db_player.year = player.year
        db.commit()
        db.refresh(db_player)
    return db_player


# Delete player from database by ID
def delete_player(db: Session, player_id: int):
    db_player = db.query(models.Player).filter(models.Player.id == player_id).first()
    if db_player:
        db.delete(db_player)
        db.commit()
        return db_player
    return None


# Create team and add to database
def create_team(db: Session, team: schemas.TeamCreate):
    db_team = models.Team(name=team.name, qb=team.qb, rb=team.rb, wr=team.wr,te=team.te, ot=team.ot, iol=team.iol, de=team.de, dt=team.dt, lb=team.lb, cb=team.cb, s=team.s, year=team.year)
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


# Retrieve team from database by ID
def get_team(db: Session, team_id: int):
    return db.query(models.Team).filter(models.Team.id == team_id).first()


# Retrieve all teams from database from specified year, with pagination support
def get_teams(db: Session, year: int = 2026, skip: int = 0, limit: int = 32):
    return db.query(models.Team).filter(models.Team.year == year).order_by(models.Team.id).offset(skip).limit(limit).all()


# Update team information in the database
def update_team(db: Session, team_id: int, team: schemas.TeamUpdate):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if db_team:
        if team.name:
            db_team.name = team.name
        if team.qb:
            db_team.qb = team.qb
        if team.rb:
            db_team.rb = team.rb
        if team.wr:
            db_team.wr = team.wr
        if team.te:
            db_team.te = team.te
        if team.ot:
            db_team.ot = team.ot
        if team.iol:
            db_team.iol = team.iol
        if team.de:
            db_team.de = team.de
        if team.dt:
            db_team.dt = team.dt
        if team.lb:
            db_team.lb = team.lb
        if team.cb:
            db_team.cb = team.cb
        if team.s:
            db_team.s = team.s
        if team.year:
            db_team.year = team.year
        db.commit()
        db.refresh(db_team)
    return db_team


# Delete team from database by ID
def delete_team(db: Session, team_id: int):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if db_team:
        db.delete(db_team)
        db.commit()
        return db_team
    return None


# Create draft pick and add to database
def create_draft_pick(db: Session, draft_pick: schemas.DraftPickCreate):
    db_draft_pick = models.DraftPick(pick_number=draft_pick.pick_number, round=draft_pick.round, year=draft_pick.year, current_team_id=draft_pick.current_team_id, original_team_id=draft_pick.original_team_id)
    db.add(db_draft_pick)
    db.commit()
    db.refresh(db_draft_pick)
    return db_draft_pick


# Retrieve draft pick from database by ID
def get_draft_pick(db: Session, draft_pick_id: int):
    return db.query(models.DraftPick).filter(models.DraftPick.id == draft_pick_id).first()


# Retrieve all draft picks from database, with pagination support and optional year filter
def get_draft_picks(db: Session, year: int = None, skip: int = 0, limit: int = 300):
    query = db.query(models.DraftPick)
    if year:
        query = query.filter(models.DraftPick.year == year)
    return query.order_by(models.DraftPick.pick_number).offset(skip).limit(limit).all()


# Retrieve draft picks from database, filtered by round and year
def get_draft_picks_by_round(db: Session, num_rounds: int, year: int = 2026):
    return db.query(models.DraftPick).filter(models.DraftPick.round <= num_rounds, models.DraftPick.year == year).all()


# Update draft pick information in the database
def update_draft_pick(db: Session, draft_pick_id: int, draft_pick: schemas.DraftPickUpdate):
    db_draft_pick = db.query(models.DraftPick).filter(models.DraftPick.id == draft_pick_id).first()
    if db_draft_pick:
        if draft_pick.pick_number:
            db_draft_pick.pick_number = draft_pick.pick_number
        if draft_pick.round:
            db_draft_pick.round = draft_pick.round
        if draft_pick.year:
            db_draft_pick.year = draft_pick.year
        if draft_pick.current_team_id:
            db_draft_pick.current_team_id = draft_pick.current_team_id
        if draft_pick.original_team_id:
            db_draft_pick.original_team_id = draft_pick.original_team_id
        db.commit()
        db.refresh(db_draft_pick)
    return db_draft_pick


# Delete draft pick from database by ID
def delete_draft_pick(db: Session, draft_pick_id: int):
    db_draft_pick = db.query(models.DraftPick).filter(models.DraftPick.id == draft_pick_id).first()
    if db_draft_pick:
        db.delete(db_draft_pick)
        db.commit()
        return db_draft_pick
    return None


# Create mock draft and add to database
def create_mock_draft(db: Session, mock_draft: schemas.MockDraftCreate):
    db_mock_draft = models.MockDraft(name=mock_draft.name, num_rounds=mock_draft.num_rounds, year=mock_draft.year)
    db.add(db_mock_draft)
    db.commit()
    db.refresh(db_mock_draft)
    return db_mock_draft


# Retrieve mock draft from database by ID
def get_mock_draft(db: Session, mock_draft_id: int):
    return db.query(models.MockDraft).filter(models.MockDraft.id == mock_draft_id).first()


# Retrieve all mock drafts from database, with pagination support
def get_mock_drafts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.MockDraft).offset(skip).limit(limit).all()


# Update mock draft information in the database
def update_mock_draft(db: Session, mock_draft_id: int, mock_draft: schemas.MockDraftUpdate):
    db_mock_draft = db.query(models.MockDraft).filter(models.MockDraft.id == mock_draft_id).first()
    if db_mock_draft:
        if mock_draft.name:
            db_mock_draft.name = mock_draft.name
        if mock_draft.num_rounds:
            db_mock_draft.num_rounds = mock_draft.num_rounds
        if mock_draft.year:
            db_mock_draft.year = mock_draft.year
        db.commit()
        db.refresh(db_mock_draft)
    return db_mock_draft


# Delete mock draft from database by ID
def delete_mock_draft(db: Session, mock_draft_id: int):
    db_mock_draft = db.query(models.MockDraft).filter(models.MockDraft.id == mock_draft_id).first()
    if db_mock_draft:
        db.delete(db_mock_draft)
        db.commit()
        return db_mock_draft
    return None


# Create mock draft pick and add to database
def create_mock_draft_pick(db: Session, mock_draft_pick: schemas.MockDraftPickCreate):
    db_mock_draft_pick = models.MockDraftPick(mock_draft_id=mock_draft_pick.mock_draft_id, team_id=mock_draft_pick.team_id, draft_pick_id=mock_draft_pick.draft_pick_id, original_team_id=mock_draft_pick.original_team_id)
    db.add(db_mock_draft_pick)
    db.commit()
    db.refresh(db_mock_draft_pick)
    return db_mock_draft_pick


# Retrieve mock draft pick from database by ID
def get_mock_draft_pick(db: Session, mock_draft_pick_id: int):
    return db.query(models.MockDraftPick).filter(models.MockDraftPick.id == mock_draft_pick_id).first()


# Retrieve all mock draft picks for specified mock draft from database, with pagination support
def get_mock_draft_picks(db: Session, mock_draft_id: int, skip: int = 0, limit: int = 300):
    return db.query(models.MockDraftPick).filter(models.MockDraftPick.mock_draft_id == mock_draft_id).offset(skip).limit(limit).all()


# Update mock draft pick information in the database
def update_mock_draft_pick(db: Session, mock_draft_pick_id: int, mock_draft_pick: schemas.MockDraftPickUpdate):
    db_mock_draft_pick = db.query(models.MockDraftPick).filter(models.MockDraftPick.id == mock_draft_pick_id).first()
    if db_mock_draft_pick:
        if mock_draft_pick.mock_draft_id:
            db_mock_draft_pick.mock_draft_id = mock_draft_pick.mock_draft_id
        if mock_draft_pick.player_id:
            db_mock_draft_pick.player_id = mock_draft_pick.player_id
        if mock_draft_pick.team_id:
            db_mock_draft_pick.team_id = mock_draft_pick.team_id
        if mock_draft_pick.draft_pick_id:
            db_mock_draft_pick.draft_pick_id = mock_draft_pick.draft_pick_id
        if mock_draft_pick.original_team_id:
            db_mock_draft_pick.original_team_id = mock_draft_pick.original_team_id
        db.commit()
        db.refresh(db_mock_draft_pick)
    return db_mock_draft_pick


# Delete mock draft pick from database by ID
def delete_mock_draft_pick(db: Session, mock_draft_pick_id: int):
    db_mock_draft_pick = db.query(models.MockDraftPick).filter(models.MockDraftPick.id == mock_draft_pick_id).first()
    if db_mock_draft_pick:
        db.delete(db_mock_draft_pick)
        db.commit()
        return db_mock_draft_pick
    return None


# Create user-controlled team and add to database
def create_user_controlled_team(db: Session, user_controlled_team: schemas.UserControlledTeamCreate):
    db_user_controlled_team = models.UserControlledTeam(mock_draft_id=user_controlled_team.mock_draft_id, team_id=user_controlled_team.team_id)
    db.add(db_user_controlled_team)
    db.commit()
    db.refresh(db_user_controlled_team)
    return db_user_controlled_team


# Retrieve user-controlled team from database by ID
def get_user_controlled_team(db: Session, user_controlled_team_id: int):
    return db.query(models.UserControlledTeam).filter(models.UserControlledTeam.id == user_controlled_team_id).first()


# Retrieve all user-controlled teams for specified mock draft from database, with pagination support
def get_user_controlled_teams(db: Session, mock_draft_id: int, skip: int = 0, limit: int = 32):
    return db.query(models.UserControlledTeam).filter(models.UserControlledTeam.mock_draft_id == mock_draft_id).offset(skip).limit(limit).all()


# Update user-controlled team information in the database
def update_user_controlled_team(db: Session, user_controlled_team_id: int, user_controlled_team: schemas.UserControlledTeamUpdate):
    db_user_controlled_team = db.query(models.UserControlledTeam).filter(models.UserControlledTeam.id == user_controlled_team_id).first()
    if db_user_controlled_team:
        if user_controlled_team.mock_draft_id:
            db_user_controlled_team.mock_draft_id = user_controlled_team.mock_draft_id
        if user_controlled_team.team_id:
            db_user_controlled_team.team_id = user_controlled_team.team_id
        db.commit()
        db.refresh(db_user_controlled_team)
    return db_user_controlled_team


# Delete user-controlled team from database by ID
def delete_user_controlled_team(db: Session, user_controlled_team_id: int):
    db_user_controlled_team = db.query(models.UserControlledTeam).filter(models.UserControlledTeam.id == user_controlled_team_id).first()
    if db_user_controlled_team:
        db.delete(db_user_controlled_team)
        db.commit()
        return db_user_controlled_team
    return None