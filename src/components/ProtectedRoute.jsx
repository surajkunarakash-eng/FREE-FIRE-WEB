import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

const ProtectedRoute = ({ children, redirectPath = "/login" }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribe;

    const checkAuth = async () => {
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log("🔍 Firebase auth check:", user ? "User found" : "No user");
        
        if (user) {
          // Email verification check
          if (user.emailVerified) {
            // Backend user data भी check कर लो (optional)
            try {
              const storedUser = localStorage.getItem("bgmi_user");
              if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                if (parsedUser.profile_id && parsedUser.username) {
                  // Perfect - both Firebase + localStorage ready
                  setIsAuthenticated(true);
                  console.log("✅ FULLY AUTHENTICATED");
                } else {
                  // Firebase hai but backend data missing - save it
                  const backendRes = await fetch("http://localhost:5001/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: user.email })
                  });
                  
                  if (backendRes.ok) {
                    const backendData = await backendRes.json();
                    localStorage.setItem("bgmi_user", JSON.stringify({
                      token: backendData.token,
                      user: backendData.user,
                      firebase_uid: user.uid,
                      verified: true
                    }));
                    setIsAuthenticated(true);
                  }
                }
              } else {
                // No localStorage - create basic user
                localStorage.setItem("bgmi_user", JSON.stringify({
                  uid: user.uid,
                  email: user.email,
                  username: user.email.split('@')[0],
                  profile_id: `user_${user.uid.slice(0, 8)}`,
                  verified: true
                }));
                setIsAuthenticated(true);
              }
            } catch (error) {
              console.warn("Backend unavailable - using Firebase only:", error);
              // Fallback - Firebase only
              localStorage.setItem("bgmi_user", JSON.stringify({
                uid: user.uid,
                email: user.email,
                username: user.email.split('@')[0],
                profile_id: `user_${user.uid.slice(0, 8)}`,
                verified: true
              }));
              setIsAuthenticated(true);
            }
            setLoading(false);
          } else {
            // Email not verified
            alert(`⚠️ ${user.email} verify karo! Inbox/spam check karo.`);
            localStorage.removeItem("bgmi_user");
            setIsAuthenticated(false);
            setLoading(false);
          }
        } else {
          // No Firebase user
          const stored = localStorage.getItem("bgmi_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (!parsed.verified) {
              localStorage.removeItem("bgmi_user");
            }
          }
          setIsAuthenticated(false);
          setLoading(false);
        }
      });
    };

    checkAuth();

    // Cleanup
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Loading screen
  if (loading) {
    return (
      <div style={{
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px',
        flexDirection: 'column',
        gap: 20
      }}>
        <div>🔄 Authenticating...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Firebase + Backend check</div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    console.log("❌ Not authenticated - redirecting to login");
    return <Navigate to={redirectPath} replace />;
  }

  // ✅ All good!
  console.log("✅ ProtectedRoute PASSED");
  return children;
};

export default ProtectedRoute;
