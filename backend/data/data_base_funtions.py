import os
import sqlite3
# Absolute path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
db_name = os.path.join(SCRIPT_DIR,'../../identifier.sqlite')

# When user discoveres a plant it gives him points and sets all statistics
def log_discovery(user_id, polish_name, location) :
    conn = sqlite3.connect(db_name)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, inv_points FROM plants WHERE polish_name = ?", (polish_name,))
        result = cursor.fetchone()

        plant_id = result['id']
        points_to_add = result['inv_points']*10

        if result is None:
            print(f"❌ Błąd: Roślina o nazwie '{polish_name}' nie istnieje w bazie plants.")
            return None
        plant_id = result[0]
        cursor.execute("""INSERT INTO discoveries (user_id, plant_id,
                                                   location, created_at)
                          VALUES (?, ?, ?, datetime('now'))""", (user_id, plant_id, location))
        confirmed_id = cursor.lastrowid

        cursor.execute("""UPDATE discoveries
                          SET confirmed = 1
                          WHERE id = ?""",
                       (confirmed_id,))
        cursor.execute("""UPDATE plants
                          SET confirmed = confirmed + 1
                          WHERE id = (SELECT plant_id FROM discoveries WHERE id = ?)
                       """, (confirmed_id,))
        cursor.execute("""
                       UPDATE users
                       SET points = points + ?
                       WHERE id = ?
                       """, (points_to_add, user_id))
        conn.commit()
        print(f"Dodano zgłoszenie ID: {confirmed_id} dla Usera: {user_id}")
        return confirmed_id
    except Exception as e:
        print(f"Unexcpected exception while adding log to database: {e}")
        conn.rollback()
    finally:
        conn.close()

# User gets point as sson as someone who digs the gives an approval
def approve_discovery(confirmed_id) :
    with sqlite3.connect(db_name) as conn:
        cursor = conn.cursor()
        cursor.execute("""UPDATE discoveries SET confirmed = 1 WHERE id = ?""",
                     (confirmed_id,))
        cursor.execute("""UPDATE plants 
            SET confirmed = confirmed + 1 
            WHERE id = (SELECT plant_id FROM discoveries WHERE id = ?)
        """, (confirmed_id,))
        cursor.execute("""SELECT inv_points FROM plants WHERE id = (SELECT plant_id FROM discoveries WHERE id = ?)""")
        result = cursor.fetchone()
        result = int(result[0]) * 10
        conn.commit()
        user_give_points(confirmed_id, result)

# Give a list of unchecked plant for someone to dig them out
# list contains tirpplets
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
        return results


# Add new user
def user_add(username):
    with sqlite3.connect(db_name) as conn:
        cursor = conn.cursor()
        cursor.execute("""INSERT INTO users (username) VALUES (?)""",(username,))
        conn.commit()

# Give user points for finding a invasive plant
def user_give_points(username, points_to_add):
    with sqlite3.connect(db_name) as conn:
        cursor = conn.cursor()
        cursor.execute("""UPDATE users SET points = points + (?) WHERE username = (?)""",(points_to_add, username))

# Get current points of user
def user_get_points(username):
    with sqlite3.connect(db_name) as conn:
        cursor = conn.cursor()
        cursor.execute("""SELECT points FROM users WHERE username = (?)""",(username,))
        result = cursor.fetchone()
        return result[0]

log_discovery(1, "Klon jesionolistny", "1,2")
print(user_get_points('Janusz'))
