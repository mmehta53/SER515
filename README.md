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
   Create a .env file in the root of the backend directory with your MongoDB connection string and JWT secret.

   .env example

   ```bash
   MONGO_URI="mongodb://localhost:27017/project_tracker_db" #.env file already set in the main branch
   JWT_SECRET_KEY="your_super_secret_key"
   ```

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

## User Credentials

[Link to user credentials](https://docs.google.com/document/d/1BcGEBbrLvDA2MW09rrvSeTsExqdPNBQEnWbBIc5qYZs/edit?usp=sharing)

---

## 🧠 Troubleshooting

| Problem                              | Possible Fix                                                                |
| ------------------------------------ | --------------------------------------------------------------------------- |
| `ModuleNotFoundError`                | Reinstall dependencies or activate your virtual environment.                |
| `MongoDB connection failed`          | Ensure MongoDB is running and the URI in `.env` is correct.                 |

---
