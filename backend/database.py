"""
Establishes connection to the PostgreSQL database using SQLAlchemy.
"""


# Import necessary libraries
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Optimize connection string for Supabase
if "supabase" in DATABASE_URL:
    # Add connection parameters for better performance with Supabase
    if "?" not in DATABASE_URL:
        DATABASE_URL += "?"
    else:
        DATABASE_URL += "&"
    DATABASE_URL += "connect_timeout=10&application_name=nfl-mock-draft-simulator"

# Set up database engine, session, and base class for models
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_timeout=30,
    echo=False,
    connect_args={
        "connect_timeout": 10,
        "application_name": "nfl-mock-draft-simulator",
    }
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()