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

This platform helps streamline **release planning**, **user story management**, and **sprint readiness**, acting as a central integration point with other Agile tools such as **Jira**, **Taiga**, and **Planning Poker**. It also supports the potential use of **AI-powered recommendations** (e.g., using Spinach.AI).

---

## 🚀 Features
- 🧠 **Release Planning:** Collaborate on defining and structuring releases.
- 📋 **User Story Management:** Create, edit, and manage stories with acceptance criteria and priorities.
- ⚙️ **Backlog Grooming:** Refine and prioritize user stories before sprint planning.
- 🌟 **MVP Identification:** Highlight key stories for initial releases.
- ✅ **Sprint Readiness:** Mark user stories ready for sprint inclusion.
- 🔗 **Tool Integrations:** Export stories for tools like Jira or Taiga.
- 🤖 **AI Support (Optional):** Integrate with AI-assisted planning tools.
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
- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [MongoDB](https://www.mongodb.com/try/download/community) or MongoDB Atlas

---

### 1️⃣ Clone the Repository
Open your terminal and run:
```bash
git clone https://github.com/mmehta53/SER515.git
cd SER515
````

---

### 2️⃣ Backend Setup (Flask + MongoDB)

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   ```

   * On **Windows**:

     ```bash
     venv\Scripts\activate
     ```
   * On **Mac/Linux**:

     ```bash
     source venv/bin/activate
     ```

3. Install required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the `backend/` directory and add:

   ```
   MONGO_URI=mongodb://localhost:27017/ser515
   FLASK_ENV=development
   SECRET_KEY=yourSecretKey
   PORT=5000
   ```

5. Start the Flask backend server:

   ```bash
   python run.py
   ```

   You should see:

   ```
   * Running on http://localhost:5000
   ```

---

### 3️⃣ Frontend Setup (React + Vite)

1. Open a new terminal (keep the backend running).

2. Navigate to the frontend directory:

   ```bash
   cd ../frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the `frontend/` directory (if not present) and add:

   ```
   VITE_API_URL=http://localhost:5000
   ```

5. Start the frontend development server:

   ```bash
   npm run dev
   ```

   You should see something like:

   ```
   Local: http://localhost:5173/
   ```

6. Open the link in your browser:
   👉 [http://localhost:5173](http://localhost:5173)

---

## 🔗 Connecting Frontend and Backend

The frontend automatically connects to the Flask backend using the API URL defined in the `.env` file (`VITE_API_URL`).
Ensure both servers (frontend and backend) are running simultaneously.

---

## 🧠 Troubleshooting

| Problem                              | Possible Fix                                                                |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `ModuleNotFoundError`                | Reinstall dependencies or activate your virtual environment.                |
| `MongoDB connection failed`          | Ensure MongoDB is running and the URI in `.env` is correct.                 |
| `Frontend not connecting to backend` | Verify `VITE_API_URL` in frontend `.env` points to the correct backend URL. |
| `Port already in use`                | Change the port number in the `.env` file.                                  |

---
