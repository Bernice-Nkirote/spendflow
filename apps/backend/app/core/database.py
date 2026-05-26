from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings


# Creates the connection to PostgreSQL
database_url = settings.DATABASE_URL

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(database_url)

# creates sessions in the database and ensures session closes after someone manually closes it.
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


Base = declarative_base()

# Opens session to whoever needs it and closes it once someone is done with their session
def get_db():
    db = SessionLocal()
    try:
        yield db  
    finally:
        db.close()