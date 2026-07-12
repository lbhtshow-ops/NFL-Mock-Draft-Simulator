# NFL Roster Importers

This folder will hold importer adapters for NFL roster data.

The importer layer has one job:

Raw external roster data
→ normalized LBHT NFLPlayerRecord format

Rules:
- Importers update objective roster facts.
- Importers should not overwrite LBHT scouting evaluations.
- Importers should not own football logic.
- Team Needs should be derived by engines, not typed directly into the importer.

Future importer types:
- Static JSON importer
- CSV importer
- API importer
- Depth chart importer
- Contract importer
- Injury/status importer