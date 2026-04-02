import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddUdharModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    Customer_Name: '',
    Customer_Phone: '+91',
    Amount: '',
    Due_Date: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      Amount: parseFloat(formData.Amount)
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Udhar</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input 
              type="text" 
              name="Customer_Name"
              className="form-input" 
              required
              placeholder="e.g. Ramesh Kumar"
              value={formData.Customer_Name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">WhatsApp Number</label>
            <input 
              type="text" 
              name="Customer_Phone"
              className="form-input" 
              required
              placeholder="+91..."
              value={formData.Customer_Phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input 
              type="number" 
              name="Amount"
              className="form-input" 
              required
              min="1"
              placeholder="e.g. 500"
              value={formData.Amount}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input 
              type="date" 
              name="Due_Date"
              className="form-input" 
              required
              value={formData.Due_Date}
              onChange={handleChange}
            />
            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
              Automatic reminders will trigger if unpaid after this date.
            </p>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Udhar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUdharModal;
