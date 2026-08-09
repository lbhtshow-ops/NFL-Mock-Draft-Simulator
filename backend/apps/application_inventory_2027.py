"""Application/runtime materialization snapshot for the 2027 prospect catalog.

This module mirrors the currently approved 240-entry Application Prospect Inventory into
Python so the legacy FastAPI/SQLAlchemy runtime can materialize draftable Player rows.
It is an application runtime bridge, not canonical FID persistence, not an LBHT Big Board,
and not Draft Intelligence scoring.

Enriched Phase 2A.3C projection rows retain precedence over overlapping base-inventory
rows. Remaining base-profile prospects are appended in source-provenance order solely to
produce a deterministic legacy runtime ordering.
"""

from typing import Dict, List, Tuple

from .application_projection_2027 import PROSPECTS_2027
from .application_prospect_reference import create_application_prospect_ref

RUNTIME_INVENTORY_CONTRACT_VERSION = "1.0.0"
RUNTIME_INVENTORY_VERSION = "2027-application-catalog-240-v1"
RUNTIME_INVENTORY_STATUS = "APPLICATION_CATALOG_RUNTIME_MATERIALIZATION"
RUNTIME_INVENTORY_SOURCE = "APPLICATION_PROSPECT_CATALOG_2027_BASE_240_PLUS_ENRICHED_2A3C"
RUNTIME_INVENTORY_SOURCE_ORDINAL_AUTHORITY = "PROVENANCE_ONLY_NOT_LBHT_RANK"
RUNTIME_RANK_AUTHORITY = "LEGACY_RUNTIME_ORDER_ONLY_NOT_LBHT_RANK"
RUNTIME_INVENTORY_DRAFT_YEAR = 2027

BASE_INVENTORY_2027 = (
    {'source_ordinal': 1, 'name': 'Jeremiah Smith', 'position': 'WR', 'college': 'Ohio State'},
    {'source_ordinal': 2, 'name': 'Dante Moore', 'position': 'QB', 'college': 'Oregon'},
    {'source_ordinal': 3, 'name': 'Julian Sayin', 'position': 'QB', 'college': 'Ohio State'},
    {'source_ordinal': 4, 'name': 'Arch Manning', 'position': 'QB', 'college': 'Texas'},
    {'source_ordinal': 5, 'name': 'Colin Simmons', 'position': 'EDGE', 'college': 'Texas'},
    {'source_ordinal': 6, 'name': 'Kyngstonn Viliamu-Asa', 'position': 'LB', 'college': 'Notre Dame'},
    {'source_ordinal': 7, 'name': 'Leonard Moore', 'position': 'CB', 'college': 'Notre Dame'},
    {'source_ordinal': 8, 'name': 'Carter Smith', 'position': 'OT', 'college': 'Indiana'},
    {'source_ordinal': 9, 'name': 'KJ Bolden', 'position': 'S', 'college': 'Georgia'},
    {'source_ordinal': 10, 'name': 'David Stone', 'position': 'DT', 'college': 'Oklahoma'},
    {'source_ordinal': 11, 'name': 'Drew Mestemaker', 'position': 'QB', 'college': 'Oklahoma State'},
    {'source_ordinal': 12, 'name': 'Matayo Uiagalelei', 'position': 'EDGE', 'college': 'Oregon'},
    {'source_ordinal': 13, 'name': 'Cayden Green', 'position': 'OT', 'college': 'Missouri'},
    {'source_ordinal': 14, 'name': 'CJ Carr', 'position': 'QB', 'college': 'Notre Dame'},
    {'source_ordinal': 15, 'name': 'Ellis Robinson IV', 'position': 'CB', 'college': 'Georgia'},
    {'source_ordinal': 16, 'name': 'Dylan Stewart', 'position': 'EDGE', 'college': 'South Carolina'},
    {'source_ordinal': 17, 'name': 'Will Echoles', 'position': 'DT', 'college': 'Ole Miss'},
    {'source_ordinal': 18, 'name': 'Damon Wilson II', 'position': 'EDGE', 'college': 'Miami'},
    {'source_ordinal': 19, 'name': 'Ahmad Hardy', 'position': 'RB', 'college': 'Missouri'},
    {'source_ordinal': 20, 'name': "Trey'Dez Green", 'position': 'TE', 'college': 'LSU'},
    {'source_ordinal': 21, 'name': 'Justin Scott', 'position': 'DT', 'college': 'Miami'},
    {'source_ordinal': 22, 'name': 'Zabien Brown', 'position': 'CB', 'college': 'Alabama'},
    {'source_ordinal': 23, 'name': 'Suntarine Perkins', 'position': 'EDGE', 'college': 'Ole Miss'},
    {'source_ordinal': 24, 'name': 'Cam Coleman', 'position': 'WR', 'college': 'Texas'},
    {'source_ordinal': 25, 'name': 'PJ Williams', 'position': 'OT', 'college': 'SMU'},
    {'source_ordinal': 26, 'name': 'Duce Robinson', 'position': 'WR', 'college': 'Florida State'},
    {'source_ordinal': 27, 'name': 'Chris Cole', 'position': 'LB', 'college': 'Georgia'},
    {'source_ordinal': 28, 'name': 'Trevor Goosby', 'position': 'OT', 'college': 'Texas'},
    {'source_ordinal': 29, 'name': 'Austin Siereveld', 'position': 'OT', 'college': 'Ohio State'},
    {'source_ordinal': 30, 'name': 'Tae Johnson', 'position': 'S', 'college': 'Notre Dame'},
    {'source_ordinal': 31, 'name': 'Dashawn Spears', 'position': 'S', 'college': 'LSU'},
    {'source_ordinal': 32, 'name': 'Jamari Johnson', 'position': 'TE', 'college': 'Oregon'},
    {'source_ordinal': 33, 'name': 'John Henry Daley', 'position': 'EDGE', 'college': 'Michigan'},
    {'source_ordinal': 34, 'name': 'Nate Frazier', 'position': 'RB', 'college': 'Georgia'},
    {'source_ordinal': 35, 'name': 'Mark Fletcher Jr.', 'position': 'RB', 'college': 'Miami'},
    {'source_ordinal': 36, 'name': 'Clev Lubin', 'position': 'EDGE', 'college': 'Louisville'},
    {'source_ordinal': 37, 'name': "A'Mauri Washington", 'position': 'DT', 'college': 'Oregon'},
    {'source_ordinal': 38, 'name': 'Brendan Sorsby', 'position': 'QB', 'college': 'Texas Tech'},
    {'source_ordinal': 39, 'name': 'KJ Duff', 'position': 'WR', 'college': 'Rutgers'},
    {'source_ordinal': 40, 'name': 'Jordan Ross', 'position': 'EDGE', 'college': 'LSU'},
    {'source_ordinal': 41, 'name': 'Chris Peal', 'position': 'CB', 'college': 'Syracuse'},
    {'source_ordinal': 42, 'name': 'Teitum Tuioti', 'position': 'EDGE', 'college': 'Oregon'},
    {'source_ordinal': 43, 'name': 'Jordan Seaton', 'position': 'OT', 'college': 'LSU'},
    {'source_ordinal': 44, 'name': 'Brice Pollock', 'position': 'CB', 'college': 'Texas Tech'},
    {'source_ordinal': 45, 'name': 'Ryan Coleman-Williams', 'position': 'WR', 'college': 'Alabama'},
    {'source_ordinal': 46, 'name': 'Yhonzae Pierre', 'position': 'EDGE', 'college': 'Alabama'},
    {'source_ordinal': 47, 'name': 'Boubacar Traore', 'position': 'EDGE', 'college': 'Notre Dame'},
    {'source_ordinal': 48, 'name': 'Rasheem Biles', 'position': 'LB', 'college': 'Texas'},
    {'source_ordinal': 49, 'name': 'Ryan Wingo', 'position': 'WR', 'college': 'Texas'},
    {'source_ordinal': 50, 'name': 'Wyatt Young', 'position': 'WR', 'college': 'Oklahoma State'},
    {'source_ordinal': 51, 'name': 'T.J. Moore', 'position': 'WR', 'college': 'Clemson'},
    {'source_ordinal': 52, 'name': 'Trevor Lauck', 'position': 'OT', 'college': 'Iowa'},
    {'source_ordinal': 53, 'name': 'Keon Sabb', 'position': 'S', 'college': 'Alabama'},
    {'source_ordinal': 54, 'name': 'Bryant Wesco Jr.', 'position': 'WR', 'college': 'Clemson'},
    {'source_ordinal': 55, 'name': 'Mario Craver', 'position': 'WR', 'college': 'Texas A&M'},
    {'source_ordinal': 56, 'name': 'Ben Roberts', 'position': 'LB', 'college': 'Texas Tech'},
    {'source_ordinal': 57, 'name': 'Bray Hubbard', 'position': 'S', 'college': 'Alabama'},
    {'source_ordinal': 58, 'name': 'Sammy Brown', 'position': 'LB', 'college': 'Clemson'},
    {'source_ordinal': 59, 'name': 'Omarion Miller', 'position': 'WR', 'college': 'Arizona State'},
    {'source_ordinal': 60, 'name': 'Jelani McDonald', 'position': 'S', 'college': 'Texas'},
    {'source_ordinal': 61, 'name': 'Peyton Bowen', 'position': 'S', 'college': 'Oklahoma'},
    {'source_ordinal': 62, 'name': 'Terry Moore', 'position': 'S', 'college': 'Ohio State'},
    {'source_ordinal': 63, 'name': 'Charlie Becker', 'position': 'WR', 'college': 'Indiana'},
    {'source_ordinal': 64, 'name': 'Kenyatta Jackson Jr.', 'position': 'EDGE', 'college': 'Ohio State'},
    {'source_ordinal': 65, 'name': 'Lance Heard', 'position': 'OT', 'college': 'Kentucky'},
    {'source_ordinal': 66, 'name': 'Samson Okunlola', 'position': 'OG', 'college': 'Miami'},
    {'source_ordinal': 67, 'name': 'Jadan Baugh', 'position': 'RB', 'college': 'Florida'},
    {'source_ordinal': 68, 'name': 'Jamari Sharpe', 'position': 'CB', 'college': 'Indiana'},
    {'source_ordinal': 69, 'name': 'Solomon Tuliaupupu', 'position': 'EDGE', 'college': 'Montana'},
    {'source_ordinal': 70, 'name': 'Andrew Sprague', 'position': 'OT', 'college': 'Michigan'},
    {'source_ordinal': 71, 'name': 'Jyaire Hill', 'position': 'CB', 'college': 'Michigan'},
    {'source_ordinal': 72, 'name': 'Kewan Lacy', 'position': 'RB', 'college': 'Ole Miss'},
    {'source_ordinal': 73, 'name': 'Kelley Jones', 'position': 'CB', 'college': 'Mississippi State'},
    {'source_ordinal': 74, 'name': 'Jacarrius Peak', 'position': 'OT', 'college': 'South Carolina'},
    {'source_ordinal': 75, 'name': 'Will Heldt', 'position': 'EDGE', 'college': 'Clemson'},
    {'source_ordinal': 76, 'name': 'Nick Marsh', 'position': 'WR', 'college': 'Indiana'},
    {'source_ordinal': 77, 'name': 'Princewill Umanmielen', 'position': 'EDGE', 'college': 'LSU'},
    {'source_ordinal': 78, 'name': 'Raleek Brown', 'position': 'RB', 'college': 'Texas'},
    {'source_ordinal': 79, 'name': 'Luke Montgomery', 'position': 'OG', 'college': 'Ohio State'},
    {'source_ordinal': 80, 'name': 'Peter Clarke', 'position': 'TE', 'college': 'Temple'},
    {'source_ordinal': 81, 'name': 'Adam Trick', 'position': 'EDGE', 'college': 'Texas Tech'},
    {'source_ordinal': 82, 'name': 'Faletau Satuala', 'position': 'S', 'college': 'BYU'},
    {'source_ordinal': 83, 'name': 'Bear Alexander', 'position': 'DT', 'college': 'Oregon'},
    {'source_ordinal': 84, 'name': 'Brandon Baker', 'position': 'OT', 'college': 'Texas'},
    {'source_ordinal': 85, 'name': 'Braylon Staley', 'position': 'WR', 'college': 'Tennessee'},
    {'source_ordinal': 86, 'name': 'Darian Mensah', 'position': 'QB', 'college': 'Miami'},
    {'source_ordinal': 87, 'name': 'Raylen Wilson', 'position': 'LB', 'college': 'Georgia'},
    {'source_ordinal': 88, 'name': 'Quincy Rhodes Jr.', 'position': 'EDGE', 'college': 'Arkansas'},
    {'source_ordinal': 89, 'name': 'Kade Pieper', 'position': 'OG', 'college': 'Iowa'},
    {'source_ordinal': 90, 'name': 'Evan Tengesdahl', 'position': 'OG', 'college': 'Cincinnati'},
    {'source_ordinal': 91, 'name': 'Nyck Harbor', 'position': 'WR', 'college': 'South Carolina'},
    {'source_ordinal': 92, 'name': 'Josh Hoover', 'position': 'QB', 'college': 'Indiana'},
    {'source_ordinal': 93, 'name': 'Ian Strong', 'position': 'WR', 'college': 'California'},
    {'source_ordinal': 94, 'name': 'Ahmad Moten Sr.', 'position': 'DL', 'college': 'Miami'},
    {'source_ordinal': 95, 'name': 'Marcus Neal Jr.', 'position': 'S', 'college': 'Penn State'},
    {'source_ordinal': 96, 'name': 'Anthony Smith', 'position': 'EDGE', 'college': 'Minnesota'},
    {'source_ordinal': 97, 'name': 'Corey Myrick', 'position': 'S', 'college': 'Clemson'},
    {'source_ordinal': 98, 'name': 'Nico Iamaleava', 'position': 'QB', 'college': 'UCLA'},
    {'source_ordinal': 99, 'name': 'Terrance Carter Jr.', 'position': 'TE', 'college': 'Texas Tech'},
    {'source_ordinal': 100, 'name': 'DJ Lagway', 'position': 'QB', 'college': 'Baylor'},
    {'source_ordinal': 101, 'name': 'Jayden Maiava', 'position': 'QB', 'college': 'USC'},
    {'source_ordinal': 102, 'name': 'LJ Martin', 'position': 'RB', 'college': 'BYU'},
    {'source_ordinal': 103, 'name': 'Iapani Laloulu', 'position': 'C', 'college': 'Oregon'},
    {'source_ordinal': 104, 'name': 'Antwan Raymond', 'position': 'RB', 'college': 'Rutgers'},
    {'source_ordinal': 105, 'name': 'Earl Little Jr.', 'position': 'S', 'college': 'Ohio State'},
    {'source_ordinal': 106, 'name': 'Greg Johnson', 'position': 'OG', 'college': 'Minnesota'},
    {'source_ordinal': 107, 'name': 'Trinidad Chambliss', 'position': 'QB', 'college': 'Ole Miss'},
    {'source_ordinal': 108, 'name': 'Anto Saka', 'position': 'EDGE', 'college': 'Texas A&M'},
    {'source_ordinal': 109, 'name': 'Dylan Raiola', 'position': 'QB', 'college': 'Oregon'},
    {'source_ordinal': 110, 'name': 'Anthonie Knapp', 'position': 'OT', 'college': 'Notre Dame'},
    {'source_ordinal': 111, 'name': 'Mike Matthews', 'position': 'WR', 'college': 'Tennessee'},
    {'source_ordinal': 112, 'name': 'Adon Shuler', 'position': 'S', 'college': 'Notre Dame'},
    {'source_ordinal': 113, 'name': 'Myles Graham', 'position': 'LB', 'college': 'Florida'},
    {'source_ordinal': 114, 'name': 'Sam Leavitt', 'position': 'QB', 'college': 'LSU'},
    {'source_ordinal': 115, 'name': 'Cooper Barkate', 'position': 'WR', 'college': 'Miami'},
    {'source_ordinal': 116, 'name': 'Ashton Hampton', 'position': 'CB', 'college': 'Clemson'},
    {'source_ordinal': 117, 'name': 'Zach Lutmer', 'position': 'CB', 'college': 'Iowa'},
    {'source_ordinal': 118, 'name': 'Williams Nwaneri', 'position': 'EDGE', 'college': 'Nebraska'},
    {'source_ordinal': 119, 'name': 'Devin McCuin', 'position': 'WR', 'college': 'Ohio State'},
    {'source_ordinal': 120, 'name': 'Jayden Jackson', 'position': 'DT', 'college': 'Oklahoma'},
    {'source_ordinal': 121, 'name': 'Jaylen McClain', 'position': 'S', 'college': 'Ohio State'},
    {'source_ordinal': 122, 'name': 'Koi Perich', 'position': 'S', 'college': 'Oregon'},
    {'source_ordinal': 123, 'name': "J'Koby Williams", 'position': 'RB', 'college': 'Texas Tech'},
    {'source_ordinal': 124, 'name': 'Justin Evans', 'position': 'C', 'college': 'Nebraska'},
    {'source_ordinal': 125, 'name': 'Ty Benefield', 'position': 'S', 'college': 'LSU'},
    {'source_ordinal': 126, 'name': 'LaNorris Sellers', 'position': 'QB', 'college': 'South Carolina'},
    {'source_ordinal': 127, 'name': 'Brandon Inniss', 'position': 'WR', 'college': 'Ohio State'},
    {'source_ordinal': 128, 'name': 'Nicholas Rodriguez', 'position': 'LB', 'college': 'Missouri'},
    {'source_ordinal': 129, 'name': 'A.J. Harris', 'position': 'CB', 'college': 'Indiana'},
    {'source_ordinal': 130, 'name': 'Drake Lindsey', 'position': 'QB', 'college': 'Minnesota'},
    {'source_ordinal': 131, 'name': 'Taylor Wein', 'position': 'EDGE', 'college': 'Oklahoma'},
    {'source_ordinal': 132, 'name': 'Brody Foley', 'position': 'TE', 'college': 'Louisville'},
    {'source_ordinal': 133, 'name': 'Jordan Marshall', 'position': 'RB', 'college': 'Michigan'},
    {'source_ordinal': 134, 'name': 'Eli Bowen', 'position': 'CB', 'college': 'Oklahoma'},
    {'source_ordinal': 135, 'name': 'John Curry', 'position': 'CB', 'college': 'Texas Tech'},
    {'source_ordinal': 136, 'name': 'Luke Reynolds', 'position': 'TE', 'college': 'Virginia Tech'},
    {'source_ordinal': 137, 'name': 'Jayce Brown', 'position': 'WR', 'college': 'LSU'},
    {'source_ordinal': 138, 'name': 'Drayk Bowen', 'position': 'LB', 'college': 'Notre Dame'},
    {'source_ordinal': 139, 'name': 'Xavier Lucas', 'position': 'CB', 'college': 'Miami'},
    {'source_ordinal': 140, 'name': 'Mateen Ibirogba', 'position': 'EDGE', 'college': 'Texas Tech'},
    {'source_ordinal': 141, 'name': 'Walker Lyons', 'position': 'TE', 'college': 'USC'},
    {'source_ordinal': 142, 'name': 'Whit Weeks', 'position': 'LB', 'college': 'LSU'},
    {'source_ordinal': 143, 'name': 'Blake Frazier', 'position': 'OT', 'college': 'Michigan'},
    {'source_ordinal': 144, 'name': 'Tony Rojas', 'position': 'LB', 'college': 'Penn State'},
    {'source_ordinal': 145, 'name': 'Kameryn Crawford', 'position': 'EDGE', 'college': 'USC'},
    {'source_ordinal': 146, 'name': 'Wendell Gregory', 'position': 'EDGE', 'college': 'Kansas State'},
    {'source_ordinal': 147, 'name': 'CJ Bailey', 'position': 'QB', 'college': 'NC State'},
    {'source_ordinal': 148, 'name': 'Hollywood Smothers', 'position': 'RB', 'college': 'Texas'},
    {'source_ordinal': 149, 'name': 'Drew Bobo', 'position': 'C', 'college': 'Georgia'},
    {'source_ordinal': 150, 'name': 'King Mack', 'position': 'S', 'college': 'NC State'},
    {'source_ordinal': 151, 'name': 'Braelin Moore', 'position': 'C', 'college': 'LSU'},
    {'source_ordinal': 152, 'name': "Quay'sheed Scott", 'position': 'CB', 'college': 'Kentucky'},
    {'source_ordinal': 153, 'name': 'Jayden Bellamy', 'position': 'CB', 'college': 'UCF'},
    {'source_ordinal': 154, 'name': 'Elijah Paige', 'position': 'OT', 'college': 'USC'},
    {'source_ordinal': 155, 'name': 'Dylan Lonergan', 'position': 'QB', 'college': 'Rutgers'},
    {'source_ordinal': 156, 'name': 'Jermaine Mathews Jr.', 'position': 'CB', 'college': 'Ohio State'},
    {'source_ordinal': 157, 'name': 'Tao Johnson', 'position': 'S', 'college': 'UCLA'},
    {'source_ordinal': 158, 'name': 'Zavier Mincey', 'position': 'S', 'college': 'Alabama'},
    {'source_ordinal': 159, 'name': 'Kayin Lee', 'position': 'CB', 'college': 'Tennessee'},
    {'source_ordinal': 160, 'name': 'Ezra Christensen', 'position': 'DL', 'college': 'Colorado'},
    {'source_ordinal': 161, 'name': 'Cayden Lee', 'position': 'WR', 'college': 'Ole Miss'},
    {'source_ordinal': 162, 'name': 'Drew Azzopardi', 'position': 'OT', 'college': 'Washington'},
    {'source_ordinal': 163, 'name': 'Dezz Ricks', 'position': 'CB', 'college': 'Texas A&M'},
    {'source_ordinal': 164, 'name': 'Coen Echols', 'position': 'OG', 'college': 'Texas A&M'},
    {'source_ordinal': 165, 'name': 'Aaron Flowers', 'position': 'S', 'college': 'Oregon'},
    {'source_ordinal': 166, 'name': 'AJ Green', 'position': 'EDGE', 'college': 'Louisville'},
    {'source_ordinal': 167, 'name': 'Amare Thomas', 'position': 'WR', 'college': 'Houston'},
    {'source_ordinal': 168, 'name': 'Justice Haynes', 'position': 'RB', 'college': 'Georgia Tech'},
    {'source_ordinal': 169, 'name': "Da'Shawn Womack", 'position': 'EDGE', 'college': 'Auburn'},
    {'source_ordinal': 170, 'name': 'Jacob Ponton', 'position': 'OT', 'college': 'Texas Tech'},
    {'source_ordinal': 171, 'name': 'Lawson Luckie', 'position': 'TE', 'college': 'Georgia'},
    {'source_ordinal': 172, 'name': 'Earnest Greene III', 'position': 'OT', 'college': 'Georgia'},
    {'source_ordinal': 173, 'name': 'Mason Curtis', 'position': 'S', 'college': 'Michigan'},
    {'source_ordinal': 174, 'name': 'Jackson Bennee', 'position': 'S', 'college': 'Utah'},
    {'source_ordinal': 175, 'name': 'James Smith', 'position': 'DL', 'college': 'Ohio State'},
    {'source_ordinal': 176, 'name': 'Eugene Wilson III', 'position': 'WR', 'college': 'LSU'},
    {'source_ordinal': 177, 'name': 'Nyziah Hunter', 'position': 'WR', 'college': 'Nebraska'},
    {'source_ordinal': 178, 'name': 'Eric Singleton Jr.', 'position': 'WR', 'college': 'Florida'},
    {'source_ordinal': 179, 'name': 'Edwin Spillman', 'position': 'LB', 'college': 'Tennessee'},
    {'source_ordinal': 180, 'name': 'Payton Pierce', 'position': 'LB', 'college': 'Ohio State'},
    {'source_ordinal': 181, 'name': 'Jake Guarnera', 'position': 'OG', 'college': 'Michigan'},
    {'source_ordinal': 182, 'name': 'Jalen Thompson', 'position': 'EDGE', 'college': 'Michigan State'},
    {'source_ordinal': 183, 'name': 'Jeremiah Cobb', 'position': 'RB', 'college': 'Auburn'},
    {'source_ordinal': 184, 'name': 'Christian Gray', 'position': 'CB', 'college': 'Notre Dame'},
    {'source_ordinal': 185, 'name': 'Kam Franklin', 'position': 'EDGE', 'college': 'Ole Miss'},
    {'source_ordinal': 186, 'name': 'Malachi Breland', 'position': 'OG', 'college': 'Arkansas'},
    {'source_ordinal': 187, 'name': 'Emmanuel Karnley', 'position': 'CB', 'college': 'Virginia'},
    {'source_ordinal': 188, 'name': 'Benjamin Brahmer', 'position': 'TE', 'college': 'Penn State'},
    {'source_ordinal': 189, 'name': 'C.J. Fite', 'position': 'DT', 'college': 'Arizona State'},
    {'source_ordinal': 190, 'name': 'Amaris Williams', 'position': 'EDGE', 'college': 'Georgia'},
    {'source_ordinal': 191, 'name': 'Francis Brewu', 'position': 'DL', 'college': 'Notre Dame'},
    {'source_ordinal': 192, 'name': 'Adepoju Adebawore', 'position': 'EDGE', 'college': 'Oklahoma'},
    {'source_ordinal': 193, 'name': 'Andrew Rappleyea', 'position': 'TE', 'college': 'Penn State'},
    {'source_ordinal': 194, 'name': 'Niki Prongos', 'position': 'OT', 'college': 'Stanford'},
    {'source_ordinal': 195, 'name': 'Edrees Farooq', 'position': 'S', 'college': 'Tennessee'},
    {'source_ordinal': 196, 'name': 'Joenel Aguero', 'position': 'S', 'college': 'Ole Miss'},
    {'source_ordinal': 197, 'name': 'Jaden Platt', 'position': 'TE', 'college': 'Arkansas'},
    {'source_ordinal': 198, 'name': 'Junior Sherrill', 'position': 'WR', 'college': 'Vanderbilt'},
    {'source_ordinal': 199, 'name': 'TJ Metcalf', 'position': 'S', 'college': 'Michigan'},
    {'source_ordinal': 200, 'name': 'Avery Johnson', 'position': 'QB', 'college': 'Kansas State'},
    {'source_ordinal': 201, 'name': 'Jordan Faison', 'position': 'WR', 'college': 'Notre Dame'},
    {'source_ordinal': 202, 'name': 'Gunner Stockton', 'position': 'QB', 'college': 'Georgia'},
    {'source_ordinal': 203, 'name': 'Christian Alliegro', 'position': 'LB', 'college': 'Ohio State'},
    {'source_ordinal': 204, 'name': 'Donovan Jones', 'position': 'CB', 'college': 'Nebraska'},
    {'source_ordinal': 205, 'name': 'Sammy Omosigho', 'position': 'LB', 'college': 'Oklahoma'},
    {'source_ordinal': 206, 'name': 'DeAndre Moore Jr.', 'position': 'WR', 'college': 'Colorado'},
    {'source_ordinal': 207, 'name': 'Anthony Colandrea', 'position': 'QB', 'college': 'Nebraska'},
    {'source_ordinal': 208, 'name': 'Elinneus Davis', 'position': 'DT', 'college': 'Washington'},
    {'source_ordinal': 209, 'name': 'Maraad Watson', 'position': 'DT', 'college': 'Texas'},
    {'source_ordinal': 210, 'name': "La'khi Roland", 'position': 'CB', 'college': 'Maryland'},
    {'source_ordinal': 211, 'name': 'Emerson Mandell', 'position': 'OT', 'college': 'Wisconsin'},
    {'source_ordinal': 212, 'name': 'Sheridan Wilson', 'position': 'C', 'college': 'Texas Tech'},
    {'source_ordinal': 213, 'name': 'Noah Fifita', 'position': 'QB', 'college': 'Arizona'},
    {'source_ordinal': 214, 'name': 'Johntay Cook', 'position': 'WR', 'college': 'Ole Miss'},
    {'source_ordinal': 215, 'name': 'Brett Norfleet', 'position': 'TE', 'college': 'Missouri'},
    {'source_ordinal': 216, 'name': "Jay'Vion Cole", 'position': 'CB', 'college': 'Arizona'},
    {'source_ordinal': 217, 'name': 'Mark Nabou Jr.', 'position': 'C', 'college': 'Texas A&M'},
    {'source_ordinal': 218, 'name': 'Cody Jackson', 'position': 'WR', 'college': 'Iowa State'},
    {'source_ordinal': 219, 'name': 'Kamari Wilson', 'position': 'S', 'college': 'West Virginia'},
    {'source_ordinal': 220, 'name': 'LJ McCray', 'position': 'EDGE', 'college': 'Florida'},
    {'source_ordinal': 221, 'name': 'Cole Sullivan', 'position': 'LB', 'college': 'Oklahoma'},
    {'source_ordinal': 222, 'name': 'Boo Carter', 'position': 'CB', 'college': 'Colorado'},
    {'source_ordinal': 223, 'name': 'Landen Hatchett', 'position': 'C', 'college': 'Washington'},
    {'source_ordinal': 224, 'name': 'Antonio Kite', 'position': 'CB', 'college': 'Ole Miss'},
    {'source_ordinal': 225, 'name': 'John Mateer', 'position': 'QB', 'college': 'Oklahoma'},
    {'source_ordinal': 226, 'name': 'Randon Fontenette', 'position': 'CB', 'college': 'Colorado'},
    {'source_ordinal': 227, 'name': 'Chris Marshall', 'position': 'WR', 'college': 'Arkansas'},
    {'source_ordinal': 228, 'name': 'Stephiylan Green', 'position': 'DT', 'college': 'LSU'},
    {'source_ordinal': 229, 'name': 'Jehiem Oatis', 'position': 'DL', 'college': 'Ole Miss'},
    {'source_ordinal': 230, 'name': 'Jaleel Johnson', 'position': 'EDGE', 'college': 'Oklahoma State'},
    {'source_ordinal': 231, 'name': 'Xavier Chaplin', 'position': 'OT', 'college': 'Florida State'},
    {'source_ordinal': 232, 'name': 'Smith Snowden', 'position': 'CB', 'college': 'Michigan'},
    {'source_ordinal': 233, 'name': 'Addison Nichols', 'position': 'OG', 'college': 'SMU'},
    {'source_ordinal': 234, 'name': 'Conner Weigman', 'position': 'QB', 'college': 'Houston'},
    {'source_ordinal': 235, 'name': 'Charles Jagusah', 'position': 'OG', 'college': 'Notre Dame'},
    {'source_ordinal': 236, 'name': 'Austin Romaine', 'position': 'LB', 'college': 'Texas Tech'},
    {'source_ordinal': 237, 'name': 'Jackson Arnold', 'position': 'QB', 'college': 'UNLV'},
    {'source_ordinal': 238, 'name': 'Byrum Brown', 'position': 'QB', 'college': 'Auburn'},
    {'source_ordinal': 239, 'name': 'Sullivan Absher', 'position': 'OG', 'college': 'Notre Dame'},
    {'source_ordinal': 240, 'name': 'Tavion Gadson', 'position': 'DL', 'college': 'Kentucky'},
)


def _ref(name: str) -> str:
    return create_application_prospect_ref(year=RUNTIME_INVENTORY_DRAFT_YEAR, name=name)


def runtime_inventory_rows() -> List[Dict[str, object]]:
    """Return the de-duplicated 2027 runtime catalog rows.

    Enriched projection entries are emitted first. Base-profile inventory entries that
    resolve to the same application reference are skipped. ``rank`` is a legacy runtime
    sort key only and has no Football Intelligence or LBHT ranking authority.
    """
    merged: List[Tuple[str, str, str, str, int | None, str]] = []
    seen = set()

    for prospect in PROSPECTS_2027:
        application_ref = _ref(prospect["name"])
        if not application_ref or application_ref in seen:
            continue
        seen.add(application_ref)
        merged.append((
            application_ref,
            prospect["name"],
            prospect["position"],
            prospect["college"],
            None,
            "ENRICHED_RESEARCH",
        ))

    for prospect in BASE_INVENTORY_2027:
        application_ref = _ref(prospect["name"])
        if not application_ref or application_ref in seen:
            continue
        seen.add(application_ref)
        merged.append((
            application_ref,
            prospect["name"],
            prospect["position"],
            prospect["college"],
            int(prospect["source_ordinal"]),
            "BASE_PROFILE",
        ))

    return [
        {
            "application_prospect_ref": application_ref,
            "name": name,
            "position": position,
            "college": college,
            "rank": index,
            "year": RUNTIME_INVENTORY_DRAFT_YEAR,
            "source_ordinal": source_ordinal,
            "intelligence_coverage": coverage,
        }
        for index, (application_ref, name, position, college, source_ordinal, coverage)
        in enumerate(merged, start=1)
    ]


def runtime_inventory_diagnostics() -> Dict[str, object]:
    rows = runtime_inventory_rows()
    refs = [row["application_prospect_ref"] for row in rows]
    enriched_count = sum(row["intelligence_coverage"] == "ENRICHED_RESEARCH" for row in rows)
    base_count = sum(row["intelligence_coverage"] == "BASE_PROFILE" for row in rows)
    overlap_count = len(PROSPECTS_2027) + len(BASE_INVENTORY_2027) - len(rows)
    return {
        "contract": "ApplicationProspectRuntimeInventory",
        "contract_version": RUNTIME_INVENTORY_CONTRACT_VERSION,
        "version": RUNTIME_INVENTORY_VERSION,
        "status": RUNTIME_INVENTORY_STATUS,
        "source": RUNTIME_INVENTORY_SOURCE,
        "draft_year": RUNTIME_INVENTORY_DRAFT_YEAR,
        "base_source_count": len(BASE_INVENTORY_2027),
        "enriched_source_count": len(PROSPECTS_2027),
        "runtime_inventory_count": len(rows),
        "enriched_runtime_count": enriched_count,
        "base_runtime_count": base_count,
        "overlap_replaced_by_enrichment": overlap_count,
        "unique_application_references": len(set(refs)),
        "source_ordinal_authority": RUNTIME_INVENTORY_SOURCE_ORDINAL_AUTHORITY,
        "runtime_rank_authority": RUNTIME_RANK_AUTHORITY,
        "canonical_identifier_count": 0,
        "canonical_authority": False,
        "draft_intelligence_authority": False,
    }
