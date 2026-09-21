import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "db.json"

def get_student_by_id(id):
    with open(DB_PATH,"r+b") as db:
        return json.loads(db.read())[f'{id}']
    
def get_all_students():
    with open(DB_PATH,"r+") as db:
        all = json.loads(db.read())
        return [{obj:all[obj]} for obj in all]
    
print(get_all_students())