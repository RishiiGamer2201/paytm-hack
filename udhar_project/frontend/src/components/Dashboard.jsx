import React from 'react';
import { Bell, CheckCircle } from 'lucide-react';

const Dashboard = ({ loading, data, onMarkPaid, onRemind }) => {
  if (loading) return null;

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        No records to display.
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Customer</th>
          <th>Amount</th>
          <th>Due Date</th>
          <th>Status</th>
          <th>Reminders</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((udhar) => {
          return (
            <tr key={udhar.Udhar_ID}>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                  {udhar.Customer_Name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {udhar.Customer_Phone}
                </div>
              </td>
              <td style={{ fontWeight: 600 }}>
                ₹{udhar.Amount.toLocaleString()}
              </td>
              <td>
                {new Date(udhar.Due_Date).toLocaleDateString()}
              </td>
              <td>
                <span style={{ 
                  backgroundColor: 'rgba(249, 115, 22, 0.1)', 
                  color: 'var(--accent)', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}>
                  {udhar.Status}
                </span>
              </td>
              <td style={{ fontSize: '0.9rem' }}>
                {udhar.Reminders_Sent} sent
              </td>
              <td>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn btn-action-remind"
                    onClick={() => onRemind(udhar.Udhar_ID)}
                  >
                    <Bell size={14}/> Send Link
                  </button>
                  <button 
                    className="btn btn-action-paid"
                    onClick={() => onMarkPaid(udhar.Udhar_ID)}
                  >
                    <CheckCircle size={14}/> Paid
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Dashboard;
