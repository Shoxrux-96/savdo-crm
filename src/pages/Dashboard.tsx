import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { Sale, Product } from '../types';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Package, 
  AlertTriangle, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export default function Dashboard({ storeId }: { storeId: string }) {
  const [stats, setStats] = useState({
    totalSales: 0,
    salesCount: 0,
    lowStockCount: 0,
    totalProducts: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<{name: string, sales: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const salesRef = collection(db, `stores/${storeId}/sales`);
        const salesSnap = await getDocs(query(salesRef, orderBy('createdAt', 'desc'), limit(50)));
        const salesData = salesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Sale));
        setRecentSales(salesData);

        // Fetch all products for stock alerts
        const productsRef = collection(db, `stores/${storeId}/products`);
        const productsSnap = await getDocs(productsRef);
        const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        
        const lowStock = productsData.filter(p => p.quantity <= (p.lowStockThreshold || 5));
        
        setLowStockProducts(lowStock);
        
        // Group sales by day for the last 7 days
        const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const groupedSales = last7Days.map(day => {
          const total = salesData
            .filter(s => {
              const sDate = s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt);
              return sDate.toISOString().split('T')[0] === day;
            })
            .reduce((sum, s) => sum + s.totalAmount, 0);
          
          const label = new Date(day).toLocaleDateString('uz-UZ', { weekday: 'short' });
          return { name: label, sales: total };
        });

        setSalesHistory(groupedSales);

        setStats({
          totalSales: salesData.reduce((acc, s) => acc + s.totalAmount, 0),
          salesCount: salesSnap.size,
          lowStockCount: lowStock.length,
          totalProducts: productsData.length
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [storeId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Ma'lumotlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Bosh Sahifa</h1>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-none mt-1">Do'koningizdagi bugungi holat va statistika</p>
        </div>
        <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
          {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Barcha Savdo", value: stats.totalSales.toLocaleString(), unit: "UZS", icon: DollarSign, color: "text-blue-600", bg: "bg-white", trend: "Umumiy tushum", trendColor: "text-emerald-500" },
          { label: "Omborxona", value: stats.totalProducts, unit: "turdagi", icon: Package, color: "text-indigo-600", bg: "bg-white", trend: "Barcha mahsulotlar", trendColor: "text-slate-400" },
          { label: "Kam Qolgan", value: stats.lowStockCount, unit: "ta", icon: AlertTriangle, color: "text-rose-600", bg: stats.lowStockCount > 0 ? "bg-rose-50/30 border-rose-100" : "bg-white", trend: "Zaxira nazorati", trendColor: "text-rose-600" },
          { label: "Savdolar", value: stats.salesCount, unit: "martta", icon: TrendingUp, color: "text-blue-600", bg: "bg-white", trend: "Muvaffaqiyatli", trendColor: "text-blue-600" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between ${stat.bg}`}
          >
            <div className="relative z-10">
              <div className="text-slate-500 text-[9px] uppercase font-black tracking-[0.2em] mb-2">
                {stat.label}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tighter italic">{stat.value}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.unit}</span>
              </div>
            </div>
            <div className={`text-[10px] mt-4 font-black uppercase tracking-tight ${stat.trendColor} relative z-10 italic`}>
              {stat.trend}
            </div>
            <stat.icon className={`absolute right-[-15px] top-[-15px] w-24 h-24 opacity-[0.03] ${stat.color} rotate-12`} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Savdo Dinamikasi</h3>
              <select className="bg-slate-100 border-none rounded px-3 py-1 text-[10px] font-bold outline-none text-slate-600 uppercase">
                <option>Haftalik</option>
                <option>Oylik</option>
              </select>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesHistory}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="sales" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Notifications */}
          {lowStockProducts.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-rose-200 shadow-sm">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-widest mb-4">
                <AlertTriangle size={16} />
                Omborxonada kam qolgan mahsulotlar
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lowStockProducts.slice(0, 4).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg border border-rose-100">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{product.name}</p>
                      <p className="text-[10px] text-slate-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-rose-700">{product.quantity} {product.unit}</p>
                      <p className="text-[9px] text-rose-400 font-bold uppercase">Zaxira kam</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Oxirgi Amallar</h3>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {recentSales.map((sale, i) => (
              <div key={sale.id} className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors shrink-0">
                  <ArrowUpRight size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tighter">
                    {sale.items.length} TA MAHSULOT — {sale.paymentMethod === 'cash' ? 'NAQD' : 'KARTA'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • ID: #{sale.id.slice(-6)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-slate-900">
                    {sale.totalAmount.toLocaleString()}
                  </p>
                  <p className="text-[9px] text-emerald-500 font-black uppercase">Muvaffaqiyatli</p>
                </div>
              </div>
            ))}
            {recentSales.length === 0 && (
              <div className="text-center py-20 text-slate-400 italic text-xs uppercase tracking-widest">Hali sotuvlar yo'q</div>
            )}
          </div>
          <button className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest">
            Barcha amallarni ko'rish
          </button>
        </div>
      </div>
    </div>
  );
}
