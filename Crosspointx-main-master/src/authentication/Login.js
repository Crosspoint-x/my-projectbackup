import React, { useState } from "react";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { useNavigate, Link } from "react-router";
import { FIREBASE_AUTH } from "../firebase";
import { getFunctions, httpsCallable } from "@firebase/functions"; // Import Firebase Functions
import CrosspointxLogo from "../assets/Crosspointx.svg";
import "./Login.css";
import { FaDiscord, FaInstagram, FaTiktok, FaEnvelope } from "react-icons/fa"; // Icons

// Define RefereeID and RefereePass
const refereeID = "8155180126";
const refereePass = "786592";

const Login = ({ setIsReferee }) => {
  const [isRefereeLogin, setIsRefereeLogin] = useState(false); // Referee or regular user login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAboutVisible, setIsAboutVisible] = useState(false); // About Us box visibility
  const navigate = useNavigate();
  const functions = getFunctions(); // Initialize Firebase Functions

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let emailToUse = identifier;
      let passwordToUse = password;

      // If logging in as a referee
      if (identifier === refereeID) {
        emailToUse = `${refereeID}@ref.com`;
        passwordToUse = refereePass;

        setIsRefereeLogin(true);

        // Login the referee
        const userCredential = await signInWithEmailAndPassword(
          FIREBASE_AUTH,
          emailToUse,
          passwordToUse,
        );
        const user = userCredential.user;

        // Call Firebase Cloud Function to set referee claim
        const setRefereeClaim = httpsCallable(functions, "setRefereeClaim");
        await setRefereeClaim({ uid: user.uid });

        // Navigate to the Leaderboard after setting the claim
        navigate("/Leaderboard");
      } else {
        setIsRefereeLogin(false);

        // Regular user login
        const userCredential = await signInWithEmailAndPassword(
          FIREBASE_AUTH,
          emailToUse,
          passwordToUse,
        );
        navigate("/Leaderboard");
      }
    } catch (error) {
      setError(`Login failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleAboutUs = () => {
    setIsAboutVisible(!isAboutVisible); // Toggle About Us box visibility
  };

  return (
    <>
      <div className="LoginContainer">
        <img src={CrosspointxLogo} alt="Logo" className="Logo" />
        <h1 className="LoginTitle">Login</h1>
        <div className="LoginToggleContainer">
          <button
            className={`LoginToggleButton ${!isRefereeLogin ? "active-toggle" : ""}`}
            onClick={() => setIsRefereeLogin(false)}
          >
            {" "}
            User{" "}
          </button>
          <button
            className={`LoginToggleButton ${isRefereeLogin ? "active-toggle" : ""}`}
            onClick={() => setIsRefereeLogin(true)}
          >
            {" "}
            Ref{" "}
          </button>
        </div>
        <form onSubmit={handleLogin}>
          {" "}
          {/* Add the form element */}
          <input
            className="LoginInput"
            type="text"
            placeholder={isRefereeLogin ? "Ref ID" : "Email"}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
          <input
            className="LoginInput"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="LoginErrorMessage">{error}</div>}
          <button type="submit" className="button">
            {" "}
            {/* Button is now part of the form */}
            {loading ? "Loading..." : "Login"}
          </button>
        </form>

        <div className="SignupLink">
          <Link
            to={isRefereeLogin ? "/refsignup" : "/signup"}
            className="LinkText"
          >
            {isRefereeLogin ? "" : "Don't have an account? Sign up here"}
          </Link>
        </div>

        {/* Button to toggle About Us */}
        <text className="AboutUsToggleButton" onClick={toggleAboutUs}>
          {isAboutVisible ? "Hide About Us" : "About Us"}
        </text>
      </div>

      {/* Socials Section Outside the Login Container */}
      <div className="socials">
        <a
          href="https://discord.gg/qxg5pMna"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <span>Discord</span>
          <FaDiscord />
        </a>
        <a
          href="https://www.instagram.com/cpx_technologies/"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <span>Instagram</span>
          <FaInstagram />
        </a>
        <a
          href="https://www.tiktok.com/@cross.pointx?_t=8qHNa5dPqJi&_r=1"
          target="_blank"
          rel="noopener noreferrer"
          className="social-icon"
        >
          <span>Tiktok</span>
          <FaTiktok />
        </a>
        <a href="mailto:pointxcross@gmail.com" className="social-icon">
          <span>Email</span>
          <FaEnvelope />
        </a>
      </div>

      {/* The About Us Box */}
      <div className={`AboutUsBox ${isAboutVisible ? "show" : "hide"}`}>
        <h1>About Us</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus
          lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod
          malesuada.
        </p>
      </div>
    </>
  );
};

export default Login;
