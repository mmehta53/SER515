# 🧩 Agile Requirements Engineering Tool (SER515)

## 👥 Team Members
- Vriddhi Shah  
- Manthan Mehta  
- Vatsayu Patel  
- Vidhi Patel  
- Karnika Sojitra  

---

## 📘 Overview
The **Agile Requirements Engineering Tool** is a web-based platform designed to support Agile teams — both **Pigs (core contributors)** and **Chickens (stakeholders)** — in the process of **requirements ideation, user story creation, grooming, MVP identification, and sprint planning**.  

This platform helps streamline **release planning**, **user story management**, and **sprint readiness**, acting as a central integration point with other Agile tools such as **Jira**, **Taiga**, and **Planning Poker**.

---

## 🚀 Features
- 🧠 **Release Planning:** Collaborate on defining and structuring releases.
- 📋 **User Story Management:** Create, edit, and manage stories with acceptance criteria and priorities.
- ⚙️ **Backlog Grooming:** Refine and prioritize user stories before sprint planning.
- 🌟 **MVP Identification:** Highlight key stories for initial releases.
- ✅ **Sprint Readiness:** Mark user stories ready for sprint inclusion.
- 🔗 **Tool Integrations:** Export stories for tools like Jira or Taiga.
- 💻 **Responsive Frontend:** Intuitive interface built with React and Vite.
- 🧾 **Scalable Backend:** Flask + MongoDB setup for efficient data handling.

---

## ⚙️ Tech Stack
**Frontend:** React (Vite), JavaScript, HTML, CSS  
**Backend:** Python (Flask)  
**Database:** MongoDB  
**Package Management:** npm, pip  
**Version Control:** Git + GitHub  

---

## 💻 Setup Instructions

Follow these steps to set up and run the project on your local machine.

---

### 🧰 Prerequisites
Ensure you have the following installed:
- [Python 3.10+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) or [MongoDB Compass](https://www.mongodb.com/products/tools/compass)

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.
### 1. Backend Setup (Python/Flask)

1. Clone the Repository:

   ```bash
   git clone https://github.com/mmehta53/SER515
   cd SER515/backend
   ```

2. Set up Virtual Environment and Dependencies:

   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows, use: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root of the backend directory with the following configuration for localhost development:

   ```bash
   # MongoDB Configuration (Local Development)
   MONGO_URI=mongodb://localhost:27017/

   # JWT Configuration
   SECRET_KEY=your_super_secret_key_here
   JWT_ACCESS_TOKEN_EXPIRES=900
   JWT_REFRESH_TOKEN_EXPIRES=604800

   # Email Configuration (for email functionality)
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=true
   MAIL_USERNAME=your_email@gmail.com
   MAIL_PASSWORD=your_app_password
   MAIL_DEFAULT_SENDER=noreply@projectideation.com
   ```

   > **Note:** Replace `your_super_secret_key_here`, `your_email@gmail.com`, and `your_app_password` with your actual values.

4. Run the Server:

   ```bash
   python run.py
   ```

The backend API will typically run on http://127.0.0.1:5000.

### 2. Frontend Setup (React)

1. Navigate to the Frontend Directory:

   ```bash
   cd SER515/frontend
   ```

2. Install Dependencies:

   ```bash
   npm install
   ```

3. Run the Client:

   ```bash
   npm run dev  
   ```

The React application should open in your browser (http://localhost:5173).

---

## 🗄️ Local MongoDB Setup (for localhost development)

If you want to use a local MongoDB instance instead of MongoDB Atlas, follow these steps:

### Step 1: Start MongoDB Daemon

Open your terminal/command prompt and start the MongoDB server:

**On macOS/Linux:**
```bash
mongod
```

**On Windows:**
```powershell
# If MongoDB is installed via Chocolatey or MSI, you can start it as a service
net start MongoDB

# Or run mongod directly (if in PATH):
mongod
```

MongoDB will run on the default port `27017` and be accessible at `mongodb://localhost:27017/`.

### Step 2: Create the Database Using MongoDB Compass

1. **Open MongoDB Compass** (download from [MongoDB Compass](https://www.mongodb.com/products/tools/compass) if not installed).

2. **Connect to Local Server:**
   - The default connection string should be: `mongodb://localhost:27017/`
   - Click the **Connect** button.

3. **Create a New Database:**
   - In the main Compass window, click the **+ Create Database** button.
   - **Database Name:** Enter `SER515`
   - **Collection Name:** Enter `users`
   - Click **Create Database**.

### Step 3: Configure .env for Localhost

In the `backend/.env` file, set the `MONGO_URI` to point to your local MongoDB instance:

```bash
MONGO_URI=mongodb://localhost:27017/
```

> **Note:** The database `SER515` will be automatically created by the Flask app on first connection via MongoEngine.

### Step 3b: Update `__init__.py` for Localhost

In `backend/app/__init__.py`, comment out the `tlsCAFile=certifi.where(),` line since localhost MongoDB connections don't require TLS certificates:

```python
connect(
    db='SER515',
    host=mongo_uri,
    # tlsCAFile=certifi.where(),  # Comment this out for localhost MongoDB connections
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=10000,
    socketTimeoutMS=20000,
    retryWrites=True,
    w='majority'
)
```

### Step 4: Create the Admin User

Once MongoDB is running and the `.env` is configured, create an admin user and organization by running the initialization script:

**From the backend directory:**
```bash
cd backend
python create_admin.py
```

This script will:
- ✅ Create an organization named **"organization"**
- ✅ Create an admin user with:
  - **Email:** `admin@organization.com`
  - **Password:** `123456` (hashed in the database)
  - **Role:** `admin`
  - **Organization ID:** Linked to the created organization

**Expected Output:**
```
Created organization: <org-id> - organization
Created admin user: <user-id> - admin@organization.com
Password is set to '123456' (stored hashed in DB).
```

You can now log in to the application using these credentials.

---

## User Credentials

[Link to user credentials](https://docs.google.com/document/d/1BcGEBbrLvDA2MW09rrvSeTsExqdPNBQEnWbBIc5qYZs/edit?usp=sharing)

---

## 🧠 Troubleshooting

| Problem                              | Possible Fix                                                                |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `ModuleNotFoundError`                | Reinstall dependencies or activate your virtual environment.                |
| `MongoDB connection failed`          | Ensure MongoDB is running and the URI in `.env` is correct.                 |
| **Backend failed to start (Mac)** | **Turn off AirPlay Receiver** in **System Settings** -> **General** -> **AirDrop & Handoff**, as it may use port 5000. Alternatively, change the backend port which you might need to change in services/api.js as well as utils/api.js. |
---
