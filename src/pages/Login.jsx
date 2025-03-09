import React from "react";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import PasswordInput from "../components/PasswordInput";
import { validateEmail } from "../utils/helper";
import { useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter the password");
      return;
    }

    setError("");

    //Login API Call
    try {
      const response = await axiosInstance.post("/login", {
        email: email,
        password: password,
      });
      //Handle Successful Login Response
      if (response.data && response.data.accessToken) {
        localStorage.setItem("token", response.data.accessToken);
        navigate("/dashboard");
      }
    } catch (error) {
      //Handle Login Error
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setError(error.response.data.message);
      } else {
        setError("An expected error occured. Please try again.");
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="h-screen flex items-center justify-center bg-[url('https://i.postimg.cc/13PYjXN9/19643763-6160408.jpg')] bg-cover bg-center">
        <div className="flex items-center justify-center">
          <div className="w-96 border border-gray-300 rounded bg-white px-7 py-10">
            <form onSubmit={handleLogin}>
              <h4 className="text-2xl mb-7">Login</h4>
              <input
                type="text"
                placeholder="Email"
                className="input-box border-gray-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className="text-red-500 text-xs pb-1">{error}</p>}

              <button type="submit" className="btn-primary">
                Login
              </button>

              <p className="text-sm text-center mt-4">
                Not registered yet? {""}
                <Link
                  to="/signup"
                  className="font-medium text-primary underline"
                >
                  Contact IT Office
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
