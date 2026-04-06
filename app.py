from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import sqlite3
from datetime import timedelta, datetime

app = Flask(__name__)
app.secret_key = "smilewell_secret_key_2026_change_in_production"
app.permanent_session_lifetime = timedelta(minutes=15)
DB_NAME = 'smilewell.db'

def init_db():
    """Initialize database with proper schema"""
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS contacts(
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        appointment_date TEXT,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully")

init_db()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/contact", methods=["POST"])
def contact():
    """Handle appointment booking form submission"""
    try:
        # Handle both JSON and FormData
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
        
        name = data.get("name", "").strip()
        email = data.get("email", "").strip()
        phone = data.get("phone", "").strip()
        appointment_date = data.get("date", "").strip()
        message = data.get("message", "").strip()
        
        print(f'📩 Received appointment: {name}, {email}, {phone}, {appointment_date}')

        # Validation
        if not name or not email or not phone or not appointment_date:
            return jsonify({
                "status": "error", 
                "message": "Please fill in all required fields"
            }), 400

        # Basic email validation
        if "@" not in email or "." not in email:
            return jsonify({
                "status": "error",
                "message": "Please enter a valid email address"
            }), 400

        # Save to database
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("""
            INSERT INTO contacts (name, email, phone, appointment_date, message) 
            VALUES (?, ?, ?, ?, ?)
        """, (name, email, phone, appointment_date, message))
        conn.commit()
        conn.close()
        
        print("✅ Appointment saved to database")

        return jsonify({
            "status": "success",
            "message": "Appointment request sent successfully! We will contact you shortly."
        })
    
    except Exception as e:
        print(f"❌ Database Error: {e}")
        return jsonify({
            "status": "error",
            "message": "An error occurred. Please try again later."
        }), 500

@app.route("/admin")
def admin():
    """Admin dashboard - view all appointments"""
    if not session.get("admin"):
        return redirect("/login")

    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("""
            SELECT id, name, email, phone, appointment_date, message, created_at 
            FROM contacts 
            ORDER BY id DESC
        """)
        contacts = c.fetchall()
        conn.close()

        return render_template("admin.html", contacts=contacts)
    
    except Exception as e:
        print(f"❌ Error fetching contacts: {e}")
        return "Database error", 500

@app.route("/delete_contact/<int:contact_id>", methods=["POST"])
def delete_contact(contact_id):
    """Delete a contact from admin panel"""
    if not session.get("admin"):
        return redirect("/login")
    
    try:
        conn = sqlite3.connect(DB_NAME)
        c = conn.cursor()
        c.execute("DELETE FROM contacts WHERE id = ?", (contact_id,))
        conn.commit()
        conn.close()
        print(f"✅ Deleted contact ID: {contact_id}")
        return redirect("/admin")
    except Exception as e:
        print(f"❌ Delete error: {e}")
        return "Error deleting contact", 500

@app.route("/login", methods=["GET", "POST"])
def login():
    """Admin login page"""
    error = None
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "").strip()

        # TODO: Change these credentials in production!
        if username == "admin" and password == "smilewell2026":
            session.permanent = True
            session["admin"] = True
            print(f"✅ Admin logged in at {datetime.now()}")
            return redirect("/admin")
        else:
            error = "Invalid username or password"
            print(f"❌ Failed login attempt: {username}")
    
    return render_template("login.html", error=error)

@app.route("/logout")
def logout():
    """Logout admin user"""
    session.pop("admin", None)
    print("✅ Admin logged out")
    return redirect("/login")

