import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Globe,
  Filter,
  MoreVertical,
  BarChart3
} from 'lucide-react';

export default function DistributorWarehouse() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Distributor ID context is normally passed, here we simulate
    async function fetchProducts() {
      // In real scenario, filter by distributorId
      const snap = await getDocs(collection(db, 'marketplace')); 
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchProducts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Markaziy Omborxona</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Barcha mahsulotlar qoldig'i va logistikasi</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-colors shadow-sm">
            <BarChart3 size={14} />
            Statistika
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all text-white">
            <Plus size={14} />
            Yangi Kirim
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Jami Tovar", value: "45,200 ta", icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Bugungi Kirim", value: "1,200 ta", icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Bugungi Chiqim", value: "840 ta", icon: ArrowUpRight, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                <p className="text-xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="SKU yoki mahsulot nomi..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors">
            <Filter size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">MAHSULOT ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NOMI</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">QOLDIQ</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NARXI</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">MARKETPLACE</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-[10px] text-slate-400 font-bold uppercase">#{product.sku || product.id.slice(0,8)}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-black text-slate-900 uppercase tracking-tighter">{product.name}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{product.category || 'Elektronika'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className={`text-xs font-black ${product.quantity < 10 ? 'text-rose-600' : 'text-slate-900'}`}>{product.quantity} ta</span>
                       <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${product.quantity < 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${Math.min(100, product.quantity)}%` }}
                          />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-black text-slate-900">{product.price.toLocaleString()} UZS</td>
                  <td className="px-6 py-4">
                     <button className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                        <Globe size={10} />
                        Active
                     </button>
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
    </div>
  );
}
