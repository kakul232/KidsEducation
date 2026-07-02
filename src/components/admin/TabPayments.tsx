import React, { useState } from "react";
import { Check, Clock, CreditCard } from "lucide-react";
import LocalDB from "../../services/db";
import type { PaymentRecord } from "../../services/db";

interface TabPaymentsProps {
  payments: PaymentRecord[];
  onRefresh: () => void;
}

export const TabPayments: React.FC<TabPaymentsProps> = ({
  payments,
  onRefresh
}) => {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprovePayment = async (paymentId: string) => {
    try {
      setIsApproving(true);
      await LocalDB.approvePayment(paymentId);
      alert("Payment approved and student premium validity extended by 1 month!");
      onRefresh();
    } catch (err: any) {
      console.error("Failed to approve payment:", err);
      alert("Failed to approve payment: " + err.message);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="play-card">
      <div className="admin-payment-header">
        <div className="admin-payment-icon">
          <CreditCard size={24} />
        </div>
        <div>
          <h3>UPI Tuition Fee Payments</h3>
          <p>Review pending parent UPI payments and activate premium tiers</p>
        </div>
      </div>

      {isApproving ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>Approving payment...</p>
      ) : payments.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px", fontWeight: "600" }}>
          No payments recorded yet. 😊
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="admin-payment-table">
            <thead>
              <tr style={{ color: "var(--text-secondary)" }}>
                <th>Student Details</th>
                <th>Parent Phone</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Requested On</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr key={pay.id} className="payment-row">
                  <td className="student-col">{pay.studentName}</td>
                  <td>{pay.parentPhone}</td>
                  <td className="txn-col">{pay.txnId}</td>
                  <td className="amount-col">₹{pay.amount}</td>
                  <td className="date-col">{new Date(pay.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`payment-status-badge ${pay.status === "paid" ? "paid" : "pending"}`}>
                      {pay.status === "paid" ? (
                        <>
                          <Check size={12} /> Approved
                        </>
                      ) : (
                        <>
                          <Clock size={12} /> Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="actions-col">
                    {pay.status === "pending" ? (
                      <button
                        onClick={() => handleApprovePayment(pay.id)}
                        className="btn payment-approve-btn"
                      >
                        Approve & Paid
                      </button>
                    ) : (
                      <span className="payment-approved-label">
                        Activated ✅
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TabPayments;
