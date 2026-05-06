import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  limit, 
  deleteDoc, 
  doc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { Sale } from '../types';
import { motion } from 'motion/react';
import { 
  Download, 
  FileText,
  Trash2
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export default function Reports({ storeId }: { storeId: string }) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    async function fetchSales() {
      try {
        const salesRef = collection(db, `stores/${storeId}/sales`);
        const q = query(salesRef, orderBy('createdAt', 'desc'), limit(100));
        const querySnapshot = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, `stores/${storeId}/sales`));
        if (querySnapshot) {
          const data = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          } as Sale));
          setSales(data);
        }
      } catch (error) {
        console.error("Error fetching sales history:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSales();
  }, [storeId]);

  const handleCancelSale = async (sale: Sale) => {
    if (!window.confirm("Ushbu sotuvni haqiqatdan ham bekor qilmoqchimisiz? Mahsulotlar omborga qaytariladi.")) return;
    
    try {
      // 1. Delete the sale record
      await deleteDoc(doc(db, `stores/${storeId}/sales`, sale.id))
        .catch(e => handleFirestoreError(e, OperationType.DELETE, `stores/${storeId}/sales/${sale.id}`));

      // 2. Restore inventory for each item
      for (const item of sale.items) {
        const productRef = doc(db, `stores/${storeId}/products`, item.productId);
        await updateDoc(productRef, {
          quantity: increment(item.quantity),
          updatedAt: serverTimestamp()
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `stores/${storeId}/products/${item.productId}`));
      }

      setSales(prev => prev.filter(s => s.id !== sale.id));
      alert("Sotuv bekor qilindi va mahsulotlar omborga qaytarildi.");
    } catch (error) {
      console.error("Error cancelling sale:", error);
      alert("Kutilmagan xatolik yuz berdi.");
    }
  };

  const paymentData = [
    { name: 'Naqd', value: sales.filter(s => s.paymentMethod === 'cash').length },
    { name: 'Karta', value: sales.filter(s => s.paymentMethod === 'card').length },
    { name: 'Qarz', value: sales.filter(s => s.paymentMethod === 'credit').length },
  ].filter(d => d.value > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Hisobotlar tayyorlanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Moliyaviy Hisobotlar</h1>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-none mt-1">Savdo tarixi va tahliliy ma'lumotlar</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20">
            <Download size={16} />
            Excel Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Over Time */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em]">Savdo Dinamikasi (Oxirgi 7 ta)</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tushum (UZS)</span>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sales.slice(0, 7).reverse().map((s, i) => ({ 
                name: new Date(s.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
                total: s.totalAmount 
              }))}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                   contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px' }}
                   itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em] mb-8">To'lov Turlari</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em]">Barcha Sotuvlar Tarixi</h3>
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest italic">{sales.length} ta operatsiya</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white">
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Sotuv ID</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Vaqt</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Tarkib</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">To'lov</th>
                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Summa</th>
                <th className="px-8 py-4 border-b border-slate-50"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-mono text-[10px] text-slate-400 font-bold">#{sale.id.slice(-8).toUpperCase()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold">
                      {new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-[11px] font-bold text-slate-600 italic uppercase">
                      {sale.items.length} ta mahsulot
                    </p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      sale.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-600' : 
                      sale.paymentMethod === 'card' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {sale.paymentMethod === 'cash' ? 'NAQD' : sale.paymentMethod === 'card' ? 'KARTA' : 'QARZ'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="text-sm font-black text-slate-900 italic">{sale.totalAmount.toLocaleString()} <span className="text-[10px] text-slate-400">UZS</span></p>
                  </td>
                  <td className="px-8 py-5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all" title="Chek">
                        <FileText size={16} />
                      </button>
                      <button 
                        onClick={() => handleCancelSale(sale)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                        title="Bekor qilish"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-300 italic text-xs uppercase tracking-widest font-black opacity-40">
                    Hozircha sotuvlar tarixi mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
