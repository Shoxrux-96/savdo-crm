import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  ShoppingCart, 
  Search, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle,
  ChevronRight,
  MoreVertical
} from 'lucide-react';

export default function DistributorOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In real app, fetch orders matching distributorId
    setLoading(false);
  }, []);

  const mockOrders = [
    { id: 'ORD-55421', store: 'Chilonzor Store #01', items: 12, total: '4,500,000', status: 'pending', date: 'Biroz oldin' },
    { id: 'ORD-55418', store: 'Yunusobod Market', items: 45, total: '18,200,000', status: 'processing', date: '2 soat oldin' },
    { id: 'ORD-55410', store: 'Samarkand Darvoza', items: 5, total: '2,100,000', status: 'shipped', date: 'Kecha' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Kelgan Buyurtmalar</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Do'konlar tomonidan yuborilgan mahsulot so'rovlari</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors">
              Eksport PDF
           </button>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
         {['Barchasi', 'Kutilmoqda', 'Jarayonda', 'Yuborilgan'].map((tab, i) => (
           <button 
             key={i}
             className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
               i === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600'
             }`}
           >
             {tab}
           </button>
         ))}
      </div>

      <div className="space-y-4">
         {mockOrders.map((order, i) => (
           <motion.div
             key={order.id}
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: i * 0.1 }}
             className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all"
           >
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
               order.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
               order.status === 'processing' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
             }`}>
                {order.status === 'pending' ? <Clock size={24}/> : 
                 order.status === 'processing' ? <Truck size={24}/> : <CheckCircle2 size={24}/>}
             </div>

             <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                   <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">{order.id}</h4>
                   <span className="text-[10px] text-slate-400 font-bold">• {order.date}</span>
                </div>
                <div className="flex items-center gap-2">
                   <p className="text-sm font-black text-slate-900 uppercase tracking-tighter truncate italic">{order.store}</p>
                </div>
             </div>

             <div className="hidden md:block px-8 border-x border-slate-100">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Mahsulotlar</p>
                <p className="text-xs font-black text-slate-900 tracking-tight">{order.items} ta turda</p>
             </div>

             <div className="px-8 text-right">
                <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Jami Summa</p>
                <p className="text-sm font-black text-blue-600 tracking-tighter">{order.total} UZS</p>
             </div>

             <div className="flex items-center gap-2 pl-4">
                <button className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all group-hover:shadow-md">
                   Batafsil
                </button>
                <button className="p-2 text-slate-300 hover:text-slate-600">
                   <MoreVertical size={16} />
                </button>
             </div>
           </motion.div>
         ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 p-6 rounded-3xl flex items-center gap-4">
         <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 shrink-0">
            <AlertCircle size={24} />
         </div>
         <div>
            <h5 className="text-xs font-black text-amber-900 uppercase tracking-widest">Yuborilmagan Buyurtmalar</h5>
            <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight">Bugun 3 ta buyurtma yetkazib berish vaqti keldi. Iltimos, logistika bo'limiga xabar bering.</p>
         </div>
      </div>
    </div>
  );
}
