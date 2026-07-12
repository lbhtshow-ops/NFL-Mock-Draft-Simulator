"""
Imports data from CSV files into database.
"""


# Import necessary libraries
import csv, os
from backend.apps.models import Team, Player, DraftPick
from backend.database import SessionLocal

# Define folder containing the data files
DATA_FOLDER = os.path.join(os.path.dirname(__file__), "2026")

# Establish database session
session = SessionLocal()

# Read players from CSV file and add to database
with open(os.path.join(DATA_FOLDER, "players.csv"), newline="") as file:
    reader = csv.DictReader(file)
    for row in reader:
        player = Player(
            name=row["Name"],
            position=row["Position"],
            college=row["College"],
            rank=row["Rank"],
            year=row["Year"]
        )
        session.add(player)

# Read teams from CSV file and add to database
with open(os.path.join(DATA_FOLDER, "teams.csv"), newline="") as file:
    reader = csv.DictReader(file)
    for row in reader:
        team = Team(
            name=row["Name"],
            qb=row["QB"],
            rb=row["RB"],
            wr=row["WR"],
            te=row["TE"],
            ot=row["OT"],
            iol=row["IOL"],
            de=row["DE"],
            dt=row["DT"],
            lb=row["LB"],
            cb=row["CB"],
            s=row["S"],
            year=row["Year"]
        )
        session.add(team)

session.commit()

# Read draft picks from CSV file and add to database
with open(os.path.join(DATA_FOLDER, "draft_picks.csv"), newline="") as file:
    reader = csv.DictReader(file)
    for row in reader:
        current_team = session.query(Team).filter(
            Team.name == row["Current Team"],
            Team.year == int(row["Year"])
        ).first()
        original_team = session.query(Team).filter(
            Team.name == row["Original Team"],
            Team.year == int(row["Year"])
        ).first()

        draft_pick = DraftPick(
            round = row["Round"],
            pick_number = row["Pick Number"],
            current_team_id=current_team.id if current_team else None,
            original_team_id=original_team.id if original_team else None,
            year = row["Year"]
        )
        session.add(draft_pick)

session.commit()
session.close()
print("2026 data imported successfully.")