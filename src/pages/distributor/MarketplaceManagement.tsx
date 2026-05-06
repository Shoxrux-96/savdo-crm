import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Globe, 
  Search, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Eye,
  ShoppingCart
} from 'lucide-react';

export default function MarketplaceManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const snap = await getDocs(collection(db, 'marketplace'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Marketplace Boshqaruvi</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Mahsulotlarni global marketplace-ga joylash va monitoring</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200">
           <div className="flex items-center gap-2">
              <Eye size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-900 uppercase">12.4K ko'rilgan</span>
           </div>
           <div className="w-px h-4 bg-slate-200"></div>
           <div className="flex items-center gap-2">
              <ShoppingCart size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-slate-900 uppercase">142 sotuv</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-6">Aktiv Marketplace Mahsulotlari</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {products.map((p) => (
                   <div key={p.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm">
                            <Globe size={20} />
                         </div>
                         <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded">Aktiv</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-tighter mb-1 truncate">{p.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">SKU: {p.sku}</p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                         <div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">Sotuv narxi</p>
                            <p className="text-sm font-black text-slate-900">{p.price.toLocaleString()} UZS</p>
                         </div>
                         <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <TrendingUp size={18} />
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-[#0f172a] text-white p-8 rounded-3xl relative overflow-hidden">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6 relative z-10">Marketplace-ga Joylash</h3>
              <div className="space-y-4 relative z-10">
                 <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Mahsulotni tanlang</label>
                    <select className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-widest outline-none">
                       <option>Warehouse-dan tanlash...</option>
                       <option>iPhone 15 Pro</option>
                       <option>Samsung Galaxy S23</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Marketplace Narxi</label>
                    <input 
                       type="number" 
                       placeholder="Narx kiriting..."
                       className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-bold outline-none"
                    />
                 </div>
                 <button className="w-full py-4 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                    <Send size={16} />
                    Joylashtirish
                 </button>
              </div>
              <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-4">
                 <AlertCircle size={32} />
              </div>
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Muhim Eslatma</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
                 Marketplace-ga joylangan har bir mahsulotdan tizim operatori 5% kommissiya ushlab qoladi. Narxni shunga muvofiq belgilang.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
