import React from "react";
import { KidsModal } from "../../../components/KidsModal";
import { useApp } from "../../../context/AppContext";
import LocalDB from "../../../services/db";

interface FrogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FrogModal: React.FC<FrogModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentStudent } = useApp();

  const handlePay = async () => {
    if (!currentStudent) return;
    const studentName = currentStudent.name || "Student";
    const studentId = currentStudent.id || "";
    const parentPhone = currentStudent.phone || "0000000000";
    const firstFour = studentName.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase() || "STUD";
    const lastFourPhone = parentPhone.slice(-4);
    const uniqueHex = Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0").toUpperCase();
    const txnId = `TN-${firstFour}-${lastFourPhone}-${uniqueHex}`;

    try {
      await LocalDB.createPaymentRecord({
        txnId,
        studentId,
        studentName,
        parentPhone,
        amount: 49,
        status: "pending",
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to create payment record:", err);
    }

    const payUrl = `upi://pay?pa=Q668504716@ybl&am=49&cu=INR&tn=${encodeURIComponent(studentName + " tution Fee")}&tr=${txnId}`;
    window.location.href = payUrl;
  };

  return (
    <KidsModal
      isOpen={isOpen}
      onClose={onClose}
      backgroundColor="#f0fdf4"
      borderColor="#22c55e"
      maxWidth="380px"
      padding="28px 24px"
      gap="16px"
      className="frog-modal"
    >
      <div className="frog-modal-icon">🐸</div>

      <h3 className="frog-modal-title">
        Frog Uncle's Magic! ✨
      </h3>

      <p className="frog-modal-desc">
        Want to unlock Premium and play games with your friends? <br />
        Ask your parent to call <strong>Frog Uncle</strong>! 📞
      </p>

      <a
        autoFocus
        href="tel:+919871229599"
        className="btn btn-success frog-modal-call"
      >
        <span>📞 Call Frog Uncle</span>
      </a>

      <button
        onClick={handlePay}
        className="btn frog-modal-pay"
      >
        <span>💳 Pay ₹49/month (Launch Offer)</span>
      </button>

      <div style={{ display: "flex", gap: "10px", width: "100%", marginTop: "8px" }}>
        <button
          onClick={onClose}
          className="btn btn-gray frog-modal-close"
        >
          Not Now
        </button>
      </div>
    </KidsModal>
  );
};
