import React, { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
} from "react-router";
import { onAuthStateChanged } from "@firebase/auth";
import {
  BottomNavigation,
  BottomNavigationAction,
  Popper,
  Paper,
  MenuItem,
} from "@mui/material";
import SatelliteAltIcon from "@mui/icons-material/SatelliteAlt";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CrosspointxLogo from "./assets/Crosspointx.svg";
import LeaderboardIcon from "@mui/icons-material/Leaderboard";
import IconButton from "@mui/material/IconButton";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import Login from "./authentication/Login";
import SignUp from "./authentication/SignUp";
import QRCodeScannerComponent from "./referee/QRCodeScanner";
import Leaderboard from "./leaderboard/Leaderboard";
import "./App.css";
import LiveSessions from "./leaderboard/LiveSessions";
import MatchEntry from "./referee/MatchEntry";
import { getDoc, doc } from "@firebase/firestore";
import UserFlyout from "./main/UserFlyout";
import { FIREBASE_STORE, FIREBASE_AUTH } from "./firebase";
import { getPlayerID } from "./common";

const stripePromise = loadStripe(
  "pk_test_51Ow7goA466XWtdBiQakYrdadPmlpib7w6yeXTIxqo7enudMMl2Y5uEdGRGlmTOsChS5Jl0M1nkTiuCEbUZ8CgfTL00Y1tOYYMu",
);

// ProtectedRoute component to handle authentication
const ProtectedRoute = ({ children, user }) => {
  if (!user) {
    return <Navigate to="/Login" />;
  }
  return children;
};

function ProtectedRefRoute({ children, user }) {
  const [isReferee, setIsReferee] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRefereeStatus = async () => {
      try {
        if (user) {
          // Fetch the user's document from the 'refs' collection in Firestore
          const userDoc = await getDoc(doc(FIREBASE_STORE, "refs", user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("Fetched user data:", userData);

            // Set referee status based on 'isReferee' field in Firestore
            setIsReferee(userData?.isReferee || false); // Default to false if the field doesn't exist
          } else {
            console.error("User document does not exist in refs collection.");
            setIsReferee(false);
          }
        }
      } catch (error) {
        console.error("Error checking referee status:", error);
        setIsReferee(false);
      } finally {
        setLoading(false); // Always stop loading, regardless of success or error
      }
    };

    checkRefereeStatus();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>; // Show loading spinner while checking status
  }

  if (!isReferee) {
    return <div>Access Denied. Only referees can access this page.</div>; // Display access denied for non-refs
  }

  return children; // Render children if user is a referee
}

// Main App component
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      console.log("User state changed:", user);
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="root">
      <Router>
        <Elements stripe={stripePromise}>
          <Routes>
            <Route path="/Login" element={<Login />} />
            <Route path="/SignUp" element={<SignUp />} />
            <Route
              path="*"
              element={
                <ProtectedRoute user={user}>
                  <InsideLayout user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={<Navigate to={user ? "/Leaderboard" : "/Login"} />}
            />
          </Routes>
        </Elements>
      </Router>
    </div>
  );
}

// InsideLayout component
function InsideLayout({ user }) {
  const [value, setValue] = useState("/LiveSessions");
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [playerID, setPlayerID] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(FIREBASE_STORE, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setProfilePic(
              userData.photoURL || "https://example.com/default-profile.jpg",
            );
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    const getPID = async () => {
      if (user) {
        try {
          setPlayerID(await getPlayerID(user.uid));
        } catch (error) {
          console.error("Error fetching player id", error);
        }
      }
    };

    getPID();
    fetchUserProfile();
  }, [user]);

  const handleNavigationChange = (event, newValue) => {
    setValue(newValue);
    navigate(newValue);
  };

  const handleLogout = () => {
    FIREBASE_AUTH.signOut()
      .then(() => {
        navigate("/Login");
      })
      .catch((error) => {
        console.error("Logout error:", error);
      });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const toggleFlyout = (event) => {
    setAnchorEl(event.currentTarget);
    setFlyoutOpen((prev) => !prev);
  };

  return (
    <div className="InsideLayout">
      <div className="Back">
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
      </div>
      <div className="Logout">
        <IconButton onClick={handleLogout}>
          <LogoutIcon />
        </IconButton>
      </div>
      <div className="UserButton">
        <IconButton onClick={toggleFlyout}>
          <PersonIcon className="PersonIcon" />
        </IconButton>
        {/* UserFlyout component */}
        <UserFlyout
          anchorEl={anchorEl}
          open={flyoutOpen}
          onClose={() => setFlyoutOpen(false)}
          user={{
            id: playerID,
            photoURL: profilePic,
          }}
        />
      </div>
      <div className="content">
        <Routes>
          <Route path="/LiveSessions" element={<LiveSessions />} />
          <Route path="/Leaderboard" element={<Leaderboard />} />
          <Route path="/qr-code" element={<QRCodeScannerComponent />} />
          <Route path="/match-entry" element={<MatchEntry />} />
        </Routes>
      </div>

      <BottomNavigation
        value={value}
        onChange={handleNavigationChange}
        showLabels
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <BottomNavigationAction
          label="LiveSessions"
          value="/LiveSessions"
          icon={<SatelliteAltIcon />}
        />
        <BottomNavigationAction
          label="Leaderboard"
          value="/Leaderboard"
          icon={<LeaderboardIcon />}
        />
        <BottomNavigationAction
          label="QR Code"
          value="/qr-code"
          icon={<QrCodeIcon />}
        />
        <BottomNavigationAction
          label="Match Entry"
          value="/match-entry"
          icon={<QrCodeIcon />}
        />
      </BottomNavigation>
    </div>
  );
}
