import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Download, 
  PieChart, 
  ArrowUpRight,
  DollarSign,
  Briefcase,
  Building,
  Truck
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
  Line,
  AreaChart,
  Area
} from 'recharts';

const data = [
  { name: 'Jan', revenue: 4000, stores: 24, commission: 2400 },
  { name: 'Feb', revenue: 3000, stores: 28, commission: 2100 },
  { name: 'Mar', revenue: 2000, stores: 32, commission: 2200 },
  { name: 'Apr', revenue: 2780, stores: 38, commission: 2800 },
  { name: 'May', revenue: 1890, stores: 45, commission: 3100 },
  { name: 'Jun', revenue: 2390, stores: 52, commission: 3800 },
];

export default function AdminReports() {
  const [stats, setStats] = useState({
    totalStores: 0,
    totalDistributors: 0,
    totalUsers: 0,
    totalIncome: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const storesSnap = await getDocs(collection(db, 'stores'));
        const distSnap = await getDocs(collection(db, 'distributors'));
        const usersSnap = await getDocs(collection(db, 'users'));
        
        setStats({
          totalStores: storesSnap.size,
          totalDistributors: distSnap.size,
          totalUsers: usersSnap.size,
          totalIncome: (storesSnap.size * 250000) + (distSnap.size * 500000), // Calculation placeholder
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Moliyaviy Hisobotlar</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SaaS tizimi moliyaviy o'sishi va analitikasi</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-shadow shadow-lg shadow-slate-900/20">
          <Download size={14} />
          Barcha ma'lumotlarni yuklab olish
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Oylik Taxminiy Tushum", value: `${stats.totalIncome.toLocaleString()} UZS`, change: "+12.5%", icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Barcha Do'konlar", value: `${stats.totalStores} ta`, change: "+5%", icon: Building, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Distribyutorlar", value: `${stats.totalDistributors} ta`, change: "+2 ta", icon: Truck, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Barcha Foydalanuvchilar", value: `${stats.totalUsers} ta`, change: "+15%", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
               <h3 className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
               <span className="text-[10px] font-black text-emerald-500">{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                Daromad Dinamikasi
             </h3>
             <div className="flex gap-2">
                <button className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600">Oylik</button>
             </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                <PieChart size={16} className="text-indigo-600" />
                Obunalar Ta'qsimoti
             </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="commission" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a] text-white p-10 rounded-[40px] relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
           <div>
              <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Sizning SaaS daromadingiz qanday hisoblanadi?</h3>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8 uppercase tracking-widest">
                Tizim daromadi ikki manbadan shakllanadi: <br/> 
                1. Oylik/Yillik obuna to'lovlari (Fixed)<br/>
                2. Marketplace-dagi savdolardan olinadigan 5% kommissiya (Variable)
              </p>
              <div className="flex gap-4">
                 <div className="p-4 bg-slate-800 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Obunalar</p>
                    <p className="text-lg font-black tracking-tighter">75%</p>
                 </div>
                 <div className="p-4 bg-slate-800 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Marketplace</p>
                    <p className="text-lg font-black tracking-tighter">25%</p>
                 </div>
              </div>
           </div>
           
           <div className="bg-slate-800 border border-white/5 p-8 rounded-3xl flex flex-col justify-center">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Umumiy Tushumlar Tarixi</p>
              <div className="space-y-4">
                 {[
                   { user: 'Chilonzor Market', type: 'Obuna', amount: '250,000' },
                   { user: 'Global Distribyutor', type: 'Kommissia', amount: '1,450,000' },
                   { user: 'Samarqand Boutique', type: 'Obuna', amount: '500,000' },
                 ].map((pay, i) => (
                   <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div>
                         <p className="text-xs font-black uppercase tracking-tight">{pay.user}</p>
                         <p className="text-[8px] text-slate-500 font-bold uppercase">{pay.type}</p>
                      </div>
                      <p className="text-xs font-black text-blue-400">{pay.amount} UZS</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
        <AreaChart className="absolute right-[-100px] bottom-[-100px] opacity-10 blur-xl" width={400} height={400} data={data}>
           <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb" />
        </AreaChart>
      </div>
    </div>
  );
}
