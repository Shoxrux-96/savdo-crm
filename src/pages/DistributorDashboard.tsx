import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Package, 
  Truck, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  Globe,
  Settings,
  AlertTriangle,
  MoveUpRight,
  ShoppingCart
} from 'lucide-react';

export default function DistributorDashboard() {
  const [stats, setStats] = useState({
    warehouseCount: 0,
    marketplaceCount: 0,
    pendingOrders: 0,
    monthlyTurnover: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Logic for fetching distributor specific data
    setLoading(false);
  }, []);

  const statsList = [
    { label: "Ombordagi tovarlar", value: "1,240 ta", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Marketplace-da", value: "48 turda", icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Yangi buyurtmalar", value: "12 ta", icon: ShoppingCart, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Oylik turg'unlik", value: "85,400,000", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Distribyutor Paneli</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Omborxona va logistika nazorati</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 border border-indigo-700 rounded-xl text-xs font-black text-white uppercase tracking-widest hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-900/20">
            <Globe size={14} />
            Marketplace-ga yuborish
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-blue-700 rounded-xl text-xs font-black text-white uppercase tracking-widest hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-900/20">
            <Plus size={14} />
            Yangi Tovar (Kirim)
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsList.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={24} />
            </div>
            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{stat.label}</div>
            <div className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value} {stat.label === 'Oylik turg\'unlik' ? 'UZS' : ''}</div>
            <stat.icon size={80} className="absolute right-[-10px] bottom-[-10px] opacity-[0.03] group-hover:opacity-10 transition-opacity" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Movements */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden border-2 border-slate-100">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest">Kirim-Chiqim Tarixi</h3>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">Inbound</button>
              <button className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-100">Outbound</button>
            </div>
          </div>
          <div className="p-4">
             {[
               { name: 'Redmi Note 12', sku: 'RM-12-RED', qty: '+50', type: 'in', date: 'Biroz oldin', user: 'Aziz' },
               { name: 'Samsung A54', sku: 'SM-A54-BK', qty: '-20', type: 'out', date: '15 minut oldin', user: 'Do\'kon #03' },
               { name: 'iPhone 15 Pro', sku: 'IP-15-PR', qty: '+10', type: 'in', date: '1 soat oldin', user: 'Zahriddin' },
               { name: 'AirPods Max', sku: 'AP-MAX-WT', qty: '-5', type: 'out', date: '3 soat oldin', user: 'Do\'kon #12' },
             ].map((move, i) => (
               <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors rounded-2xl group">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                   move.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                 }`}>
                   {move.type === 'in' ? <ArrowDownLeft size={24}/> : <ArrowUpRight size={24}/>}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tighter">{move.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{move.sku} • {move.user}</p>
                 </div>
                 <div className="text-right">
                    <p className={`text-sm font-black ${move.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {move.qty} ta
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{move.date}</p>
                 </div>
               </div>
             ))}
          </div>
          <button className="w-full py-4 bg-slate-50 border-t border-slate-100 text-xs font-black text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-widest">
            Barcha harakatlarni ko'rish
          </button>
        </div>

        {/* Alerts & Marketplace */}
        <div className="space-y-8">
          <div className="bg-rose-600 text-white p-8 rounded-3xl shadow-xl shadow-rose-900/20 relative overflow-hidden">
            <h3 className="font-black text-sm uppercase tracking-widest mb-2">Zaxira Ogohlantiruvi</h3>
            <p className="text-[10px] text-rose-100 font-bold uppercase tracking-widest mb-6 border-b border-white/20 pb-4">Tugash arafasidagi tovarlar</p>
            
            <div className="space-y-4">
               {[
                 { name: 'JBL Charge 5', qty: '3 ta' },
                 { name: 'Apple Watch S8', qty: '1 ta' }
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-tight">{item.name}</span>
                    <span className="px-2 py-0.5 bg-white/20 rounded text-[9px] font-black uppercase">{item.qty}</span>
                 </div>
               ))}
            </div>
            
            <button className="w-full mt-8 py-3 bg-white text-rose-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 transition-colors animate-pulse">
              ZAXIRANI TO'LDIRISH
            </button>
            
            <AlertTriangle className="absolute right-[-20px] top-[-20px] w-32 h-32 opacity-10" />
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 font-black text-xs uppercase tracking-widest mb-6">
              <Globe size={18} />
              Marketplace Faolligi
            </div>
            <div className="text-center py-4">
               <div className="text-4xl font-black text-slate-900 tracking-tighter">158</div>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Bugungi ko'rishlar soni</p>
            </div>
            <div className="mt-6 flex gap-2">
               <div className="flex-1 bg-slate-50 p-3 rounded-2xl text-center">
                  <div className="text-xs font-black text-slate-900 tracking-tighter">8</div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">Sotuvlar</p>
               </div>
               <div className="flex-1 bg-slate-50 p-3 rounded-2xl text-center">
                  <div className="text-xs font-black text-slate-900 tracking-tighter">24</div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">Savatda</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
