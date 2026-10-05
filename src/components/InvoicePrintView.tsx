import React from 'react';
import { Invoice, InvoiceItem } from '../types/index.ts';

interface InvoicePrintViewProps {
  invoice: Invoice;
  shopInfo?: {
    name?: string;
    tagline?: string;
    address?: string;
    phone?: string;
    pan?: string;
    footer?: string;
  };
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({
  invoice,
  shopInfo = {
    name: 'DIGI DIGITAL SEWA',
    tagline: 'Cyber Cafe & Online Government Service Center',
    address: 'New Road, Kathmandu, Nepal',
    phone: '+977-9841234567 / 01-4223344',
    pan: '609876543',
    footer: 'धन्यवाद! फेरी भेटौला। Thank you for choosing Digi Digital Sewa.',
  },
}) => {
  const items: InvoiceItem[] = invoice.items || [];
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(invoice.createdAt || Date.now()));

  const subtotal = parseFloat(invoice.subtotal || '0');
  const discount = parseFloat(invoice.discount || '0');
  const tax = parseFloat(invoice.tax || '0');
  const grandTotal = parseFloat(invoice.grandTotal || '0');
  const paid = parseFloat(invoice.paidAmount || '0');
  const due = parseFloat(invoice.dueAmount || '0');

  return (
    <div className="printable-receipt font-sans text-slate-900 bg-white p-4 max-w-sm sm:max-w-md mx-auto border border-dashed border-slate-300 rounded-lg text-xs leading-tight">
      {/* Header */}
      <div className="text-center pb-3 border-b border-dashed border-slate-300">
        <h1 className="text-base font-extrabold uppercase tracking-wide text-slate-950">
          {shopInfo.name}
        </h1>
        <p className="text-[10px] text-slate-600 font-medium">{shopInfo.tagline}</p>
        <p className="text-[10px] text-slate-500 mt-0.5">{shopInfo.address}</p>
        <p className="text-[10px] text-slate-500">Phone: {shopInfo.phone}</p>
        {shopInfo.pan && (
          <p className="text-[10px] font-mono font-bold text-slate-700 mt-0.5">
            PAN / VAT No: {shopInfo.pan}
          </p>
        )}
      </div>

      {/* Bill Meta */}
      <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
        <div className="flex justify-between font-semibold">
          <span>Invoice No:</span>
          <span className="font-mono text-slate-950 font-bold">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Date & Time:</span>
          <span>{formattedDate}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Counter Staff:</span>
          <span>{invoice.staffName}</span>
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Payment Mode:</span>
          <span className="font-bold text-slate-800">{invoice.paymentMethod}</span>
        </div>

        {/* Customer Details */}
        <div className="pt-1.5 mt-1 border-t border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-600">Customer:</span>
            <span className="font-bold text-slate-950">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Mobile:</span>
            <span>{invoice.customerMobile}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="py-2 border-b border-dashed border-slate-300">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 font-semibold">
              <th className="pb-1">Item / Service</th>
              <th className="pb-1 text-center">Qty</th>
              <th className="pb-1 text-right">Rate</th>
              <th className="pb-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item, idx) => (
              <tr key={idx} className="py-1">
                <td className="py-1.5 pr-1 font-medium text-slate-900 leading-snug">
                  {item.serviceName}
                </td>
                <td className="py-1.5 text-center text-slate-600 font-mono">
                  {parseFloat(item.quantity?.toString() || '1')}
                </td>
                <td className="py-1.5 text-right text-slate-600 font-mono">
                  {parseFloat(item.rate?.toString() || '0')}
                </td>
                <td className="py-1.5 text-right font-bold font-mono text-slate-900">
                  {parseFloat(item.netAmount?.toString() || item.amount?.toString() || '0').toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Financial Summary */}
      <div className="py-2 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
        <div className="flex justify-between text-slate-600">
          <span>Subtotal:</span>
          <span className="font-mono">Rs. {subtotal.toFixed(2)}</span>
        </div>
        {parseFloat(invoice.serviceCharge || '0') > 0 && (
          <div className="flex justify-between text-blue-700">
            <span>Service Charge:</span>
            <span className="font-mono">+ Rs. {parseFloat(invoice.serviceCharge || '0').toFixed(2)}</span>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Discount:</span>
            <span className="font-mono">- Rs. {discount.toFixed(2)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-slate-600">
            <span>VAT / Tax (13%):</span>
            <span className="font-mono">Rs. {tax.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-xs font-extrabold text-slate-950 pt-1 border-t border-slate-200">
          <span>Grand Total:</span>
          <span className="font-mono text-sm text-blue-700">Rs. {grandTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-slate-800">
          <span>Paid Amount:</span>
          <span className="font-mono text-emerald-700">Rs. {paid.toFixed(2)}</span>
        </div>
        {due > 0 ? (
          <div className="flex justify-between font-extrabold text-rose-700 bg-rose-50 p-1 rounded">
            <span>DUE BALANCE:</span>
            <span className="font-mono">Rs. {due.toFixed(2)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-[10px] font-bold text-emerald-700">
            <span>STATUS:</span>
            <span>FULLY PAID (नगद भुक्तान भयो)</span>
          </div>
        )}
      </div>

      {/* Footer Notes */}
      <div className="pt-3 text-center text-[10px] text-slate-500 space-y-1">
        <p className="font-medium text-slate-800">{shopInfo.footer}</p>
        <p className="italic">Software by DIGI DIGITAL SEWA • Authorized Receipt</p>
      </div>
    </div>
  );
};
