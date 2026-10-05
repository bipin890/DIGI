import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Search,
  UserPlus,
  Receipt,
  Printer,
  CheckCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Check,
  Calculator,
  PlusCircle
} from 'lucide-react';
import { Service, Customer, ServiceCategory, Invoice } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { InvoicePrintView } from './InvoicePrintView.tsx';

interface POSBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newInvoice: Invoice) => void;
  initialCustomer?: Customer | null;
}

interface CartItem {
  serviceId?: number;
  serviceName: string;
  categoryName: string;
  quantity: number;
  unit: string;
  rate: number;          // Manually editable price
  serviceCharge: number; // Manually editable service charge
  discount: number;      // Manually editable line discount
  notes?: string;
}

export const POSBillingModal: React.FC<POSBillingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomer,
}) => {
  const { fetchApi, currentUser } = useAuth();

  // Master catalog
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [serviceSearch, setServiceSearch] = useState('');

  // Customer selection / entry
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);

  // Cart / Items
  const [cart, setCart] = useState<CartItem[]>([]);
  const [overallServiceCharge, setOverallServiceCharge] = useState<string>('0');
  const [overallDiscount, setOverallDiscount] = useState<string>('0');
  const [taxPercent, setTaxPercent] = useState<string>('0'); // 0 or 13%
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Custom Item Inline Add
  const [showCustomItemRow, setShowCustomItemRow] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [customServiceCharge, setCustomServiceCharge] = useState('0');
  const [customDiscount, setCustomDiscount] = useState('0');
  const [customUnit, setCustomUnit] = useState('service');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedInvoice, setCompletedInvoice] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      return;
    }

    const loadData = async () => {
      try {
        const [srvRes, catRes, custRes] = await Promise.all([
          fetchApi('/api/services'),
          fetchApi('/api/categories'),
          fetchApi('/api/customers'),
        ]);

        if (srvRes.ok) setServices(await srvRes.json());
        if (catRes.ok) setCategories(await catRes.json());
        if (custRes.ok) setCustomers(await custRes.json());
      } catch (err) {
        console.error('Failed to load POS catalog:', err);
      }
    };
    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (initialCustomer) {
      selectCustomer(initialCustomer);
    }
  }, [initialCustomer]);

  const selectCustomer = (cust: Customer) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerMobile(cust.mobile);
    setCustomerAddress(cust.address || '');
    setCustomerSearch(cust.name);
    setIsNewCustomerMode(false);
  };

  const resetForm = () => {
    setCart([]);
    setSelectedCustomerId(null);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerAddress('');
    setCustomerSearch('');
    setIsNewCustomerMode(false);
    setOverallServiceCharge('0');
    setOverallDiscount('0');
    setTaxPercent('0');
    setPaymentMethod('Cash');
    setPaidAmount('');
    setNotes('');
    setShowCustomItemRow(false);
    setCustomName('');
    setCustomRate('');
    setCompletedInvoice(null);
    setErrorMsg('');
  };

  // Filtered services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (s.status === 'inactive') return false;
      const matchesCat = selectedCategory === 'all' || s.categoryId.toString() === selectedCategory;
      const matchesSearch =
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.code.toLowerCase().includes(serviceSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [services, selectedCategory, serviceSearch]);

  // Suggested customers
  const suggestedCustomers = useMemo(() => {
    if (!customerSearch.trim() || selectedCustomerId) return [];
    const q = customerSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.customerCode.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [customers, customerSearch, selectedCustomerId]);

  // Add service to cart with editable defaults
  const addToCart = (service: Service) => {
    const isVariableBill = service.categorySlug === 'bill-payment' || parseFloat(service.defaultPrice) === 0;
    const defaultRate = isVariableBill ? 0 : (parseFloat(service.defaultPrice) || 0);
    setCart([
      ...cart,
      {
        serviceId: service.id,
        serviceName: service.name,
        categoryName: service.categoryName,
        quantity: 1,
        unit: service.unit || 'service',
        rate: defaultRate,        // Operator enters customer's actual bill amount
        serviceCharge: 0,        // Operator can enter service charge
        discount: 0,             // Operator can enter discount
      },
    ]);
  };

  // Add custom on-the-fly item
  const handleAddCustomItem = () => {
    if (!customName.trim()) return;
    const rateVal = parseFloat(customRate) || 0;
    const scVal = parseFloat(customServiceCharge) || 0;
    const discVal = parseFloat(customDiscount) || 0;

    setCart([
      ...cart,
      {
        serviceName: customName.trim(),
        categoryName: 'Custom Service',
        quantity: 1,
        unit: customUnit || 'item',
        rate: rateVal,
        serviceCharge: scVal,
        discount: discVal,
      },
    ]);

    setCustomName('');
    setCustomRate('');
    setCustomServiceCharge('0');
    setCustomDiscount('0');
    setShowCustomItemRow(false);
  };

  // Update item fields directly
  const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
    const updated = [...cart];
    updated[index] = { ...updated[index], [field]: value };
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // AUTO CALCULATOR:
  // 1. Subtotal = sum of (qty * rate)
  // 2. Line Service Charges = sum of item.serviceCharge
  // 3. Line Discounts = sum of item.discount
  // 4. Overall Service Charge & Overall Discount
  // 5. Grand Total = Subtotal + Total Service Charges - Total Discounts + VAT
  const calculation = useMemo(() => {
    let itemsSubtotal = 0;
    let itemsServiceCharges = 0;
    let itemsDiscounts = 0;

    cart.forEach((item) => {
      const q = parseFloat(item.quantity?.toString() || '1') || 1;
      const r = parseFloat(item.rate?.toString() || '0') || 0;
      const sc = parseFloat(item.serviceCharge?.toString() || '0') || 0;
      const d = parseFloat(item.discount?.toString() || '0') || 0;

      itemsSubtotal += q * r;
      itemsServiceCharges += sc;
      itemsDiscounts += d;
    });

    const addtlServiceCharge = parseFloat(overallServiceCharge || '0') || 0;
    const addtlDiscount = parseFloat(overallDiscount || '0') || 0;

    const totalServiceCharge = itemsServiceCharges + addtlServiceCharge;
    const totalDiscount = itemsDiscounts + addtlDiscount;

    const netBase = Math.max(0, itemsSubtotal + totalServiceCharge - totalDiscount);
    const taxRate = (parseFloat(taxPercent || '0') || 0) / 100;
    const taxAmount = netBase * taxRate;
    const grandTotal = Math.round((netBase + taxAmount) * 100) / 100;

    return {
      subtotal: itemsSubtotal,
      totalServiceCharge,
      totalDiscount,
      taxAmount,
      grandTotal,
    };
  }, [cart, overallServiceCharge, overallDiscount, taxPercent]);

  // Keep paidAmount in sync with grandTotal by default if not partially changed
  useEffect(() => {
    if (paidAmount === '' || parseFloat(paidAmount) === 0) {
      setPaidAmount(calculation.grandTotal.toString());
    }
  }, [calculation.grandTotal]);

  const currentPaid = parseFloat(paidAmount || '0') || 0;
  const dueAmount = Math.max(0, calculation.grandTotal - currentPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName.trim()) {
      setErrorMsg('Customer name is required.');
      return;
    }
    if (!customerMobile.trim()) {
      setErrorMsg('Customer mobile number is required.');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Please add at least one service item to the bill.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customerId: selectedCustomerId,
        customerName: customerName.trim(),
        customerMobile: customerMobile.trim(),
        customerAddress: customerAddress.trim(),
        items: cart,
        serviceCharge: calculation.totalServiceCharge,
        discount: calculation.totalDiscount,
        tax: calculation.taxAmount,
        paidAmount: currentPaid,
        paymentMethod,
        notes,
      };

      const res = await fetchApi('/api/invoices', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create invoice');
      }

      const result = await res.json();
      setCompletedInvoice({
        ...result.invoice,
        items: result.items,
      });
      onSuccess(result.invoice);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error completing billing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-600 text-white">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">DIGI DIGITAL SEWA • Smart POS Counter Billing</h2>
              <p className="text-xs text-slate-400">
                Operator: <span className="text-blue-400 font-semibold">{currentUser?.name} (@{currentUser?.username})</span> • Manual Price, Service Charge & Auto-Calculated Dues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If Completed, show Instant Receipt & Print Option */}
        {completedInvoice ? (
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
            <div className="w-full max-w-md p-4 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-bold">Bill Generated Successfully!</p>
                <p className="text-xs text-emerald-700">
                  Invoice Number: <strong>{completedInvoice.invoiceNumber}</strong>
                </p>
              </div>
            </div>

            <div className="w-full max-w-md border border-slate-300 rounded-xl shadow-md p-4 bg-white mb-6">
              <InvoicePrintView invoice={completedInvoice} />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-md transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice Receipt</span>
              </button>
              <button
                onClick={resetForm}
                className="px-5 py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-200 border border-slate-300 transition-all"
              >
                Create Another Bill
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Billing Layout: 2 Columns */
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Customer & Service Catalog Selection (5 cols) */}
            <div className="lg:col-span-5 p-4 border-r border-slate-200 flex flex-col overflow-y-auto max-h-[82vh] scrollbar-thin space-y-4">
              {/* Customer Selector */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Customer Details</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewCustomerMode(!isNewCustomerMode);
                      setSelectedCustomerId(null);
                      setCustomerSearch('');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isNewCustomerMode ? 'Search Existing' : '+ Fast Add Customer'}</span>
                  </button>
                </div>

                {!isNewCustomerMode ? (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search name, mobile (e.g. 9841...)"
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (selectedCustomerId) setSelectedCustomerId(null);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    {suggestedCustomers.length > 0 && (
                      <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden divide-y divide-slate-100">
                        {suggestedCustomers.map((cust) => (
                          <button
                            key={cust.id}
                            type="button"
                            onClick={() => selectCustomer(cust)}
                            className="w-full text-left p-2 hover:bg-blue-50 flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{cust.name}</p>
                              <p className="text-[11px] text-slate-500">{cust.mobile} • {cust.address || 'No address'}</p>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {cust.customerCode}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700">Mobile Number *</label>
                      <input
                        type="tel"
                        placeholder="98XXXXXXXX"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {selectedCustomerId && (
                  <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-blue-900">{customerName}</span>
                      <span className="text-slate-600 ml-2">📱 {customerMobile}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(null);
                        setCustomerSearch('');
                        setCustomerName('');
                        setCustomerMobile('');
                      }}
                      className="text-[11px] text-blue-700 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Service Catalog Picker */}
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Catalog Services</span>
                  <button
                    type="button"
                    onClick={() => setShowCustomItemRow(!showCustomItemRow)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>+ Custom Service Item</span>
                  </button>
                </div>

                {/* Inline Custom Item Creator */}
                {showCustomItemRow && (
                  <div className="p-3 mb-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-emerald-950 uppercase">Fast Add Custom Item</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Service Name (e.g. Urgent Form Fillup)"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="p-1.5 text-xs bg-white border border-emerald-300 rounded"
                      />
                      <input
                        type="number"
                        placeholder="Price / Rate (Rs.)"
                        value={customRate}
                        onChange={(e) => setCustomRate(e.target.value)}
                        className="p-1.5 text-xs bg-white border border-emerald-300 rounded font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Service Charge (Rs.)"
                        value={customServiceCharge}
                        onChange={(e) => setCustomServiceCharge(e.target.value)}
                        className="p-1.5 text-xs bg-white border border-emerald-300 rounded text-blue-700"
                        title="Service Charge"
                      />
                      <input
                        type="number"
                        placeholder="Discount (Rs.)"
                        value={customDiscount}
                        onChange={(e) => setCustomDiscount(e.target.value)}
                        className="p-1.5 text-xs bg-white border border-emerald-300 rounded text-rose-700"
                        title="Discount"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomItem}
                        className="p-1.5 bg-emerald-600 text-white font-bold text-xs rounded hover:bg-emerald-700"
                      >
                        + Add To Bill
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search catalog service..."
                      value={serviceSearch}
                      onChange={(e) => setServiceSearch(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 bg-white text-slate-800"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id.toString()}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Catalog Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto max-h-56 pr-1 scrollbar-thin">
                  {filteredServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => addToCart(service)}
                      className="text-left p-2 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 bg-white transition-all group flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                          {service.name}
                        </span>
                        {service.categorySlug === 'bill-payment' || parseFloat(service.defaultPrice) === 0 ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Custom Bill
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-800 font-mono">
                            Rs. {parseFloat(service.defaultPrice)}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>{service.categoryName}</span>
                        <span className="font-bold text-blue-600">+ Add</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Bill Items Table & Auto Calculator (7 cols) */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-slate-50 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto max-h-[82vh] scrollbar-thin">
              <div>
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Bill Items ({cart.length})
                    </span>
                    <span className="text-[11px] text-slate-500 italic">
                      (Manually enter or adjust price, service charge & discount)
                    </span>
                  </div>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCart([])}
                      className="text-[11px] font-semibold text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Editable Items Table */}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 mb-3 scrollbar-thin">
                  {cart.map((item, idx) => {
                    const lineNet = Math.max(0, (item.quantity * item.rate) + (item.serviceCharge || 0) - (item.discount || 0));
                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs space-y-2"
                      >
                        {/* Title & Delete */}
                        <div className="flex items-center justify-between">
                          <input
                            type="text"
                            value={item.serviceName}
                            onChange={(e) => updateCartItem(idx, 'serviceName', e.target.value)}
                            className="font-bold text-slate-900 w-3/4 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Interactive inputs: Qty, Manual Price/Rate, Service Charge, Discount */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                          {/* Qty */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500">Quantity</label>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={item.quantity}
                              onChange={(e) => updateCartItem(idx, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-full px-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-center"
                            />
                          </div>

                          {/* Manual Rate / Price */}
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700">
                              {item.categoryName === 'Bill Payment & Recharge' || item.rate === 0
                                ? 'Bill Amt (NPR) *'
                                : 'Price (NPR) *'}
                            </label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.rate === 0 ? '' : item.rate}
                              placeholder="0.00"
                              onChange={(e) => updateCartItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                              className={`w-full px-1.5 py-1 text-xs font-mono font-extrabold bg-white rounded text-right text-blue-950 border ${
                                item.categoryName === 'Bill Payment & Recharge' || item.rate === 0
                                  ? 'border-amber-400 focus:ring-1 focus:ring-amber-500 bg-amber-50/20'
                                  : 'border-blue-400'
                              }`}
                              title={item.categoryName === 'Bill Payment & Recharge' ? 'Enter customer bill amount' : 'Manually enter item rate/price'}
                            />
                          </div>

                          {/* Service Charge */}
                          <div>
                            <label className="block text-[10px] font-bold text-blue-800">Srv. Charge (+)</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.serviceCharge}
                              onChange={(e) => updateCartItem(idx, 'serviceCharge', parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-1 text-xs font-mono font-bold bg-white border border-blue-200 rounded text-right text-blue-800"
                              title="Service Charge"
                            />
                          </div>

                          {/* Discount */}
                          <div>
                            <label className="block text-[10px] font-bold text-rose-800">Discount (-)</label>
                            <input
                              type="number"
                              step="any"
                              min="0"
                              value={item.discount}
                              onChange={(e) => updateCartItem(idx, 'discount', parseFloat(e.target.value) || 0)}
                              className="w-full px-1.5 py-1 text-xs font-mono font-bold bg-white border border-rose-200 rounded text-right text-rose-800"
                              title="Line Discount"
                            />
                          </div>

                          {/* Line Net Total */}
                          <div className="text-right">
                            <label className="block text-[10px] font-bold text-slate-500">Line Total</label>
                            <span className="font-black font-mono text-emerald-800 text-sm">
                              Rs. {lineNet.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {cart.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
                      <Receipt className="w-8 h-8 text-slate-300 stroke-1" />
                      <span>No items in bill. Select catalog services or click "+ Custom Service Item".</span>
                    </div>
                  )}
                </div>

                {/* Auto Calculator Summary Box */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Base Subtotal:</span>
                    <span className="font-mono font-bold">Rs. {calculation.subtotal.toFixed(2)}</span>
                  </div>

                  {/* Overall Bill Service Charge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-blue-800 font-semibold">Additional Service Charge (Rs.):</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={overallServiceCharge}
                      onChange={(e) => setOverallServiceCharge(e.target.value)}
                      className="w-24 px-2 py-0.5 text-right font-mono font-bold text-blue-900 border border-blue-300 rounded bg-blue-50/30"
                    />
                  </div>

                  {/* Overall Bill Discount */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-rose-800 font-semibold">Special Discount (Rs.):</span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(e.target.value)}
                      className="w-24 px-2 py-0.5 text-right font-mono font-bold text-rose-900 border border-rose-300 rounded bg-rose-50/30"
                    />
                  </div>

                  {/* VAT / Tax */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-600">Tax/VAT (13%):</span>
                    <select
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(e.target.value)}
                      className="text-xs border border-slate-300 rounded px-1.5 py-0.5 bg-white"
                    >
                      <option value="0">No VAT (0%)</option>
                      <option value="13">VAT (13%)</option>
                    </select>
                  </div>

                  {/* Final Auto-Calculated Grand Total */}
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm font-extrabold text-slate-950">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span>Grand Total:</span>
                    </div>
                    <span className="text-base sm:text-lg text-blue-700 font-mono">
                      Rs. {calculation.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payment method & Paid / Due Split */}
                <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[11px]">
                    {['Cash', 'eSewa', 'Khalti', 'Bank Transfer', 'Card', 'Mixed Payment'].map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPaymentMethod(pm)}
                        className={`py-1 px-1 rounded-lg font-semibold border text-center transition-all truncate ${
                          paymentMethod === pm
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-emerald-800">Received (Paid) *</label>
                        <button
                          type="button"
                          onClick={() => setPaidAmount(calculation.grandTotal.toString())}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          Full Pay
                        </button>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-full px-2.5 py-1 font-bold font-mono text-sm bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-800">Remaining Due</label>
                      <input
                        type="text"
                        readOnly
                        value={`Rs. ${dueAmount.toFixed(2)}`}
                        className={`w-full px-2.5 py-1 font-bold font-mono text-sm border rounded-lg ${
                          dueAmount > 0 ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                    {errorMsg}
                  </div>
                )}
              </div>

              {/* Checkout Submit */}
              <div className="mt-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || cart.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 active:scale-98 transition-all"
                >
                  <Check className="w-5 h-5" />
                  <span>
                    {isSubmitting ? 'Generating Bill...' : `Complete Sale • Rs. ${calculation.grandTotal.toFixed(2)}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
