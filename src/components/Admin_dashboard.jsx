import React, { useState, useEffect, useMemo } from 'react';
import { NotoSansTamilRegular, NotoSansTamilBold } from '../fonts/NotoSansTamil';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import './Admin_dashboard.css';

// Fixed rule: 25 bill numbers per Bill Book
const BILLS_PER_BOOK = 25;

function getBillBookNumber(billNo) {
  const n = parseInt(billNo, 10);
  if (!n || n < 1) return null;
  return Math.ceil(n / BILLS_PER_BOOK);
}

function getBillBookRangeLabel(bookNo) {
  const start = (bookNo - 1) * BILLS_PER_BOOK + 1;
  const end = bookNo * BILLS_PER_BOOK;
  return `${start}-${end}`;
}

// collision-safe unique id generator
function generateUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const emptyForm = {
  billNo: '',
  billBook: '',
  name: '',
  address: '',
  phone: '',
  date: '',
  gpay: '',
  cash: '',
  remark: ''
};

/* ---------- Small inline icon set (no external icon dependency) ---------- */
const IconSearch = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconUser = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconPhone = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconMapPin = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const IconReceipt = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 2h16v20l-3-2-3 2-3-2-3 2-3-2-1 2z" />
    <line x1="8" y1="7" x2="16" y2="7" />
    <line x1="8" y1="11" x2="16" y2="11" />
  </svg>
);
const IconBook = (props) => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const IconPdf = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconPlus = (props) => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconEdit = (props) => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z" />
  </svg>
);
const IconTrash = (props) => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);
/* --------------------------------------------------------------------- */

// ---------- PDF THEME (matches Admin_dashboard.css gold palette) ----------
const PDF_COLORS = {
  gold: [141, 106, 41],
  goldLight: [212, 175, 90],
  brown: [61, 43, 18],
  brownSoft: [90, 69, 32],
  cream: [250, 246, 238],
  white: [255, 255, 255],
  gpayBlue: [26, 90, 168],
  gpayBlueBg: [225, 238, 252],
  cashGreen: [35, 122, 60],
  cashGreenBg: [224, 246, 229],
  goldBg: [250, 240, 217],
  rowEven: [255, 253, 249],
  rowOdd: [250, 245, 234],
  textMuted: [120, 105, 80],
};

function pdfFormatCurrency(num) {
  const n = Number(num) || 0;
  return "Rs. " + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function pdfFormatDateTime(date = new Date()) {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  let hh = date.getHours();
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${d}/${m}/${y} ${String(hh).padStart(2, "0")}:${mm} ${ampm}`;
}

// jsPDF has no Indic text-shaping, so Tamil is rendered via Canvas 2D
// (browser shapes it correctly) and placed into the PDF as a PNG image.
function containsTamil(str) {
  return /[\u0B80-\u0BFF]/.test(str || '');
}

let tamilCanvasFontsLoaded = false;
async function ensureTamilCanvasFonts() {
  if (tamilCanvasFontsLoaded) return;
  const regularFace = new FontFace(
    'NotoSansTamilCanvasRegular',
    `url(data:font/ttf;base64,${NotoSansTamilRegular})`
  );
  const boldFace = new FontFace(
    'NotoSansTamilCanvasBold',
    `url(data:font/ttf;base64,${NotoSansTamilBold})`
  );
  await regularFace.load();
  await boldFace.load();
  document.fonts.add(regularFace);
  document.fonts.add(boldFace);
  await document.fonts.ready;
  tamilCanvasFontsLoaded = true;
}

function renderTamilTextImage(text, fontSizePt, bold, colorRgb) {
  const scale = 4;
  const fontPx = fontSizePt * scale;
  const fontFamily = bold ? 'NotoSansTamilCanvasBold' : 'NotoSansTamilCanvasRegular';

  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  mctx.font = `${fontPx}px ${fontFamily}`;
  const metrics = mctx.measureText(text);

  const padPx = 3 * scale;
  const widthPx = Math.max(1, Math.ceil(metrics.width) + padPx * 2);
  const heightPx = Math.ceil(fontPx * 1.6);

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontPx}px ${fontFamily}`;
  ctx.fillStyle = `rgb(${colorRgb[0]}, ${colorRgb[1]}, ${colorRgb[2]})`;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, padPx, heightPx / 2);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: widthPx / scale,
    height: heightPx / scale,
  };
}

export default function AdminDashboard() {
  const [entries, setEntries] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState('');

  // Search states
  const [searchAddress, setSearchAddress] = useState('');
  const [searchBillBook, setSearchBillBook] = useState('');
  const [quickSearch, setQuickSearch] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [searchBillNo, setSearchBillNo] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Payment search states
  const [paymentType, setPaymentType] = useState('All');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(''); // NEW: amount filter

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

  useEffect(() => {
    try {
      localStorage.setItem('templeData', JSON.stringify(entries));
    } catch (e) {
      console.error('Could not save data to localStorage', e);
    }
  }, [entries]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'billNo') {
        const book = getBillBookNumber(value);
        updated.billBook = book || '';
      }
      return updated;
    });
  };

  function validateForm(data, currentEntries, currentEditingId) {
    if (!data.billNo || !data.name || !data.address || !data.phone || !data.date) {
      return 'Please fill Bill No, Name, Address, Phone and Date!';
    }

    const billNoNum = parseInt(data.billNo, 10);
    if (!billNoNum || billNoNum < 1 || String(billNoNum) !== String(data.billNo).trim()) {
      return 'Bill No must be a valid whole number greater than 0!';
    }

    const duplicate = currentEntries.some(
      entry => String(entry.billNo) === String(data.billNo) && entry.uniqueId !== currentEditingId
    );
    if (duplicate) {
      return `Bill No ${data.billNo} is already used by another entry!`;
    }

    if (!data.gpay && !data.cash) {
      return 'Please enter GPay amount or Cash amount (at least one)!';
    }

    const gpayNum = Number(data.gpay) || 0;
    const cashNum = Number(data.cash) || 0;
    if (gpayNum < 0 || cashNum < 0) {
      return 'GPay and Cash amounts cannot be negative!';
    }

    const phoneDigits = data.phone.replace(/\D/g, '');
    if (phoneDigits.length !== 10) {
      return 'Phone number must be 10 digits!';
    }

    return '';
  }

  const handleAddEntry = (e) => {
    e.preventDefault();

    const error = validateForm(formData, entries, editingId);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError('');

    const billBook = getBillBookNumber(formData.billNo);
    const finalData = {
      ...formData,
      billBook,
      gpay: formData.gpay || '0',
      cash: formData.cash || '0'
    };

    if (editingId) {
      setEntries(entries.map(entry =>
        entry.uniqueId === editingId
          ? { ...entry, ...finalData }
          : entry
      ));
      setEditingId(null);
    } else {
      const newEntry = {
        ...finalData,
        uniqueId: generateUniqueId()
      };
      setEntries([...entries, newEntry]);
    }

    setFormData(emptyForm);
    setShowForm(false);
  };

  const handleEdit = (entry) => {
    setFormData({
      billNo: entry.billNo,
      billBook: entry.billBook,
      name: entry.name,
      address: entry.address,
      phone: entry.phone,
      date: entry.date,
      gpay: entry.gpay,
      cash: entry.cash,
      remark: entry.remark || ''
    });
    setEditingId(entry.uniqueId);
    setFormError('');
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError('');
  };

  const handleDelete = (uniqueId) => {
    const confirmed = window.confirm('Are you sure you want to delete this entry?');
    if (!confirmed) return;

    setEntries(prevEntries => prevEntries.filter(entry => entry.uniqueId !== uniqueId));

    if (editingId === uniqueId) {
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
    }
  };

  // Filtering logic: all search fields combine (AND)
  const filteredEntries = useMemo(() => {
    const q = quickSearch.trim().toLowerCase();
    const paySearch = paymentSearch.trim().toLowerCase();
    const amt = paymentAmount.trim();

    return entries.filter(entry => {
      const quickMatch = q === '' ||
        (entry.name || '').toLowerCase().includes(q) ||
        (entry.address || '').toLowerCase().includes(q) ||
        (entry.phone || '').toLowerCase().includes(q) ||
        String(entry.billNo || '').toLowerCase().includes(q);

      const addressMatch = searchAddress.trim() === '' ||
        (entry.address || '').toLowerCase().includes(searchAddress.trim().toLowerCase());

      const billBookMatch = searchBillBook.trim() === '' ||
        String(entry.billBook) === searchBillBook.trim();

      const nameMatch = searchName.trim() === '' ||
        (entry.name || '').toLowerCase().includes(searchName.trim().toLowerCase());

      const phoneMatch = searchPhone.trim() === '' ||
        (entry.phone || '').toLowerCase().includes(searchPhone.trim().toLowerCase());

      const billNoMatch = searchBillNo.trim() === '' ||
        String(entry.billNo || '').toLowerCase().includes(searchBillNo.trim().toLowerCase());

      // Payment match (type + name + exact amount)
      let paymentMatch = true;
      const nameOk = paySearch === '' || (entry.name || '').toLowerCase().includes(paySearch);

      if (paymentType === 'GPay') {
        const amtOk = amt === '' ? Number(entry.gpay) > 0 : Number(entry.gpay) >= Number(amt);
        paymentMatch = amtOk && nameOk;
      } else if (paymentType === 'Cash') {
        const amtOk = amt === '' ? Number(entry.cash) > 0 : Number(entry.cash) >= Number(amt);
        paymentMatch = amtOk && nameOk;
      } else if (amt !== '') {
        // "All" + amount => combined GPay + Cash total is >= the amount
        paymentMatch = (Number(entry.gpay) || 0) + (Number(entry.cash) || 0) >= Number(amt);
      }

      return quickMatch && addressMatch && billBookMatch && nameMatch && phoneMatch &&
        billNoMatch && paymentMatch;
    });
  }, [
    entries, searchAddress, searchBillBook, quickSearch, searchName, searchPhone, searchBillNo,
    paymentType, paymentSearch, paymentAmount
  ]);

  const totals = useMemo(() => {
    return filteredEntries.reduce((acc, entry) => {
      acc.gpay += Number(entry.gpay) || 0;
      acc.cash += Number(entry.cash) || 0;
      return acc;
    }, { gpay: 0, cash: 0 });
  }, [filteredEntries]);

  // ================= PREMIUM PDF EXPORT =================
  const downloadPDF = async () => {
    await ensureTamilCanvasFonts();

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.addFileToVFS("NotoSansTamil-Regular.ttf", NotoSansTamilRegular);
    doc.addFont("NotoSansTamil-Regular.ttf", "NotoSansTamil", "normal");
    doc.addFileToVFS("NotoSansTamil-Bold.ttf", NotoSansTamilBold);
    doc.addFont("NotoSansTamil-Bold.ttf", "NotoSansTamil", "bold");

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 32;

    const totalGpay = totals.gpay;
    const totalCash = totals.cash;
    const grandTotal = totalGpay + totalCash;

    function drawHeader() {
      doc.setFont("NotoSansTamil", "bold");
      doc.setFontSize(20);
      doc.setTextColor(...PDF_COLORS.gold);
      doc.text("TEMPLE DONATION MANAGEMENT SYSTEM", pageWidth / 2, margin + 6, { align: "center" });

      doc.setFont("NotoSansTamil", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...PDF_COLORS.brownSoft);
      doc.text(`Generated On: ${pdfFormatDateTime()}`, pageWidth / 2, margin + 24, { align: "center" });

      const sepY = margin + 36;
      doc.setDrawColor(...PDF_COLORS.gold);
      doc.setLineWidth(1.2);
      doc.line(margin, sepY, pageWidth - margin, sepY);

      return sepY;
    }

    const headerBottomY = drawHeader();

    const cardsY = headerBottomY + 16;
    const cardHeight = 52;
    const cardGap = 16;
    const cardWidth = (pageWidth - margin * 2 - cardGap * 2) / 3;

    function drawCard(x, y, w, h, bg, border, label, value, valueColor) {
      doc.setFillColor(...bg);
      doc.setDrawColor(...border);
      doc.setLineWidth(1);
      doc.roundedRect(x, y, w, h, 8, 8, "FD");

      doc.setFont("NotoSansTamil", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(...border);
      doc.text(label, x + w / 2, y + 19, { align: "center" });

      doc.setFont("NotoSansTamil", "bold");
      doc.setFontSize(17);
      doc.setTextColor(...valueColor);
      doc.text(value, x + w / 2, y + 40, { align: "center" });
    }

    drawCard(margin, cardsY, cardWidth, cardHeight, PDF_COLORS.gpayBlueBg, PDF_COLORS.gpayBlue,
      "GPay Collection", pdfFormatCurrency(totalGpay), PDF_COLORS.gpayBlue);

    drawCard(margin + cardWidth + cardGap, cardsY, cardWidth, cardHeight, PDF_COLORS.cashGreenBg, PDF_COLORS.cashGreen,
      "Cash Collection", pdfFormatCurrency(totalCash), PDF_COLORS.cashGreen);

    drawCard(margin + (cardWidth + cardGap) * 2, cardsY, cardWidth, cardHeight, PDF_COLORS.goldBg, PDF_COLORS.gold,
      "Grand Total", pdfFormatCurrency(grandTotal), PDF_COLORS.gold);

    const tableStartY = cardsY + cardHeight + 20;

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        "Bill No", "Bill Book", "Name", "Address", "Phone",
        "GPay", "Cash", "Total", "Date", "Remark"
      ]],
      body: filteredEntries.map(item => [
        item.billNo,
        item.billBook ? `Book ${item.billBook}` : "-",
        item.name,
        item.address,
        item.phone,
        pdfFormatCurrency(item.gpay),
        pdfFormatCurrency(item.cash),
        pdfFormatCurrency(Number(item.gpay) + Number(item.cash)),
        item.date,
        item.remark || "-"
      ]),
      margin: { left: margin, right: margin, bottom: 70 },
      theme: "grid",
      styles: {
        font: "NotoSansTamil",
        fontSize: 8.5,
        cellPadding: 6,
        halign: "center",
        valign: "middle",
        textColor: PDF_COLORS.brownSoft,
        lineColor: [222, 205, 170],
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: PDF_COLORS.gold,
        textColor: PDF_COLORS.white,
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
        cellPadding: 8,
      },
      alternateRowStyles: { fillColor: PDF_COLORS.rowOdd },
      bodyStyles: { fillColor: PDF_COLORS.rowEven },
      columnStyles: {
        2: { halign: "left", fontStyle: "bold", textColor: PDF_COLORS.brown },
        3: { halign: "left" },
        9: { halign: "left" },
        5: { textColor: PDF_COLORS.gpayBlue, fontStyle: "bold" },
        6: { textColor: PDF_COLORS.cashGreen, fontStyle: "bold" },
        7: { textColor: PDF_COLORS.gold, fontStyle: "bold" },
      },
      didParseCell: function (data) {
        if (data.section === 'body' && [2, 3, 9].includes(data.column.index)) {
          if (containsTamil(String(data.cell.raw))) {
            const isAlternate = data.row.index % 2 === 1;
            data.cell.styles.textColor = isAlternate ? PDF_COLORS.rowOdd : PDF_COLORS.rowEven;
          }
        }
      },
      didDrawCell: function (data) {
        if (data.section === 'body' && [2, 3, 9].includes(data.column.index)) {
          const raw = data.column.index === 9 ? (data.cell.raw || "-") : data.cell.raw;
          const text = String(raw || "");
          if (containsTamil(text)) {
            const isName = data.column.index === 2;
            const color = isName ? PDF_COLORS.brown : PDF_COLORS.brownSoft;
            const img = renderTamilTextImage(text, 8.5, isName, color);
            const padLeft = 6;
            const x = data.cell.x + padLeft;
            const y = data.cell.y + (data.cell.height - img.height) / 2;
            doc.addImage(img.dataUrl, "PNG", x, y, img.width, img.height);
          }
        }
      },
      didDrawPage: function () {
        if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
          drawHeader();
        }
      },
    });

    let finalY = doc.lastAutoTable.finalY + 18;

    if (finalY + 60 > pageHeight - 50) {
      doc.addPage();
      drawHeader();
      finalY = headerBottomY + 30;
    }

    const totalBoxHeight = 46;
    doc.setFillColor(...PDF_COLORS.cream);
    doc.setDrawColor(...PDF_COLORS.gold);
    doc.setLineWidth(1.2);
    doc.roundedRect(margin, finalY, pageWidth - margin * 2, totalBoxHeight, 8, 8, "FD");

    const thirdWidth = (pageWidth - margin * 2) / 3;
    const textY = finalY + 28;

    doc.setFont("NotoSansTamil", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...PDF_COLORS.gpayBlue);
    doc.text(`TOTAL GPay: ${pdfFormatCurrency(totalGpay)}`, margin + thirdWidth / 2, textY, { align: "center" });

    doc.setTextColor(...PDF_COLORS.cashGreen);
    doc.text(`TOTAL Cash: ${pdfFormatCurrency(totalCash)}`, margin + thirdWidth * 1.5, textY, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(...PDF_COLORS.gold);
    doc.text(`GRAND TOTAL: ${pdfFormatCurrency(grandTotal)}`, margin + thirdWidth * 2.5, textY, { align: "center" });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...PDF_COLORS.gold);
      doc.setLineWidth(0.6);
      doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);

      doc.setFont("NotoSansTamil", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...PDF_COLORS.textMuted);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 20, { align: "center" });
      doc.text("Generated by Temple Donation Management System", pageWidth / 2, pageHeight - 10, { align: "center" });
    }

    doc.save(`Temple_Donation_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };
  // ======================================================

  const clearSearch = () => {
    setSearchAddress('');
    setSearchBillBook('');
    setQuickSearch('');
    setSearchName('');
    setSearchPhone('');
    setSearchBillNo('');
    setPaymentType('All');
    setPaymentSearch('');
    setPaymentAmount(''); // NEW
  };

  const handlePaymentTypeChange = (e) => {
    const value = e.target.value;
    setPaymentType(value);
    if (value === 'All') {
      setPaymentSearch('');
    }
  };

  const isSearching =
    searchAddress.trim() !== '' ||
    searchBillBook.trim() !== '' ||
    quickSearch.trim() !== '' ||
    searchName.trim() !== '' ||
    searchPhone.trim() !== '' ||
    searchBillNo.trim() !== '' ||
    paymentType !== 'All' ||
    paymentSearch.trim() !== '' ||
    paymentAmount.trim() !== ''; // NEW

  return (
    <div className="dashboard-container">
      <div className="dashboard-wrapper">
        <div className="dashboard-header slide-in-down">
          <div>
            <h1 className="dashboard-title">Temple Admin Dashboard</h1>
            <p className="dashboard-subtitle">Visitor Information Management</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-card slide-in-up">
          <div className="search-card-header">
            <div className="search-card-heading">
              <span className="search-icon-badge"><IconSearch /></span>
              <div>
                <h3 className="search-title">Advanced Search &amp; Filters</h3>
                <p className="search-subtitle">Narrow down entries using any combination of filters below</p>
              </div>
            </div>
            <button
              type="button"
              className="collapse-toggle"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          <div className="quick-search-row">
            <div className="quick-search-field">
              <IconSearch className="quick-search-icon" />
              <input
                type="text"
                placeholder="Quick search — name, address, phone or bill no..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                className="quick-search-input"
              />
              {quickSearch && (
                <button className="quick-search-clear" onClick={() => setQuickSearch('')} aria-label="Clear quick search">×</button>
              )}
            </div>
            {isSearching && (
              <button onClick={clearSearch} className="btn btn-reset">
                <IconRefresh /> Reset Filters
              </button>
            )}
          </div>

          {filtersExpanded && (
            <div className="filters-body">
              <div className="filter-group">
                <span className="filter-group-title">Visitor Details</span>
                <div className="filter-grid">
                  <div className="search-field">
                    <label className="search-label"><IconUser /> Name</label>
                    <input type="text" placeholder="Search by name..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="form-input" />
                  </div>
                  <div className="search-field">
                    <label className="search-label"><IconPhone /> Phone Number</label>
                    <input type="text" placeholder="Search by phone..." value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} className="form-input" />
                  </div>
                  <div className="search-field">
                    <label className="search-label"><IconMapPin /> Address</label>
                    <input type="text" placeholder="Search by address..." value={searchAddress} onChange={(e) => setSearchAddress(e.target.value)} className="form-input" />
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group-title">Bill Details</span>
                <div className="filter-grid">
                  <div className="search-field">
                    <label className="search-label"><IconReceipt /> Bill Number</label>
                    <input type="text" placeholder="Search by bill no..." value={searchBillNo} onChange={(e) => setSearchBillNo(e.target.value)} className="form-input" />
                  </div>
                  <div className="search-field">
                    <label className="search-label"><IconBook /> Bill Book Number</label>
                    <input type="number" placeholder="Bill Book No." value={searchBillBook} onChange={(e) => setSearchBillBook(e.target.value)} className="form-input" />
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group-title">Payment Search</span>
                <div className="filter-grid">
                  <div className="search-field">
                    <label className="search-label"><IconReceipt /> Payment Type</label>
                    <select
                      value={paymentType}
                      onChange={handlePaymentTypeChange}
                      className="form-input"
                    >
                      <option value="All">All</option>
                      <option value="GPay">GPay</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div className="search-field">
                    <label className="search-label"><IconUser /> Search by Name</label>
                    <input
                      type="text"
                      placeholder={paymentType === 'All' ? 'Select GPay or Cash to search...' : `Search ${paymentType} customers by name...`}
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="form-input"
                      disabled={paymentType === 'All'}
                    />
                  </div>
                  {/* NEW: Amount filter */}
                  <div className="search-field">
                    <label className="search-label"><IconReceipt /> Amount (minimum)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Minimum amount, e.g. 1000 and above"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSearching && (
            <div className="search-totals">
              <span className="totals-label">Search Results: {filteredEntries.length} entries</span>

              {/* NEW: how many people paid this amount */}
              {paymentAmount.trim() !== '' && (
                <span className="totals-chip grand-chip">
                  {paymentType === 'All' ? 'GPay + Cash total' : paymentType} la ₹{paymentAmount} / athukku mela koduthavanga: {filteredEntries.length} peru
                </span>
              )}

              {paymentType !== 'Cash' && (
                <span className="totals-chip gpay-chip">GPay Total: ₹{totals.gpay}</span>
              )}
              {paymentType !== 'GPay' && (
                <span className="totals-chip cash-chip">Cash Total: ₹{totals.cash}</span>
              )}
              {paymentType === 'All' && (
                <span className="totals-chip grand-chip">Grand Total: ₹{totals.gpay + totals.cash}</span>
              )}
            </div>
          )}
        </div>

        <div className="table-section slide-in-up">
          <div className="section-header">
            <h2 className="section-title">Entries</h2>
            <div className="header-actions">
              <span className="entry-count">{filteredEntries.length}</span>
              <button
                type="button"
                className="btn btn-primary"
                onClick={downloadPDF}
              >
                <IconPdf /> Download PDF
              </button>
              <button
                onClick={() => { setShowForm(!showForm); setFormError(''); }}
                className="btn btn-add"
              >
                <IconPlus /> Add
              </button>
            </div>
          </div>

          {showForm && (
            <div className="add-form-section slide-in-up">
              <h3 className="form-title">{editingId ? 'Edit Entry' : 'Add New Entry'}</h3>

              {formError && (
                <div className="form-error" role="alert" style={{
                  background: '#fdecea',
                  color: '#b3261e',
                  border: '1px solid #f5c2c0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '12px',
                  fontSize: '13.5px'
                }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleAddEntry} className="quick-form">
                <div className="form-row">
                  <div className="form-field-group">
                    <label className="field-label">Bill No.</label>
                    <input type="number" name="billNo" min="1" step="1" placeholder="Bill No." value={formData.billNo} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">Bill Book No.</label>
                    <input type="text" value={formData.billBook ? `Book ${formData.billBook} (${getBillBookRangeLabel(formData.billBook)})` : ''} className="form-input" disabled placeholder="Auto-calculated" />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">Name</label>
                    <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">Address</label>
                    <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">Phone</label>
                    <input type="tel" name="phone" maxLength={10} placeholder="10-digit phone" value={formData.phone} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">Date</label>
                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">GPay Amount</label>
                    <input type="number" name="gpay" min="0" placeholder="GPay Amount" value={formData.gpay} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-field-group">
                    <label className="field-label">Cash Amount</label>
                    <input type="number" name="cash" min="0" placeholder="Cash Amount" value={formData.cash} onChange={handleInputChange} className="form-input" />
                  </div>
                  <div className="form-field-group form-field-wide">
                    <label className="field-label">Remark</label>
                    <input type="text" name="remark" placeholder="Remark" value={formData.remark} onChange={handleInputChange} className="form-input" />
                  </div>
                </div>
                <div className="form-buttons">
                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update' : 'Add'}
                  </button>
                  <button type="button" onClick={handleCancel} className="btn btn-cancel">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {filteredEntries.length === 0 ? (
            <p className="empty-state">{isSearching ? 'No matching entries found.' : 'No entries yet.'}</p>
          ) : (
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
                    <th className="col-action">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, index) => {
                    const total = (Number(entry.gpay) || 0) + (Number(entry.cash) || 0);
                    return (
                      <tr key={entry.uniqueId} className={`table-row ${index % 2 === 0 ? 'even' : 'odd'}`}>
                        <td className="col-billno" data-label="Bill No.">{entry.billNo}</td>
                        <td className="col-billbook" data-label="Bill Book">
                          Book {entry.billBook}
                          <span className="billbook-range"> ({getBillBookRangeLabel(entry.billBook)})</span>
                        </td>
                        <td className="col-name" data-label="Name">{entry.name}</td>
                        <td className="col-address" data-label="Address">{entry.address}</td>
                        <td className="col-phone" data-label="Phone">{entry.phone}</td>
                        <td className="col-gpay" data-label="GPay">₹{entry.gpay}</td>
                        <td className="col-cash" data-label="Cash">₹{entry.cash}</td>
                        <td className="col-total" data-label="Total">₹{total}</td>
                        <td className="col-date" data-label="Date">{entry.date}</td>
                        <td className="col-remark" data-label="Remark">{entry.remark}</td>
                        <td className="col-action" data-label="">
                          <button onClick={() => handleEdit(entry)} className="action-btn edit-btn" title="Edit">
                            <IconEdit /> Edit
                          </button>
                          <button onClick={() => handleDelete(entry.uniqueId)} className="action-btn delete-btn" title="Delete">
                            <IconTrash /> Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}