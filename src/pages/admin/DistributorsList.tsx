import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  Search, 
  Plus, 
  MoreVertical, 
  Settings,
  Percent,
  Package,
  X,
  Phone,
  MapPin,
  Trash2,
  Edit3
} from 'lucide-react';
import { UZBEKISTAN_LOCATIONS } from '../../constants/locations';

export default function DistributorsList() {
  const [distributors, setDistributors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    tin: '',
    phone: '',
    region: '',
    district: '',
    address: '',
    commission: 5,
    type: 'distributor'
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'distributors'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'distributors'));
        setDistributors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'distributors', editingId), { ...formData, updatedAt: serverTimestamp() }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `distributors/${editingId}`));
        setDistributors(distributors.map(d => d.id === editingId ? { ...d, ...formData } : d));
      } else {
        const docRef = await addDoc(collection(db, 'distributors'), {
          ...formData,
          createdAt: serverTimestamp(),
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'distributors'));
        setDistributors([{ id: docRef.id, ...formData, createdAt: { seconds: Date.now() / 1000 } }, ...distributors]);
      }
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('O\'chirmoqchimisiz?')) return;
    try {
      await deleteDoc(doc(db, 'distributors', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `distributors/${id}`));
      setDistributors(distributors.filter(d => d.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', tin: '', phone: '', region: '', district: '', address: '', commission: 5, type: 'distributor' });
    setEditingId(null);
  };

  const filtered = distributors.filter(d => 
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.tin?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Ishonchli Distribyutorlar</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Omborxona va mahsulot yetkazib beruvchilar</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition-all"
        >
          <Plus size={16} />
          Yangi Distribyutor
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Distribyutor nomi yoki STIR..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-emerald-100/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kompaniya</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">STIR</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">KOMMISSIA</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">HUDUD</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((dist) => (
                <tr key={dist.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Truck size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tighter">{dist.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{dist.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-black text-slate-900 font-mono">
                    {dist.tin}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <Percent size={14} className="opacity-50" />
                      <span className="text-xs font-black">{dist.commission || 5.0}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-[10px] font-black text-slate-900 uppercase">{dist.region}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{dist.district}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingId(dist.id); setFormData(dist); setShowModal(true); }} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDelete(dist.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Distribyutor Ma'lumotlari</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Kompaniya nomi</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" placeholder="Masalan: Grand Logistic" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">STIR (TIN)</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none" placeholder="9 xonalik son" maxLength={9} value={formData.tin} onChange={e => setFormData({...formData, tin: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Telefon</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" placeholder="+998" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Viloyat</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                      value={formData.region}
                      onChange={e => setFormData({...formData, region: e.target.value, district: ''})}
                    >
                      <option value="">Viloyatni tanlang</option>
                      {Object.keys(UZBEKISTAN_LOCATIONS).map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tuman</label>
                    <select 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                      value={formData.district}
                      onChange={e => setFormData({...formData, district: e.target.value})}
                      disabled={!formData.region}
                    >
                      <option value="">Tumanni tanlang</option>
                      {formData.region && UZBEKISTAN_LOCATIONS[formData.region]?.map(district => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Kommissia (%)</label>
                    <input type="number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none" value={formData.commission} onChange={e => setFormData({...formData, commission: Number(e.target.value)})} />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all">
                  {editingId ? 'Yangilash' : 'Distribyutorni yaratish'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
