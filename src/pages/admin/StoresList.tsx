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
  Store as StoreIcon, 
  Search, 
  Plus, 
  MoreVertical, 
  ExternalLink,
  Shield,
  Ban,
  X,
  MapPin,
  Phone,
  Trash2,
  Edit3,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';
import { UZBEKISTAN_LOCATIONS } from '../../constants/locations';
import { writeBatch } from 'firebase/firestore';

export default function StoresList() {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingBulk, setProcessingBulk] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tin: '',
    phone: '',
    region: '',
    district: '',
    address: '',
    subscriptionStatus: 'trial',
    type: 'store'
  });

  useEffect(() => {
    async function fetchStores() {
      try {
        const q = query(collection(db, 'stores'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'stores'));
        setStores(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'stores', editingId), { 
          ...formData, 
          updatedAt: serverTimestamp() 
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `stores/${editingId}`));
        setStores(stores.map(s => s.id === editingId ? { ...s, ...formData } : s));
      } else {
        const docRef = await addDoc(collection(db, 'stores'), {
          ...formData,
          ownerId: 'system', // Initially system owned or manually linked later
          createdAt: serverTimestamp(),
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'stores'));
        setStores([{ id: docRef.id, ...formData, createdAt: { seconds: Date.now() / 1000 } }, ...stores]);
      }
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Haqiqatan ham o\'chirmoqchimisiz?')) return;
    try {
      await deleteDoc(doc(db, 'stores', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `stores/${id}`));
      setStores(stores.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', tin: '', phone: '', region: '', district: '', address: '', subscriptionStatus: 'trial', type: 'store' });
    setEditingId(null);
  };

  const filtered = stores.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.tin?.includes(searchTerm)
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Haqiqatan ham ${selectedIds.length} ta do'konni o'chirmoqchimisiz?`)) return;
    setProcessingBulk(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(db, 'stores', id));
      });
      await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'bulk-delete'));
      setStores(stores.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingBulk(false);
    }
  };

  const handleBulkStatusChange = async (status: string) => {
    setProcessingBulk(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(db, 'stores', id), { subscriptionStatus: status, updatedAt: serverTimestamp() });
      });
      await batch.commit().catch(e => handleFirestoreError(e, OperationType.WRITE, 'bulk-update'));
      setStores(stores.map(s => selectedIds.includes(s.id) ? { ...s, subscriptionStatus: status } : s));
      setSelectedIds([]);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessingBulk(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Barcha Do'konlar</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tizimdagi barcha chakana savdo nuqtalari</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all font-sans"
        >
          <Plus size={16} />
          Yangi Do'kon
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Do'kon nomi yoki STIR... "
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-blue-100/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white border-b border-slate-100">
                <th className="pl-8 py-5 w-10">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    {selectedIds.length === filtered.length && filtered.length > 0 ? (
                      <CheckSquare size={18} className="text-blue-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ma'lumotlar</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">STIR</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">HUDUD</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">OBUNA</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((store) => (
                <tr key={store.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.includes(store.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="pl-8 py-6">
                    <button 
                      onClick={() => toggleSelectOne(store.id)}
                      className="text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      {selectedIds.includes(store.id) ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} />
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <StoreIcon size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tighter">{store.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                           <Phone size={10} /> {store.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="font-mono text-xs font-black text-slate-900 tracking-widest">{store.tin}</span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{store.region}</span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase">{store.district}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      store.subscriptionStatus === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {store.subscriptionStatus}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                         onClick={() => { setSelectedStore(store); setShowDetailsModal(true); }}
                         className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                         title="Batafsil ko'rish"
                       >
                         <ExternalLink size={18} />
                       </button>
                       <button 
                         onClick={() => { setEditingId(store.id); setFormData(store); setShowModal(true); }}
                         className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                       >
                         <Edit3 size={18} />
                       </button>
                       <button 
                         onClick={() => handleDelete(store.id)}
                         className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                       >
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
        {selectedIds.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-slate-900 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-6 backdrop-blur-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center gap-3 pr-6 border-r border-slate-700">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xs">
                  {selectedIds.length}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanlangan</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  disabled={processingBulk}
                  onClick={() => handleBulkStatusChange('active')}
                  className="px-4 py-2 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 text-emerald-400"
                >
                  <Shield size={16} />
                  Aktivlashtirish
                </button>
                <button 
                  disabled={processingBulk}
                  onClick={() => handleBulkStatusChange('expired')}
                  className="px-4 py-2 hover:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 text-amber-400"
                >
                  <Ban size={16} />
                  Muddati tugatish
                </button>
                <button 
                  disabled={processingBulk}
                  onClick={handleBulkDelete}
                  className="px-4 py-2 hover:bg-rose-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2 text-rose-500"
                >
                  <Trash2 size={16} />
                  O'chirish
                </button>
              </div>

              {processingBulk && (
                <div className="flex items-center gap-2 pl-4 border-l border-slate-700">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailsModal && selectedStore && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetailsModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <StoreIcon size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{selectedStore.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Do'kon tafsilotlari</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Asosiy ma'lumotlar</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">STIR (TIN)</p>
                        <p className="font-black text-slate-800 tracking-widest">{selectedStore.tin}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Telefon</p>
                        <p className="font-black text-slate-800 tracking-widest">{selectedStore.phone}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Joylashuv</h4>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic space-y-4">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Region</p>
                        <p className="font-black text-slate-800">{selectedStore.region}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Tuman</p>
                        <p className="font-black text-slate-800">{selectedStore.district}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-1">Manzil</p>
                        <p className="font-bold text-slate-600 text-xs">{selectedStore.address || 'Kiritilmagan'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Holat va Obuna</h4>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Status</p>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          selectedStore.subscriptionStatus === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {selectedStore.subscriptionStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Yaratilgan sana</p>
                        <p className="text-[10px] font-black text-slate-700">{selectedStore.createdAt?.seconds ? new Date(selectedStore.createdAt.seconds * 1000).toLocaleDateString() : 'Noma\'lum'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-600 rounded-[32px] text-white shadow-xl shadow-blue-500/20 italic">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Eslatma</p>
                    <p className="text-xs font-bold leading-relaxed">Admin sifatida siz ushbu do'kon ma'lumotlarini boshqarish, obunasini to'xtatish yoki faollashtirish huquqiga egasiz.</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button 
                  onClick={() => { setShowDetailsModal(false); setEditingId(selectedStore.id); setFormData(selectedStore); setShowModal(true); }}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Edit3 size={16} />
                  Ma'lumotlarni tahrirlash
                </button>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="px-8 py-4 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingId ? 'Ma\'lumotlarni tahrirlash' : 'Yangi do\'kon qo\'shish'}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Do'kon nomi</label>
                    <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" placeholder="Masalan: Chilonzor Market" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all">
                  {editingId ? 'Saqlash' : 'Do\'konni yaratish'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
