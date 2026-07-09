import React, { useState, useEffect, useMemo } from 'react';
import './Dashboard.css';

function getBillBookRangeLabel(bookNo) {
  const BILLS_PER_BOOK = 25;
  const start = (bookNo - 1) * BILLS_PER_BOOK + 1;
  const end = bookNo * BILLS_PER_BOOK;
  return `${start}-${end}`;
}

export default function PublicView() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('templeData');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Could not load saved data', e);
      }
    }
  }, []);

  const totals = useMemo(() => {
    return entries.reduce((acc, entry) => {
      acc.gpay += Number(entry.gpay) || 0;
      acc.cash += Number(entry.cash) || 0;
      return acc;
    }, { gpay: 0, cash: 0 });
  }, [entries]);

  return (
    <div className="public-container">
      <div className="public-wrapper">
        {/* Header */}
        <div className="public-header slide-in-down">
          <div className="header-content">
            <div>
              <h1 className="public-title">Temple Visitor Records</h1>
              <p className="public-subtitle">View Donation and Visitor Information</p>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="public-section slide-in-up">
          <div className="section-header">
            <h2 className="section-title">Recent Entries</h2>
            <span className="entry-count">{entries.length}</span>
          </div>

          {entries.length === 0 ? (
            <p className="empty-state">No entries available.</p>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="entries-table">
                  <thead>
                    <tr className="table-header">
                      <th className="col-billno">Bill No.</th>
                      <th className="col-billbook">Bill Book No.</th>
                      <th className="col-name">Name</th>
                      <th className="col-address">Address</th>
                      <th className="col-phone">Phone Number</th>
                      <th className="col-gpay">GPay</th>
                      <th className="col-cash">Cash</th>
                      <th className="col-total">Total</th>
                      <th className="col-date">Date</th>
                      <th className="col-remark">Remark</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => {
                      const total = (Number(entry.gpay) || 0) + (Number(entry.cash) || 0);
                      return (
                        <tr key={entry.uniqueId} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                          <td className="col-billno">{entry.billNo}</td>
                          <td className="col-billbook" data-label="Bill Book">
                            Book {entry.billBook}
                            <span className="billbook-range"> ({getBillBookRangeLabel(entry.billBook)})</span>
                          </td>
                          <td className="col-name">{entry.name}</td>
                          <td className="col-address" data-label="Address">{entry.address}</td>
                          <td className="col-phone" data-label="Phone">{entry.phone}</td>
                          <td className="col-gpay" data-label="GPay">Rs. {entry.gpay}</td>
                          <td className="col-cash" data-label="Cash">Rs. {entry.cash}</td>
                          <td className="col-total" data-label="Total">Rs. {total}</td>
                          <td className="col-date" data-label="Date">{entry.date}</td>
                          <td className="col-remark" data-label="Remark">{entry.remark}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="public-totals">
                <span className="totals-chip gpay-chip">GPay Total: Rs. {totals.gpay}</span>
                <span className="totals-chip cash-chip">Cash Total: Rs. {totals.cash}</span>
                <span className="totals-chip grand-chip">Grand Total: Rs. {totals.gpay + totals.cash}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="public-footer">
          <p>Thank you for your contribution to the temple</p>
        </div>
      </div>
    </div>
  );
}