import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
} from "@firebase/auth";
import { httpsCallable } from "@firebase/functions";
import {
  FIREBASE_AUTH,
  FIREBASE_APP,
  FIREBASE_STORE,
  FIREBASE_FUNCTIONS,
  FIREBASE_STORAGE,
} from "../firebase";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  onSnapshot,
} from "@firebase/firestore";
import { getStripePayments } from "@invertase/firestore-stripe-payments";
import { loadStripe } from "@stripe/stripe-js";
import { useNavigate } from "react-router";
import { ref, uploadString, getDownloadURL } from "@firebase/storage";
import { QRCodeCanvas } from "qrcode.react";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CrosspointxLogo from "../assets/Crosspointx.svg";
import "./SignUp.css";

// Configuration Constants
const refID = "8155180126";
const refPass = "786592";
const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLIC_KEY ||
    "pk_test_51Ow7goA466XWtdBiQakYrdadPmlpib7w6yeXTIxqo7enudMMl2Y5uEdGRGlmTOsChS5Jl0M1nkTiuCEbUZ8CgfTL00Y1tOYYMu",
);
const payments = getStripePayments(FIREBASE_APP, {
  firestore: FIREBASE_STORE,
  productsCollection: "products",
  customersCollection: "customers",
});
const subscriptionCost = 5.99;
const taxRate = 0.07;
const totalCost = (subscriptionCost * (1 + taxRate)).toFixed(2);

// Utility Function for QR Code Generation
const generateQRCode = async (userId, userEmail) => {
  const qrCodeData = `User ID: ${userId}\nEmail: ${userEmail}`;
  const qrCodeSVGElement = <QRCodeCanvas value={qrCodeData} size={200} />;
  const xml = new XMLSerializer().serializeToString(qrCodeSVGElement);
  const svg64 = btoa(xml);
  return `data:image/svg+xml;base64,${svg64}`;
};

// Main Signup Component
const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const signUp = httpsCallable(FIREBASE_FUNCTIONS, "userSignUp");
      await signUp({ email: email, password: password });
      await signInWithEmailAndPassword(FIREBASE_AUTH, email, password);

      navigate("/Leaderboard");
    } catch (err) {
      setError(err.message || "Error during signup or payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-up-container">
      {/* Back Button */}
      <div className="back-button-container">
        <IconButton onClick={() => navigate(-1)} className="back-button">
          <ArrowBackIcon />
        </IconButton>
      </div>

      <form onSubmit={handleSignUp} className="sign-up-form">
        <img src={CrosspointxLogo} alt="Logo" className="logo" />
        <h1>Sign Up & Subscribe</h1>

        {/* Email Input */}
        <div className="form-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* Password Input */}
        <div className="form-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Cost Breakdown */}
        <div className="cost-breakdown">
          <p>Subscription Cost: ${subscriptionCost.toFixed(2)}</p>
          <p>Tax: ${(subscriptionCost * taxRate).toFixed(2)}</p>
          <p>
            <strong>Total: ${totalCost}</strong>
          </p>
        </div>

        {/* Error Display */}
        {error && <div className="error-message">{error}</div>}

        {/* Redirect Message */}
        {redirecting && (
          <div className="loading-message">Redirecting to payment...</div>
        )}

        {/* Submit Button */}
        <button type="submit" disabled={loading || redirecting}>
          {loading ? "Processing..." : "Sign Up & Pay"}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
