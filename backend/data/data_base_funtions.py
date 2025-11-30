import sqlite3

db_name = '../../identifier.sqlite'
def create_connection():
    conn = sqlite3.connect(db_name)
    conn.row_factory = sqlite3.Row
    return conn

def log_discovery(user_id, plant_id, image_url, location) :
    conn  = create_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""INSERT INTO discoveries (user_id, plant_id, image_url,
                                                   location, created_at)
                          VALUES (?, ?, ?, ?, datetime('now'))""", (user_id, plant_id, image_url, location))
        new_id = cursor.lastrowid
        conn.commit()
        print(f"Dodano zgłoszenie ID: {new_id} dla Usera: {user_id}")
        return new_id
    except Exception as e:
        print(f"Unexcpected exception while adding log to database: {e}")
        conn.rollback()
    finally:
        conn.close()

def approve_discovery(confirmed_id) :
    with sqlite3.connect(db_name) as conn:
        cursor = conn.cursor()
        cursor.execute("""UPDATE discoveries SET confirmed = 1 WHERE id = ?""",
                     (confirmed_id,))
        cursor.execute("""UPDATE plants 
            SET confirmed = confirmed + 1 
            WHERE id = (SELECT plant_id FROM discoveries WHERE id = ?)
        """, (confirmed_id))
        conn.commit()

def plants_to_dig():
    with sqlite3.connect(db_name) as conn:
        conn.row_factory = sqlite3.Row
        query = """
                SELECT d.id, p.polish_name, d.location
                FROM discoveries d
                         JOIN plants p ON d.plant_id = p.id
                WHERE d.confirmed = 0
                """
        cursor = conn.cursor()
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()
        results = []
        for row in rows:
            results.append((
                row['id'],
                row['polish_name'],
                row['location'],
            ))



def user_add(username):
    with sqlite3.connect(db_name) as conn:
        cursor = conn.cursor()
        cursor.execute("""INSERT INTO users (username) VALUES (?)""",(username,))
        conn.commit()







