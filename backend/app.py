import os
import uuid
import smtplib
from email.message import EmailMessage
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import psycopg
from psycopg.rows import dict_row
import db

load_dotenv()

app = Flask(__name__, static_folder='../frontend', static_url_path='')
# Enable CORS for frontend running locally or on Vercel
CORS(app)

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    return app.send_static_file(path)

# Initialize DB on start
db.init_db()

# Simple Auth Middleware check
def check_auth(req):
    token = req.headers.get("Authorization")
    if token == os.environ.get("ADMIN_TOKEN", "secret_token_used_for_login"):
        return True
    return False

# --- Auth Endpoint ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    password = data.get("password")
    if password == os.environ.get("ADMIN_PASSWORD", "projectxx2026"):
        token = os.environ.get("ADMIN_TOKEN", "secret_token_used_for_login")
        return jsonify({"success": True, "token": token}), 200
    else:
        return jsonify({"success": False, "error": "Invalid password"}), 401

# --- Members API ---
@app.route('/api/members', methods=['GET'])
def get_members():
    try:
        conn = db.get_db_connection()
        cur = conn.cursor(row_factory=dict_row)
        cur.execute("SELECT * FROM members ORDER BY id DESC")
        members = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(members), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/members', methods=['POST'])
def add_member():
    if not check_auth(request):
        return jsonify({"error": "Unauthorized"}), 401
    
    # Check if request has form data
    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form
    else:
        data = request.json or {}

    image_file = request.files.get("image") if request.files else None
    image_url = None

    if image_file and image_file.filename:
        # Generate a unique filename using uuid
        ext = image_file.filename.rsplit('.', 1)[-1] if '.' in image_file.filename else 'jpg'
        filename = f"{uuid.uuid4().hex}.{ext}"
        
        # Save to frontend/assets/team directory
        filepath = os.path.join(os.path.dirname(__file__), "..", "frontend", "assets", "team", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        image_file.save(filepath)
        
        image_url = f"assets/team/{filename}"

    try:
        conn = db.get_db_connection()
        cur = conn.cursor(row_factory=dict_row)
        cur.execute(
            "INSERT INTO members (name, role, skills, type, github, linkedin, image_url) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (data.get("name"), data.get("role"), data.get("skills"), data.get("type"), data.get("github"), data.get("linkedin"), image_url)
        )
        new_member = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(new_member), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/members/<int:id>', methods=['DELETE'])
def delete_member(id):
    if not check_auth(request):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = db.get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM members WHERE id = %s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Projects API ---
@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        conn = db.get_db_connection()
        cur = conn.cursor(row_factory=dict_row)
        cur.execute("SELECT * FROM projects ORDER BY id DESC")
        projects = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(projects), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects', methods=['POST'])
def add_project():
    if not check_auth(request):
        return jsonify({"error": "Unauthorized"}), 401
        
    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form
    else:
        data = request.json or {}

    image_file = request.files.get("image") if request.files else None
    image_url = None

    if image_file and image_file.filename:
        ext = image_file.filename.rsplit('.', 1)[-1] if '.' in image_file.filename else 'jpg'
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(os.path.dirname(__file__), "..", "frontend", "assets", "projects", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        image_file.save(filepath)
        image_url = f"assets/projects/{filename}"

    try:
        conn = db.get_db_connection()
        cur = conn.cursor(row_factory=dict_row)
        cur.execute(
            "INSERT INTO projects (title, tag, category, techstack, link, image_url) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
            (data.get("title"), data.get("tag"), data.get("category"), data.get("techstack"), data.get("link"), image_url)
        )
        new_project = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(new_project), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/projects/<int:id>', methods=['DELETE'])
def delete_project(id):
    if not check_auth(request):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = db.get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM projects WHERE id = %s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Achievements API ---
@app.route('/api/achievements', methods=['GET'])
def get_achievements():
    try:
        conn = db.get_db_connection()
        cur = conn.cursor(row_factory=dict_row)
        cur.execute("SELECT * FROM achievements ORDER BY id DESC")
        achievements = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(achievements), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/achievements', methods=['POST'])
def add_achievement():
    if not check_auth(request):
        return jsonify({"error": "Unauthorized"}), 401
        
    if request.content_type and "multipart/form-data" in request.content_type:
        data = request.form
    else:
        data = request.json or {}

    image_file = request.files.get("image") if request.files else None
    image_url = None

    if image_file and image_file.filename:
        ext = image_file.filename.rsplit('.', 1)[-1] if '.' in image_file.filename else 'jpg'
        filename = f"{uuid.uuid4().hex}.{ext}"
        filepath = os.path.join(os.path.dirname(__file__), "..", "frontend", "assets", "achievements", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        image_file.save(filepath)
        image_url = f"assets/achievements/{filename}"

    try:
        conn = db.get_db_connection()
        cur = conn.cursor(row_factory=dict_row)
        cur.execute(
            "INSERT INTO achievements (type, title, date, description, image_url) VALUES (%s, %s, %s, %s, %s) RETURNING *",
            (data.get("type"), data.get("title"), data.get("date"), data.get("description"), image_url)
        )
        new_achievement = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(new_achievement), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/achievements/<int:id>', methods=['DELETE'])
def delete_achievement(id):
    if not check_auth(request):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = db.get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM achievements WHERE id = %s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- Contact & Messages API ---
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    data = request.json
    name = data.get("name")
    email_address = data.get("email")
    subject = data.get("subject")
    message_text = data.get("message")
    
    try:
        # 1. Save to database
        conn = db.get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO messages (name, email, subject, message) VALUES (%s, %s, %s, %s)",
            (name, email_address, subject, message_text)
        )
        conn.commit()
        cur.close()
        conn.close()

        # 2. Send Email
        email_user = os.environ.get("EMAIL_USER")
        email_pass = os.environ.get("EMAIL_PASS")
        
        if email_user and email_pass:
            msg = EmailMessage()
            msg.set_content(f"From: {name} <{email_address}>\n\nMessage:\n{message_text}")
            msg["Subject"] = f"New Contact Form: {subject}"
            msg["From"] = email_user
            msg["To"] = email_user
            msg.add_header('reply-to', email_address)
            
            # Using Gmail SMTP (Modify if using another provider)
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
            server.login(email_user, email_pass)
            server.send_message(msg)
            server.quit()
        
        return jsonify({"success": True, "message": "Message sent and saved!"}), 200
    except Exception as e:
        print(f"Contact error: {e}")
        return jsonify({"error": "Failed to process message."}), 500

@app.route('/api/messages', methods=['GET'])
def get_messages():
    if not check_auth(request):
        return jsonify({"error": "Unauthorized"}), 401
    try:
        conn = db.get_db_connection()
        cur = conn.cursor(row_factory=dict_row)
        cur.execute("SELECT * FROM messages ORDER BY created_at DESC")
        messages = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(messages), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
