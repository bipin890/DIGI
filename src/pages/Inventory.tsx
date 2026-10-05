import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, ArrowDownRight, ArrowUpRight, AlertTriangle, Search, CheckCircle2 } from 'lucide-react';
import { InventoryItem } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const Inventory: React.FC = () => {
  const { fetchApi } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItemForTxn, setSelectedItemForTxn] = useState<InventoryItem | null>(null);
  const [txnType, setTxnType] = useState<'Stock In' | 'Stock Out' | 'Adjustment'>('Stock In');
  const [txnQty, setTxnQty] = useState('1');
  const [txnReason, setTxnReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New item form
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Paper');
  const [currentStock, setCurrentStock] = useState('10');
  const [minStockAlert, setMinStockAlert] = useState('5');
  const [unit, setUnit] = useState('ream');
  const [costPerUnit, setCostPerUnit] = useState('450');
  const [supplier, setSupplier] = useState('');

  const loadInventory = async () => {
    try {
      setIsLoading(true);
      const res = await fetchApi('/api/inventory');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTransactions(data.recentTransactions || []);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi('/api/inventory', {
        method: 'POST',
        body: JSON.stringify({
          itemName,
          category,
          currentStock: parseInt(currentStock, 10),
          minStockAlert: parseInt(minStockAlert, 10),
          unit,
          costPerUnit: parseFloat(costPerUnit),
          supplier,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setItemName('');
        setSupplier('');
        await loadInventory();
      }
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordTxn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForTxn) return;

    try {
      setIsSubmitting(true);
      const res = await fetchApi(`/api/inventory/${selectedItemForTxn.id}/transaction`, {
        method: 'POST',
        body: JSON.stringify({
          type: txnType,
          quantity: parseInt(txnQty, 10),
          reason: txnReason || `${txnType} routine update`,
        }),
      });

      if (res.ok) {
        setSelectedItemForTxn(null);
        setTxnQty('1');
        setTxnReason('');
        await loadInventory();
      }
    } catch (err) {
      console.error('Failed to record stock transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = items.filter((i) =>
    i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Shop Supplies & Stock Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Monitor printer paper, toner cartridges, ink bottles, photo sheets & lamination pouches
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-98 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add Stock Item</span>
        </button>
      </div>

      {/* Stock Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const isLow = item.currentStock <= item.minStockAlert;
          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-white border transition-all ${
                isLow ? 'border-rose-300 ring-1 ring-rose-300 shadow-sm' : 'border-slate-200 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">{item.category}</span>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight mt-0.5">{item.itemName}</h3>
                </div>
                {isLow ? (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    <AlertTriangle className="w-3 h-3" /> Low Stock
                  </span>
                ) : (
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    In Stock
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-baseline justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="text-2xl font-black font-mono text-slate-900">{item.currentStock}</span>
                  <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  <p>Min Alert: {item.minStockAlert} {item.unit}</p>
                  <p>Cost: Rs. {parseFloat(item.costPerUnit || '0').toFixed(2)}</p>
                </div>
              </div>

              {item.supplier && (
                <p className="text-[10px] text-slate-400 mt-2 truncate">
                  Supplier: {item.supplier}
                </p>
              )}

              <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setSelectedItemForTxn(item);
                    setTxnType('Stock In');
                    setTxnQty('5');
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>+ Stock In</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedItemForTxn(item);
                    setTxnType('Stock Out');
                    setTxnQty('1');
                  }}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>- Use / Out</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Inventory Transactions Log */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Recent Inventory Movement Audit
        </h3>
        <div className="space-y-2">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                  tx.type === 'Stock In' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tx.type}
                </span>
                <span className="font-semibold text-slate-800">
                  {tx.quantity} units • {tx.reason}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                by {tx.performedByName} on {new Date(tx.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No stock transactions recorded yet.</p>
          )}
        </div>
      </div>

      {/* Stock Transaction Modal */}
      {selectedItemForTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              {txnType} • {selectedItemForTxn.itemName}
            </h3>
            <p className="text-xs text-slate-500 mb-3">Current Stock: {selectedItemForTxn.currentStock} {selectedItemForTxn.unit}</p>

            <form onSubmit={handleRecordTxn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Movement Type</label>
                <select
                  value={txnType}
                  onChange={(e) => setTxnType(e.target.value as any)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Stock In">Stock In (Purchase / Restock)</option>
                  <option value="Stock Out">Stock Out (Consumed at Counter)</option>
                  <option value="Adjustment">Adjustment (Inventory Count)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Quantity ({selectedItemForTxn.unit}) *</label>
                <input
                  type="number"
                  min="1"
                  value={txnQty}
                  onChange={(e) => setTxnQty(e.target.value)}
                  className="mt-1 w-full p-2 text-xs font-mono font-bold border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Reason / Reference Order</label>
                <input
                  type="text"
                  placeholder="e.g. Bought from Everest Stationery, used for Menu printing..."
                  value={txnReason}
                  onChange={(e) => setTxnReason(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItemForTxn(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Updating...' : 'Confirm Stock Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-5 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Add Stock Inventory Item</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. JK Copier A4 Paper 75 GSM"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Paper">Paper</option>
                    <option value="Ink">Ink Refill</option>
                    <option value="Toner">Toner Cartridge</option>
                    <option value="Lamination">Lamination</option>
                    <option value="Stationery">Stationery</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Unit</label>
                  <input
                    type="text"
                    placeholder="ream, bottle, packet, pcs"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Starting Stock</label>
                  <input
                    type="number"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Min Alert</label>
                  <input
                    type="number"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Cost (NPR)</label>
                  <input
                    type="number"
                    step="any"
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="mt-1 w-full p-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Supplier Name</label>
                <input
                  type="text"
                  placeholder="e.g. Everest Stationery Mart"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="mt-1 w-full p-2 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
