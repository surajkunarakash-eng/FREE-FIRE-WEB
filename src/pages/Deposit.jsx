import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Deposit.css";

const AMOUNTS = [50, 100, 200, 300, 400, 500, 1000, 5000];

export default function Deposit() {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const handleProceed = () => {
    // ✅ Step 1: Check login
    const stored = localStorage.getItem("bgmi_user");
    if (!stored) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    // ✅ Step 2: Check amount
    if (!selected) {
      alert("Please select amount");
      return;
    }

    // ✅ Step 3: Validate user data
    try {
      const parsed = JSON.parse(stored);
      const email = parsed.user?.email || parsed.email;

      if (!email) {
        alert("Invalid session, please login again");
        localStorage.removeItem("bgmi_user");
        navigate("/login");
        return;
      }

      console.log("👤 Deposit user:", email);

    } catch (err) {
      console.error("❌ localStorage error:", err);
      localStorage.removeItem("bgmi_user");
      navigate("/login");
      return;
    }

    // ✅ Step 4: Navigate (ONLY amount)
    navigate("/deposit/qr", {
      state: {
        amount: selected
      }
    });
  };

  return (
    <div className="deposit-page">
      <h2 className="deposit-title">Deposit</h2>
      <p className="deposit-subtitle">
        Select amount to add in wallet
      </p>

      <div className="amount-grid">
        {AMOUNTS.map((amt) => (
          <button
            key={amt}
            type="button"
            className={`amount-btn ${selected === amt ? "active" : ""}`}
            onClick={() => setSelected(amt)}
          >
            ₹{amt}
          </button>
        ))}
      </div>

      <button
        className="deposit-action"
        disabled={!selected}
        onClick={handleProceed}
      >
        Proceed to Pay
      </button>
    </div>
  );
}
