import React from "react";
import { Check, Clock, CreditCard } from "lucide-react";
import type { PaymentRecord } from "../../services/db";

interface TabPaymentsProps {
  payments: PaymentRecord[];
  handleApprovePayment: (id: string) => void;
  isDataLoading: boolean;
}

export const TabPayments: React.FC<TabPaymentsProps> = ({
  payments,
  handleApprovePayment,
  isDataLoading
}) => {
  return (
    <div className="play-card">
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <div
          style={{
            backgroundColor: "#eef2ff",
            color: "#4f46e5",
            borderRadius: "12px",
            padding: "10px",
            display: "inline-flex"
          }}
        >
          <CreditCard size={24} />
        </div>
        <div>
          <h3 style={{ fontSize: "1.2rem", margin: 0, fontWeight: "900", color: "var(--text-primary)" }}>
            UPI Tuition Fee Payments
          </h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
            Review pending parent UPI payments and activate premium tiers
          </p>
        </div>
      </div>

      {isDataLoading ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px" }}>Loading payments...</p>
      ) : payments.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "20px", fontWeight: "600" }}>
          No payments recorded yet. 😊
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 8px",
              textAlign: "left",
              fontSize: "0.9rem"
            }}
          >
            <thead>
              <tr style={{ color: "var(--text-secondary)" }}>
                <th style={{ padding: "8px 12px", fontWeight: "700" }}>Student Details</th>
                <th style={{ padding: "8px 12px", fontWeight: "700" }}>Parent Phone</th>
                <th style={{ padding: "8px 12px", fontWeight: "700" }}>Transaction ID</th>
                <th style={{ padding: "8px 12px", fontWeight: "700" }}>Amount</th>
                <th style={{ padding: "8px 12px", fontWeight: "700" }}>Requested On</th>
                <th style={{ padding: "8px 12px", fontWeight: "700" }}>Status</th>
                <th style={{ padding: "8px 12px", fontWeight: "700", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay) => (
                <tr
                  key={pay.id}
                  style={{
                    backgroundColor: "#f8fafc",
                    border: "2px solid #e2e8f0"
                  }}
                >
                  <td style={{ padding: "12px", borderRadius: "12px 0 0 12px", fontWeight: "700" }}>
                    {pay.studentName}
                  </td>
                  <td style={{ padding: "12px" }}>{pay.parentPhone}</td>
                  <td style={{ padding: "12px", fontFamily: "monospace", fontSize: "0.85rem", fontWeight: "600" }}>
                    {pay.txnId}
                  </td>
                  <td style={{ padding: "12px", fontWeight: "700", color: "#166534" }}>
                    ₹{pay.amount}
                  </td>
                  <td style={{ padding: "12px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {new Date(pay.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: "12px" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "800",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        backgroundColor: pay.status === "paid" ? "#d1fae5" : "#fef3c7",
                        color: pay.status === "paid" ? "#065f46" : "#d97706"
                      }}
                    >
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
                  <td style={{ padding: "12px", borderRadius: "0 12px 12px 0", textAlign: "right" }}>
                    {pay.status === "pending" ? (
                      <button
                        onClick={() => handleApprovePayment(pay.id)}
                        className="btn"
                        style={{
                          padding: "6px 12px",
                          fontSize: "0.8rem",
                          fontWeight: "800",
                          backgroundColor: "#22c55e",
                          color: "white",
                          border: "none",
                          borderRadius: "8px",
                          cursor: "pointer",
                          boxShadow: "0 2px 0 #16a34a"
                        }}
                      >
                        Approve & Paid
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#22c55e", fontWeight: "800" }}>
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
