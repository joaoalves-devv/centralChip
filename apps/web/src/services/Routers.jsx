import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import Login from "../pages/login";

export default function Routers() {
    return (
        <Routes> 
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Login />} />
        </Routes> 
    );
}