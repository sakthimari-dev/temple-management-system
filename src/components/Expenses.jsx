import React, { useState, useEffect, useMemo, useRef } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Expenses.css";

/*
  Temple Expense Management
  --------------------------------------------------
  - Expenses are persisted to localStorage under "templeExpenses".
  - Total Donation is read from localStorage under "templeData"
    (an array of records shaped like { gpay: number, cash: number, ... })
    so this module stays in sync with the Dashboard's Grand Total.
  - Category is now a free-typed field (no fixed dropdown). A datalist
    is offered purely as a convenience autocomplete; any text is valid.
  - Each expense record now also stores bookNo and voucherNo.
  - Description is optional.
  - Requires: npm install jspdf jspdf-autotable

  NOTE ON BACKEND / DATABASE:
  This module currently persists to localStorage only (there is no
  server API call in this file). The expense record shape below is
  what should be mirrored in the backend Expense model / DB migration
  and validation layer if/when this is wired to a real API:

    {
      id: string,          // e.g. "EXP-0001"
      date: string,         // "YYYY-MM-DD"
      category: string,     // free text, required
      description: string,  // optional, nullable
      amount: number,        // required, > 0
      paidBy: string,        // required
      bookNo: string,        // optional
      voucherNo: string,     // optional
      remark: string          // optional
    }

  Suggested backend changes:
    - Expense model: change `category` column/field from an enum/lookup
      reference to a plain string column; add `bookNo` and `voucherNo`
      string columns; make `description` nullable.
    - Validation: category/date/amount/paidBy required; description,
      bookNo, voucherNo, remark optional.
    - Migration: ALTER TABLE expenses
        ADD COLUMN book_no VARCHAR(255) NULL,
        ADD COLUMN voucher_no VARCHAR(255) NULL,
        MODIFY COLUMN description TEXT NULL,
        MODIFY COLUMN category VARCHAR(255) NOT NULL; -- drop enum constraint if any
*/

const EXPENSE_STORAGE_KEY = "templeExpenses";
const DONATION_STORAGE_KEY = "templeData";

// Suggestions only (datalist) - category is now free text, not a locked dropdown.
const CATEGORY_SUGGESTIONS = [
  "Pooja Expense",
  "Decoration",
  "Electricity",
  "Water",
  "Salary",
  "Maintenance",
  "Festival Expense",
  "Flower",
  "Cleaning",
  "Others",
];

const EMPTY_FORM = {
  date: "",
  category: "",
  description: "",
  amount: "",
  paidBy: "",
  bookNo: "",
  voucherNo: "",
  remark: "",
};

// Used for on-screen display (₹ renders fine in the browser)
const currency = (value) =>
  `₹ ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

// Used only inside the jsPDF report - jsPDF's default font does not
// support the ₹ glyph, so it renders as a broken character. "Rs." is
// used instead to keep the PDF clean and readable.
const currencyPdf = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const monthKey = (dateStr) => {
  if (!dateStr) return "";
  return dateStr.slice(0, 7); // YYYY-MM
};

const generateExpenseId = (expenses) => {
  const maxNum = expenses.reduce((max, exp) => {
    const num = parseInt(String(exp.id).replace(/\D/g, ""), 10) || 0;
    return Math.max(max, num);
  }, 0);
  return `EXP-${String(maxNum + 1).padStart(4, "0")}`;
};

const readTotalDonation = () => {
  try {
    const storedEntries = JSON.parse(
      localStorage.getItem(DONATION_STORAGE_KEY) || "[]"
    );
    if (!Array.isArray(storedEntries)) return 0;
    return storedEntries.reduce((sum, entry) => {
      const gpay = Number(entry.gpay) || 0;
      const cash = Number(entry.cash) || 0;
      return sum + gpay + cash;
    }, 0);
  } catch {
    return 0;
  }
};

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [totalDonation, setTotalDonation] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [searchField, setSearchField] = useState("category");
  const [filterDate, setFilterDate] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [toast, setToast] = useState(null);
  const formRef = useRef(null);

  // ---------- Load from localStorage ----------
  useEffect(() => {
    try {
      const storedExpenses = JSON.parse(
        localStorage.getItem(EXPENSE_STORAGE_KEY) || "[]"
      );
      setExpenses(Array.isArray(storedExpenses) ? storedExpenses : []);
    } catch {
      setExpenses([]);
    }

    setTotalDonation(readTotalDonation());
  }, []);

  // ---------- Keep Total Donation in sync with the Dashboard ----------
  // The Dashboard writes to the same "templeData" key. We listen for
  // the cross-tab "storage" event, and also for an optional in-app
  // "templeDonationsUpdated" custom event that the Dashboard module can
  // dispatch right after it saves, so the figure updates automatically
  // without a page refresh even within the same tab.
  useEffect(() => {
    const refreshDonationTotal = () => setTotalDonation(readTotalDonation());

    const handleStorage = (e) => {
      if (!e.key || e.key === DONATION_STORAGE_KEY) {
        refreshDonationTotal();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("templeDonationsUpdated", refreshDonationTotal);

    // Light polling fallback so this stays correct even if no event fires.
    const intervalId = window.setInterval(refreshDonationTotal, 4000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(
        "templeDonationsUpdated",
        refreshDonationTotal
      );
      window.clearInterval(intervalId);
    };
  }, []);

  // ---------- Persist to localStorage ----------
  useEffect(() => {
    localStorage.setItem(EXPENSE_STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2600);
  };

  // ---------- Derived totals ----------
  const totalExpenses = useMemo(
    () => expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses]
  );

  const availableBalance = totalDonation - totalExpenses;

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = `${prevDate.getFullYear()}-${String(
    prevDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const thisMonthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => monthKey(e.date) === currentMonthKey)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses, currentMonthKey]
  );

  const previousMonthExpenses = useMemo(
    () =>
      expenses
        .filter((e) => monthKey(e.date) === previousMonthKey)
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
    [expenses, previousMonthKey]
  );

  const categorySummary = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      const cat = (e.category || "Uncategorized").trim() || "Uncategorized";
      map[cat] = (map[cat] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).filter(([, amount]) => amount > 0);
  }, [expenses]);

  // ---------- Search & filter ----------
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      let matchesSearch = true;
      if (searchText.trim()) {
        const value = String(e[searchField] || "").toLowerCase();
        matchesSearch = value.includes(searchText.trim().toLowerCase());
      }
      let matchesDate = true;
      if (filterDate) {
        matchesDate = e.date === filterDate;
      }
      let matchesMonth = true;
      if (filterMonth) {
        matchesMonth = monthKey(e.date) === filterMonth;
      }
      return matchesSearch && matchesDate && matchesMonth;
    });
  }, [expenses, searchText, searchField, filterDate, filterMonth]);

  const clearFilters = () => {
    setSearchText("");
    setSearchField("category");
    setFilterDate("");
    setFilterMonth("");
  };

  // ---------- Form handling ----------
  const handleFormChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.date) nextErrors.date = "Expense date is required";
    if (!form.category.trim()) nextErrors.category = "Category is required";
    // Description is optional - no validation here.
    if (!form.amount || Number(form.amount) <= 0)
      nextErrors.amount = "Enter a valid amount";
    if (!form.paidBy.trim()) nextErrors.paidBy = "Paid by is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please fill all required fields", "error");
      return;
    }

    if (editingId) {
      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === editingId
            ? { ...exp, ...form, amount: Number(form.amount) }
            : exp
        )
      );
      showToast("Expense updated successfully");
    } else {
      const newExpense = {
        id: generateExpenseId(expenses),
        ...form,
        amount: Number(form.amount),
      };
      setExpenses((prev) => [newExpense, ...prev]);
      showToast("Expense added successfully");
    }
    resetForm();
  };

  const handleEdit = (expense) => {
    setForm({
      date: expense.date,
      category: expense.category,
      description: expense.description || "",
      amount: String(expense.amount),
      paidBy: expense.paidBy,
      bookNo: expense.bookNo || "",
      voucherNo: expense.voucherNo || "",
      remark: expense.remark || "",
    });
    setEditingId(expense.id);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this expense entry? This cannot be undone.")) {
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
      if (editingId === id) resetForm();
      showToast("Expense deleted", "error");
    }
  };

  // ---------- PDF Report ----------
  const handleDownloadReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(141, 106, 41);
    doc.rect(0, 0, pageWidth, 26, "F");
    doc.setTextColor(255, 248, 231);
    doc.setFontSize(18);
    doc.text("Temple Expense Report", pageWidth / 2, 14, { align: "center" });
    doc.setFontSize(10);
    doc.text(
      `Generated on ${new Date().toLocaleDateString("en-IN")}`,
      pageWidth / 2,
      21,
      { align: "center" }
    );

    doc.setTextColor(40, 40, 40);
    let cursorY = 36;

    doc.setFontSize(12);
    doc.setTextColor(141, 106, 41);
    doc.text("Expense Details", 14, cursorY);
    cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      head: [
        [
          "ID",
          "Date",
          "Category",
          "Book No",
          "Voucher No",
          "Description",
          "Amount",
          "Paid By",
          "Remark",
        ],
      ],
      body: filteredExpenses.map((e) => [
        e.id,
        e.date,
        e.category,
        e.bookNo || "-",
        e.voucherNo || "-",
        e.description || "-",
        currencyPdf(e.amount),
        e.paidBy,
        e.remark || "-",
      ]),
      headStyles: { fillColor: [196, 155, 61], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 248, 231] },
      styles: { fontSize: 7.5, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    let afterTableY = doc.lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setTextColor(141, 106, 41);
    doc.text("Category Wise Summary", 14, afterTableY);
    afterTableY += 4;

    autoTable(doc, {
      startY: afterTableY,
      head: [["Category", "Total Amount"]],
      body: categorySummary.map(([cat, amount]) => [cat, currencyPdf(amount)]),
      headStyles: { fillColor: [196, 155, 61], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [255, 248, 231] },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    let summaryY = doc.lastAutoTable.finalY + 12;
    doc.setDrawColor(196, 155, 61);
    doc.line(14, summaryY, pageWidth - 14, summaryY);
    summaryY += 8;

    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Donations: ${currencyPdf(totalDonation)}`, 14, summaryY);
    summaryY += 7;
    doc.text(`Total Expenses: ${currencyPdf(totalExpenses)}`, 14, summaryY);
    summaryY += 7;
    doc.setTextColor(141, 106, 41);
    doc.text(
      `Remaining Balance: ${currencyPdf(availableBalance)}`,
      14,
      summaryY
    );

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Generated by Temple Management System",
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );

    doc.save(`Temple-Expense-Report-${Date.now()}.pdf`);
  };

  return (
    <div className="expenses-page">
      <header className="expenses-header fade-in">
        <h1>Temple Expense Management</h1>
        <p>Track and manage all temple expenses efficiently.</p>
      </header>

      {toast && (
        <div className={`expenses-toast ${toast.type}`}>{toast.message}</div>
      )}

      {/* ---------- Summary Cards ---------- */}
      <section className="summary-grid slide-up">
        <div className="summary-card card-donation">
          <span className="summary-icon">💰</span>
          <div className="summary-body">
            <p className="summary-label">Total Donation</p>
            <p className="summary-value">{currency(totalDonation)}</p>
          </div>
        </div>
        <div className="summary-card card-expense">
          <span className="summary-icon">💸</span>
          <div className="summary-body">
            <p className="summary-label">Total Expenses</p>
            <p className="summary-value">{currency(totalExpenses)}</p>
          </div>
        </div>
        <div className="summary-card card-balance">
          <span className="summary-icon">📈</span>
          <div className="summary-body">
            <p className="summary-label">Available Balance</p>
            <p className="summary-value">{currency(availableBalance)}</p>
          </div>
        </div>
      </section>

      {/* ---------- Add Expense Form ---------- */}
      <section className="panel form-panel slide-up" ref={formRef}>
        <div className="panel-heading">
          <h2>{editingId ? "Edit Expense" : "Add Expense"}</h2>
          <span className="panel-divider" />
        </div>

        <form className="expense-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="date">Expense Date *</label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={handleFormChange("date")}
                className={errors.date ? "input-error" : ""}
              />
              {errors.date && <span className="field-error">{errors.date}</span>}
            </div>

            <div className="form-field">
              <label htmlFor="category">Category *</label>
              <input
                id="category"
                type="text"
                list="category-suggestions"
                placeholder="e.g. Electricity, Flower, Salary"
                value={form.category}
                onChange={handleFormChange("category")}
                className={errors.category ? "input-error" : ""}
              />
              <datalist id="category-suggestions">
                {CATEGORY_SUGGESTIONS.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
              {errors.category && (
                <span className="field-error">{errors.category}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="amount">Amount (₹) *</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={handleFormChange("amount")}
                className={errors.amount ? "input-error" : ""}
              />
              {errors.amount && (
                <span className="field-error">{errors.amount}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="paidBy">Paid By *</label>
              <input
                id="paidBy"
                type="text"
                placeholder="e.g. Temple Trust"
                value={form.paidBy}
                onChange={handleFormChange("paidBy")}
                className={errors.paidBy ? "input-error" : ""}
              />
              {errors.paidBy && (
                <span className="field-error">{errors.paidBy}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="bookNo">Book No</label>
              <input
                id="bookNo"
                type="text"
                placeholder="Enter Book No"
                value={form.bookNo}
                onChange={handleFormChange("bookNo")}
              />
            </div>

            <div className="form-field">
              <label htmlFor="voucherNo">Voucher No</label>
              <input
                id="voucherNo"
                type="text"
                placeholder="Enter Voucher No"
                value={form.voucherNo}
                onChange={handleFormChange("voucherNo")}
              />
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="description">Description</label>
              <input
                id="description"
                type="text"
                placeholder="Describe the expense (optional)"
                value={form.description}
                onChange={handleFormChange("description")}
                className={errors.description ? "input-error" : ""}
              />
              {errors.description && (
                <span className="field-error">{errors.description}</span>
              )}
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="remark">Remark</label>
              <input
                id="remark"
                type="text"
                placeholder="Optional note"
                value={form.remark}
                onChange={handleFormChange("remark")}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingId ? "Update Expense" : "Add Expense"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Reset
            </button>
          </div>
        </form>
      </section>

      {/* ---------- Search & Filter ---------- */}
      <section className="panel filter-panel slide-up">
        <div className="panel-heading">
          <h2>Search &amp; Filter</h2>
          <span className="panel-divider" />
        </div>

        <div className="filter-grid">
          <div className="form-field">
            <label htmlFor="searchField">Search By</label>
            <select
              id="searchField"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
            >
              <option value="category">Category</option>
              <option value="description">Description</option>
              <option value="paidBy">Paid By</option>
              <option value="bookNo">Book No</option>
              <option value="voucherNo">Voucher No</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="searchText">Keyword</label>
            <input
              id="searchText"
              type="text"
              placeholder="Type to search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="filterDate">Filter by Date</label>
            <input
              id="filterDate"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="filterMonth">Filter by Month</label>
            <input
              id="filterMonth"
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => showToast("Filters applied")}
          >
            Search
          </button>
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </section>

      {/* ---------- Expenses Table ---------- */}
      <section className="panel table-panel slide-up">
        <div className="panel-heading">
          <h2>Expense Records</h2>
          <span className="panel-divider" />
          <div className="panel-heading-actions">
            <button className="btn-download" onClick={handleDownloadReport}>
              ⬇ Download Expense Report
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="expense-table">
            <thead>
              <tr>
                <th>Expense ID</th>
                <th>Date</th>
                <th>Category</th>
                <th>Book No</th>
                <th>Voucher No</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Paid By</th>
                <th>Remark</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-row">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.id}</td>
                    <td>{expense.date}</td>
                    <td>
                      <span className="category-pill">{expense.category}</span>
                    </td>
                    <td>{expense.bookNo || "-"}</td>
                    <td>{expense.voucherNo || "-"}</td>
                    <td>{expense.description || "-"}</td>
                    <td className="amount-cell">{currency(expense.amount)}</td>
                    <td>{expense.paidBy}</td>
                    <td>{expense.remark || "-"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="icon-btn edit-btn"
                          onClick={() => handleEdit(expense)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className="icon-btn delete-btn"
                          onClick={() => handleDelete(expense.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Category Summary ---------- */}
      <section className="panel slide-up">
        <div className="panel-heading">
          <h2>Category Wise Expense Summary</h2>
          <span className="panel-divider" />
        </div>
        <div className="category-grid">
          {categorySummary.length === 0 ? (
            <p className="empty-text">No expenses recorded yet.</p>
          ) : (
            categorySummary.map(([cat, amount]) => (
              <div className="category-card" key={cat}>
                <p className="category-name">{cat}</p>
                <p className="category-amount">{currency(amount)}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}