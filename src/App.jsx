import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import LoginPage from "./components/LoginPage";
import Expenses from "./components/Expenses";
import AdminDashboard from "./components/Admin_dashboard";



function Home() {
  return (
    <>
      <Hero />

    </>
  );
}

function App() {
  return (
    <>
      <Navbar />

   <Routes>
  <Route path="/" element={<Home />} />
  <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/expenses" element={<Expenses />} />


  <Route path="/login" element={<LoginPage />} />
    <Route path="/admin" element={<AdminDashboard />} />

</Routes>
    </>
  );
}

export default App;