import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp, doc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MoreVertical,
  Plus,
  DollarSign,
  X,
  Building,
  Check
} from 'lucide-react';

export default function SubscriptionManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    storeId: '',
    entityName: '',
    amount: 250000,
    method: 'CASH',
    status: 'verified'
  });

  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const pSnap = await getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc'))).catch(e => handleFirestoreError(e, OperationType.LIST, 'payments'));
        setPayments(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const sSnap = await getDocs(collection(db, 'stores')).catch(e => handleFirestoreError(e, OperationType.LIST, 'stores'));
        setStores(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const [searchingTIN, setSearchingTIN] = useState(false);
  const [foundStore, setFoundStore] = useState<any>(null);
  const [tinInput, setTinInput] = useState('');

  const searchStoreByTIN = async () => {
    if (!tinInput) return;
    setSearchingTIN(true);
    setFoundStore(null);
    try {
      const q = query(collection(db, 'stores'), where('tin', '==', tinInput));
      const snap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'stores'));
      if (!snap.empty) {
        const storeData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setFoundStore(storeData);
        setFormData({ ...formData, storeId: storeData.id, entityName: (storeData as any).name });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearchingTIN(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundStore) return;
    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...formData,
        createdAt: serverTimestamp(),
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'payments'));
      setPayments([{ id: docRef.id, ...formData, createdAt: { seconds: Date.now() / 1000 } }, ...payments]);
      setShowModal(false);
      setTinInput('');
      setFoundStore(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'payments', id), { status: newStatus }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `payments/${id}`));
      setPayments(payments.map(p => p.id === id ? { ...p, status: newStatus } : p));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Obunalar & To'lovlar</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Litsenziya to'lovlarini nazorat qilish tizimi</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all font-sans"
        >
          <Plus size={16} />
          To'lovni Qabul Qilish
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           {/* Payments List */}
           <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50/50 border-b border-slate-100">
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">To'lov ID</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sub'ekt</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Summa</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {payments.map((p) => (
                         <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-6">
                               <div className="text-xs font-black text-slate-900 uppercase tracking-widest italic">#{p.id.slice(0, 8)}</div>
                               <div className="text-[9px] text-slate-400 font-bold uppercase">
                                  {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="text-sm font-black text-slate-900 uppercase tracking-tighter">{p.entityName}</div>
                               <div className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">{p.method}</div>
                            </td>
                            <td className="px-8 py-6 text-xs font-black text-slate-900">
                               {p.amount?.toLocaleString()} UZS
                            </td>
                            <td className="px-8 py-6">
                               <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                 p.status === 'verified' ? 'bg-emerald-50 text-emerald-600' :
                                 p.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                               }`}>
                                 {p.status === 'verified' ? <CheckCircle2 size={12}/> : 
                                  p.status === 'pending' ? <Clock size={12}/> : <XCircle size={12}/>}
                                 {p.status === 'verified' ? 'TASDIQLANGAN' :
                                  p.status === 'pending' ? 'KUTILMOQDA' : 'XATOLIK'}
                               </span>
                            </td>
                         </tr>
                       ))}
                       {payments.length === 0 && (
                         <tr>
                            <td colSpan={4} className="px-8 py-32 text-center text-xs font-bold text-slate-300 uppercase italic tracking-widest">
                               Tranzaksiyalar mavjud emas
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div className="bg-[#0f172a] p-10 rounded-[40px] text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden">
              <CreditCard className="mb-6 text-blue-400" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Umumiy Tushum</p>
              <h3 className="text-4xl font-black tracking-tighter mb-8">
                {payments.filter(p => p.status === 'verified').reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()} 
                <span className="text-sm font-bold text-slate-500 ml-2">UZS</span>
              </h3>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-blue-500 w-[70%]" />
              </div>
              <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
           </div>

           <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 font-sans">Payment Summary</h4>
              <div className="space-y-4">
                 {[
                   { label: 'Tasdiqlangan', value: payments.filter(p => p.status === 'verified').length, color: 'text-emerald-500' },
                   { label: 'Kutilayotgan', value: payments.filter(p => p.status === 'pending').length, color: 'text-amber-500' },
                   { label: 'Rad Etilgan', value: payments.filter(p => p.status === 'failed').length, color: 'text-rose-500' },
                 ].map((s, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-600">{s.label}</span>
                      <span className={`text-sm font-black ${s.color}`}>{s.value} ta</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Manual Payment Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 font-sans">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">To'lovni Tasdiqlash</h3>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><X size={20}/></button>
              </div>

              <form onSubmit={handleAddPayment} className="space-y-8">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">TASHKILOT STIR (TIN) RAQAMI</label>
                   <div className="flex gap-3">
                      <input 
                        required
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black uppercase outline-none focus:ring-4 focus:ring-blue-100/50 transition-all font-mono"
                        placeholder="STIR kiriting..."
                        maxLength={9}
                        value={tinInput}
                        onChange={(e) => setTinInput(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={searchStoreByTIN}
                        disabled={searchingTIN || !tinInput}
                        className="px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase disabled:opacity-50"
                      >
                         {searchingTIN ? '...' : 'IZLASH'}
                      </button>
                   </div>
                   {foundStore && (
                     <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Building size={18} className="text-emerald-600" />
                           <span className="text-xs font-black text-emerald-900 uppercase">{foundStore.name}</span>
                        </div>
                        <Check size={18} className="text-emerald-600" />
                     </motion.div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">SUMMA (UZS)</label>
                    <input type="number" required className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-black outline-none" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">USULI</label>
                    <select className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none" value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})}>
                      <option value="CASH">NAQD</option>
                      <option value="CARD">KARTA</option>
                      <option value="TRANSFER">O'TKAZMA</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                  <Check size={20} />
                  To'lovni Tasdiqlash
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
