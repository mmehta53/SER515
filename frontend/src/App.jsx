import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<h1>Welcome Admin</h1>} />
        <Route path="/user" element={<h1>Welcome User</h1>} />
        <Route path="/dashboard" element={<h1>Welcome Dashboard</h1>} />
      </Routes>
    </Router>
  );
}

export default App;
