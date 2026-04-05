import sys
import os

# Append current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
from models import InterviewHistory, Base

# Drop only InterviewHistory
InterviewHistory.__table__.drop(engine, checkfirst=True)

# Create all (will create InterviewHistory since it's missing)
Base.metadata.create_all(bind=engine)

print("InterviewHistory table successfully recreated with new schema!")
