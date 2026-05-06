import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Users, 
  Store as StoreIcon, 
  Truck, 
  CreditCard, 
  TrendingUp, 
  Plus,
  Download,
  MoreVertical,
  Search
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStores: 0,
    totalDistributors: 0,
    activePlans: 0,
    totalRevenue: 0
  });
  const [recentEntities, setRecentEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const storesSnap = await getDocs(collection(db, 'stores'));
        const distSnap = await getDocs(collection(db, 'distributors'));
        const plansSnap = await getDocs(collection(db, 'plans'));
        
        setStats({
          totalStores: storesSnap.size,
          totalDistributors: distSnap.size,
          activePlans: plansSnap.size,
          totalRevenue: 4500000 // Mock revenue
        });

        // Mix entities for "Recent" list
        const entities = [
          ...storesSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'store' })),
          ...distSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'distributor' }))
        ].sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5);

        setRecentEntities(entities);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const statCards = [
    { label: "Barcha Do'konlar", value: stats.totalStores, icon: StoreIcon, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Distribyutorlar", value: stats.totalDistributors, icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Tarif Rejalari", value: stats.activePlans, icon: CreditCard, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Oylik Obuna Tushumi", value: stats.totalRevenue.toLocaleString() + " UZS", icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Tizim Ma'muri</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Global boshqaruv va tariflar paneli</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
            <Download size={14} />
            Excel Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-700 rounded-xl text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-900/20">
            <Plus size={14} />
            Yangi Sub'ekt
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</div>
            <div className={`absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-10 transition-opacity`}>
              <stat.icon size={100} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entity List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Oxirgi qo'shilganlar</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Qidirish..." 
                className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Sub'ekt Nomi</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Turi</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Sana</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Holati</th>
                  <th className="px-6 py-4 border-b border-slate-100 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentEntities.map((entity) => (
                  <tr key={entity.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">{entity.name}</div>
                      <div className="text-[9px] text-slate-400 font-bold">ID: {entity.id.slice(0,8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                        entity.type === 'store' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {entity.type === 'store' ? 'Do\'kon' : 'Distribyutor'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                      {entity.createdAt?.seconds ? new Date(entity.createdAt.seconds * 1000).toLocaleDateString() : 'Noma\'lum'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Aktiv
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Plans Management */}
        <div className="space-y-6">
          <div className="bg-[#0f172a] text-white p-6 rounded-2xl shadow-xl shadow-slate-900/20 relative overflow-hidden">
            <h3 className="font-black text-sm uppercase tracking-widest mb-2 relative z-10">Premium Tariflar</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 relative z-10">Mavjud obuna rejalari</p>
            
            <div className="space-y-3 relative z-10">
              {[
                { name: 'Basic', price: '100,000', color: 'bg-slate-800' },
                { name: 'Standard', price: '250,000', color: 'bg-blue-600' },
                { name: 'Business', price: '500,000', color: 'bg-indigo-600' }
              ].map((plan, i) => (
                <div key={i} className={`${plan.color} p-4 rounded-xl flex items-center justify-between border border-white/5`}>
                  <div>
                    <div className="text-xs font-black uppercase tracking-widest">{plan.name}</div>
                    <div className="text-[10px] text-white/50 font-bold uppercase mt-1">{plan.price} UZS / oy</div>
                  </div>
                  <button className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors">
                    Edit
                  </button>
                </div>
              ))}
            </div>
            
            <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-black text-xs uppercase tracking-widest text-slate-900 mb-4">Sizning Vazifalaringiz</h3>
            <div className="space-y-4">
              {[
                { task: 'Yangi do\'kon tasdiqlash', time: '2 soat oldin', urgent: true },
                { task: 'Distribyutor so\'rovi', time: '5 soat oldin', urgent: false },
                { task: 'To\'lov muammosi (#445)', time: '1 kun oldin', urgent: true }
              ].map((t, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-1 h-8 rounded-full ${t.urgent ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{t.task}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
