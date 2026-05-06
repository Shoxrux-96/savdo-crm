import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  CheckCircle2, 
  Edit3, 
  Trash2,
  Zap,
  Shield,
  Briefcase,
  X,
  Save
} from 'lucide-react';

export default function PlansList() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    features: [''],
    color: 'bg-slate-50'
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      const q = query(collection(db, 'plans'), orderBy('price', 'asc'));
      const snap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'plans'));
      if (snap) {
        setPlans(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const planData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== ''),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'plans', editingId), planData).catch(e => handleFirestoreError(e, OperationType.UPDATE, `plans/${editingId}`));
      } else {
        await addDoc(collection(db, 'plans'), {
          ...planData,
          createdAt: serverTimestamp()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, 'plans'));
      }
      
      setShowModal(false);
      resetForm();
      fetchPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu tarifni o\'chirmoqchimisiz?')) return;
    try {
      await deleteDoc(doc(db, 'plans', id)).catch(e => handleFirestoreError(e, OperationType.DELETE, `plans/${id}`));
      fetchPlans();
    } catch (e) {
      console.error(e);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: 0, features: [''], color: 'bg-slate-50' });
    setEditingId(null);
  };

  const handleEdit = (plan: any) => {
    setEditingId(plan.id);
    setFormData({
      name: plan.name,
      price: plan.price,
      features: plan.features.length > 0 ? plan.features : [''],
      color: plan.color || 'bg-slate-50'
    });
    setShowModal(true);
  };

  const addFeatureInput = () => {
    setFormData({ ...formData, features: [...formData.features, ''] });
  };

  const updateFeature = (index: number, value: string) => {
    const updated = [...formData.features];
    updated[index] = value;
    setFormData({ ...formData, features: updated });
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const icons = [
    { id: 'shield', icon: Shield, label: 'Shield' },
    { id: 'zap', icon: Zap, label: 'Zap' },
    { id: 'briefcase', icon: Briefcase, label: 'Briefcase' }
  ];

  const colors = [
    'bg-slate-50', 'bg-blue-50', 'bg-indigo-50', 'bg-emerald-50', 'bg-rose-50', 'bg-amber-50'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Obuna Tariflari</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SaaS tizimi uchun narxlar va imkoniyatlar boshqaruvi</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all font-sans"
        >
          <Plus size={14} />
          Yangi Tarif Qo'shish
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-[0.2em] animate-pulse">Yuklanmoqda...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const IconComponent = plan.name.toLowerCase().includes('enterprise') ? Briefcase : plan.name.toLowerCase().includes('standard') ? Zap : Shield;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-[40px] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all ${plan.color}`}
              >
                <div className="absolute top-0 right-0 p-6">
                  <IconComponent size={48} className="opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500" />
                </div>

                <div className="mb-8">
                  <h3 className="text-sm font-black text-slate-900 tracking-[0.2em] uppercase mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">{plan.price.toLocaleString()}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">UZS / oy</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-10">
                  {plan.features?.map((feature: any, idx: number) => (
                    <li key={idx} className="flex items-center gap-3 text-[11px] font-black text-slate-600 uppercase tracking-tight italic">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-3 mt-auto">
                  <button 
                    onClick={() => handleEdit(plan)}
                    className="flex-1 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                  >
                    <Edit3 size={14} className="inline mr-2" />
                    Tahrirlash
                  </button>
                  <button 
                    onClick={() => handleDelete(plan.id)}
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {plans.length === 0 && (
            <div className="col-span-3 text-center py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
               <Shield size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-loose">Hozircha tariflar mavjud emas.<br/>Tizimni ishga tushirish uchun tariflarni qo'shing.</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">{editingId ? 'Tarifni Tahrirlash' : 'Yangi Tarif'}</h3>
                <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors"><X size={24}/></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Tarif nomi</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-indigo-100 transition-all" placeholder="Masalan: BASIC" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Narxi (oyiga)</label>
                    <input type="number" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none transition-all" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Rang</label>
                    <div className="flex flex-wrap gap-2">
                      {colors.map(c => (
                        <button key={c} type="button" onClick={() => setFormData({...formData, color: c})} className={`w-8 h-8 rounded-full border-2 ${c} ${formData.color === c ? 'border-slate-900 scale-110 shadow-lg' : 'border-slate-100 hover:border-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Imkoniyatlar ro'yxati</label>
                    <button type="button" onClick={addFeatureInput} className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline">
                      <Plus size={14} /> Qo'shish
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2 group">
                        <input className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold outline-none focus:bg-white transition-all shadow-sm italic" placeholder="Masalan: Cheksiz mahsulotlar" value={feature} onChange={e => updateFeature(idx, e.target.value)} />
                        <button type="button" onClick={() => removeFeature(idx)} className="p-4 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-900/30 hover:bg-slate-800 hover:y-[-2px] transition-all flex items-center justify-center gap-3">
                  <Save size={18} />
                  {editingId ? 'O' + '\'' + 'zgarishlarni Saqlash' : 'Tarifni Tasdiqlash'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="bg-slate-900 text-white p-10 rounded-[40px] relative overflow-hidden shadow-2xl shadow-slate-900/40">
        <div className="relative z-10">
          <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-3">Kommissia Sozlamalari</h3>
          <p className="text-xs text-slate-400 max-w-md uppercase tracking-tight font-bold italic opacity-60">
            Distribyutorlar uchun har bir sotuvdan olinadigan o'rtacha foiz stavkasini boshqarish
          </p>
          <div className="mt-10 flex items-end gap-12">
             <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Global Kommissia</p>
                <div className="flex items-baseline gap-2">
                  <input 
                    type="number" 
                    step="0.1"
                    className="bg-transparent text-4xl font-black text-white tracking-tighter w-24 outline-none border-b-2 border-slate-700 focus:border-blue-500 transition-colors"
                    defaultValue="5.0"
                    id="global-commission"
                  />
                  <span className="text-xl text-blue-500 font-black">%</span>
                </div>
             </div>
             <button 
               onClick={async () => {
                 const val = (document.getElementById('global-commission') as HTMLInputElement).value;
                 alert(`Global kommissia ${val}% ga yangilandi (Simulyatsiya)`);
                 // In a real app, you'd update a settings doc in Firestore:
                 // await updateDoc(doc(db, 'settings', 'global'), { commission: Number(val) });
               }}
               className="px-8 py-3 bg-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/40 active:scale-95"
             >
               Yangilash
             </button>
          </div>
        </div>
        <Zap className="absolute right-[-40px] bottom-[-40px] w-80 h-80 opacity-[0.03] text-blue-500" />
      </div>
    </div>
  );
}
