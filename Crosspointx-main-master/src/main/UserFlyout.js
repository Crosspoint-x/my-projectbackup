import React, { useEffect, useState } from "react";
import {
  Popper,
  Paper,
  IconButton,
  Typography,
  Grid,
  Avatar,
  Box,
  Divider,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import QRCode from "react-qr-code";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "@firebase/storage";
import { doc, updateDoc, getDoc } from "@firebase/firestore";
import { getAuth, updateProfile } from "@firebase/auth";
import { FIREBASE_APP, FIREBASE_STORE, FIREBASE_STORAGE } from "../firebase";

function UserFlyout({ anchorEl, open, onClose, user, onUpdatePfp }) {
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hovered, setHovered] = useState(false);

  // Fetch user stats from Firestore
  useEffect(() => {
    if (user?.id) {
      const fetchUserStats = async () => {
        setLoading(true);
        try {
          // Adjust the collection path to point to 'users' instead of 'players'
          const userRef = doc(FIREBASE_STORE, "users", user.id);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUserStats(userSnap.data());
          } else {
            setError("User data not found.");
          }
        } catch (err) {
          setError("Failed to load user stats.");
        } finally {
          setLoading(false);
        }
      };

      fetchUserStats();
    }
  }, [user?.id]);

  // Handle avatar click and file input
  const handleAvatarClick = () => {
    document.getElementById("avatar-input").click();
  };

  // Handle avatar file change
  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        // Upload avatar to Firebase Storage
        const storageRef = ref(
          FIREBASE_STORAGE,
          `avatars/${user.id}/${file.name}`
        );
        const uploadTask = uploadBytesResumable(storageRef, file);

        // Get the download URL after upload completes
        uploadTask.on(
          "state_changed",
          null,
          (err) => console.error("Upload failed", err),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Update Firestore with the new photo URL
            const auth = getAuth();
            const userRef = doc(FIREBASE_STORE, "users", user.id);
            await updateProfile(auth.currentUser, {
              photoURL: downloadURL,
            });

            // Notify parent component about the update
            onUpdatePfp(downloadURL);
          }
        );
      } catch (err) {
        console.error("Failed to upload avatar:", err);
      }
    }
  };

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement="bottom-end"
      style={{ zIndex: 1300 }}
    >
      <Paper
        elevation={4}
        sx={{
          width: 300,
          borderRadius: 3,
          padding: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <IconButton
          sx={{ alignSelf: "flex-end", marginBottom: 1 }}
          onClick={onClose}
          aria-label="Close"
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            position: "relative",
            cursor: "pointer",
            width: 80,
            height: 80,
            marginBottom: 1,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={handleAvatarClick}
        >
          <Avatar
            alt={user?.name || "Unknown Player"}
            src={user?.photoURL || "https://via.placeholder.com/150"}
            sx={{ width: 80, height: 80 }}
          />
          {hovered && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                borderRadius: "50%",
              }}
            >
              <CameraAltIcon sx={{ color: "white" }} />
            </Box>
          )}
          <input
            id="avatar-input"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 1 }}>
          {user?.name || "User"}
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ marginBottom: 2 }}
        >
          User ID: {user?.id}
        </Typography>

        <Divider sx={{ width: "100%", marginY: 2 }} />

        {/* QR Code Section */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 2,
            backgroundColor: "#f5f5f5",
            borderRadius: 2,
            marginBottom: 2,
          }}
        >
          <QRCode value={user?.id} size={80} />
        </Box>

        {/* Stats Section */}
        {loading ? (
          <CircularProgress sx={{ marginY: 2 }} />
        ) : error ? (
          <Typography color="error" sx={{ marginY: 2 }}>
            {error}
          </Typography>
        ) : (
          <Box
            sx={{
              width: "100%",
              padding: 2,
              backgroundColor: "#f9f9f9",
              borderRadius: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontWeight: "bold", marginBottom: 1 }}
            >
              Personal Stats
            </Typography>
            <Grid container spacing={1}>
              {userStats &&
                Object.entries(userStats).map(([key, value]) => (
                  <Grid container item xs={12} key={key}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                        :
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="right">
                        {value}
                      </Typography>
                    </Grid>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Popper>
  );
}

export default UserFlyout;