import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { motion } from 'motion/react';
import { 
  Globe, 
  Search, 
  Filter, 
  MapPin, 
  ShoppingCart, 
  Tag,
  ChevronRight,
  TrendingUp,
  Truck
} from 'lucide-react';
import { UZBEKISTAN_LOCATIONS } from '../../constants/locations';

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('');

  useEffect(() => {
    async function fetchData() {
      const snap = await getDocs(collection(db, 'marketplace'));
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesRegion = regionFilter === 'All' || p.region === regionFilter;
    const matchesDistrict = !districtFilter || districtFilter === 'All' || p.district === districtFilter;
    return matchesSearch && matchesCategory && matchesRegion && matchesDistrict;
  });

  return (
    <div className="space-y-8">
      {/* Search & Filter Header */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Mahsulot nomi..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-100/30 transition-all uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="All">Barcha Kategoriyalar</option>
              <option value="Elektronika">Elektronika</option>
              <option value="Oziq-ovqat">Oziq-ovqat</option>
              <option value="Kiyim-kechak">Kiyim-kechak</option>
            </select>
          </div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none"
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setDistrictFilter('All');
              }}
            >
              <option value="All">Barcha Hududlar</option>
              {Object.keys(UZBEKISTAN_LOCATIONS).map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none"
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              disabled={regionFilter === 'All'}
            >
              <option value="All">Barcha Tumanlar</option>
              {regionFilter !== 'All' && UZBEKISTAN_LOCATIONS[regionFilter]?.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-blue-500/5 transition-all"
          >
            <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                  <Globe size={48} className="group-hover:scale-110 transition-transform duration-500" />
               </div>
               <div className="absolute top-4 left-4">
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur rounded-lg text-[9px] font-black uppercase tracking-widest text-blue-600 shadow-sm">
                    {product.category || 'MARKET'}
                  </span>
               </div>
            </div>
            
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                 <h3 className="font-black text-slate-900 text-sm uppercase tracking-tighter leading-tight">{product.name}</h3>
                 <p className="text-xs font-black text-blue-600 tracking-tighter shrink-0 ml-4">{product.price.toLocaleString()} UZS</p>
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center">
                    <Truck size={12} className="text-slate-400" />
                 </div>
                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Distribyutor: {product.distributorName || 'Premium Supplier'}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-auto">
                 <button className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-colors">
                    <ShoppingCart size={14} />
                    Sotib olish
                 </button>
                 <button className="flex items-center justify-center py-3 bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white hover:border-slate-300 transition-all">
                    Batafsil
                 </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-32 text-center">
             <Globe size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Marketplace-da mahsulotlar topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
