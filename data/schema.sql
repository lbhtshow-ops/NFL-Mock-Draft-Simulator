/*
    * Defines schema for PostgreSQL database.
*/


-- Create table for players
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(100) NOT NULL,
    position VARCHAR(10) NOT NULL,
    college VARCHAR(100) NOT NULL,
    rank INTEGER NOT NULL,
    year INTEGER NOT NULL
);


-- Create table for teams
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    qb INTEGER NOT NULL,
    rb INTEGER NOT NULL,
    wr INTEGER NOT NULL,
    ot INTEGER NOT NULL,
    iol INTEGER NOT NULL,
    de INTEGER NOT NULL,
    dt INTEGER NOT NULL,
    lb INTEGER NOT NULL,
    cb INTEGER NOT NULL,
    s INTEGER NOT NULL,
    year INTEGER NOT NULL
);


-- Create table for draft picks
CREATE TABLE draft_picks (
    id SERIAL PRIMARY KEY,
    pick_number INTEGER NOT NULL,
    round INTEGER NOT NULL,
    year INTEGER NOT NULL,
    current_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    original_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
);


-- Create table for mock drafts
CREATE TABLE mock_drafts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) DEFAULT "Mock Draft",
    num_rounds INTEGER NOT NULL,
    year INTEGER NOT NULL
);


-- Create table for mock draft picks
CREATE TABLE mock_draft_picks (
    id SERIAL PRIMARY KEY,
    mock_draft_id INTEGER NOT NULL REFERENCES mock_drafts(id) ON DELETE CASCADE,
    player_id INTEGER NULL REFERENCES players(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    draft_pick_id INTEGER NOT NULL REFERENCES draft_picks(id) ON DELETE CASCADE
    original_team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE
);


-- Create table for user-controlled teams
CREATE TABLE user_controlled_teams (
    id SERIAL PRIMARY KEY,
    mock_draft_id INTEGER NOT NULL REFERENCES mock_drafts(id) ON DELETE CASCADE,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
);