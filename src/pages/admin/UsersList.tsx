import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc,
  updateDoc 
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  Shield, 
  User as UserIcon,
  Phone,
  Building,
  Check,
  X,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { UZBEKISTAN_LOCATIONS } from '../../constants/locations';

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // New User Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    tin: '',
    role: 'store_owner',
    level: 'admin',
    position: '',
    region: '',
    district: '',
    password: '',
  });

  const [foundEntity, setFoundEntity] = useState<any>(null);
  const [searchingTIN, setSearchingTIN] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const q = query(collection(db, 'users'), orderBy('phone', 'asc'));
        const snap = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, 'users'));
        setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const searchByTIN = async () => {
    if (!formData.tin) return;
    setSearchingTIN(true);
    setFoundEntity(null);
    
    try {
      // Search in stores
      const storeQ = query(collection(db, 'stores'), where('tin', '==', formData.tin));
      const storeSnap = await getDocs(storeQ).catch(e => handleFirestoreError(e, OperationType.LIST, 'stores'));
      
      if (!storeSnap.empty) {
        setFoundEntity({ ...storeSnap.docs[0].data(), id: storeSnap.docs[0].id, type: 'store' });
      } else {
        // Search in distributors
        const distQ = query(collection(db, 'distributors'), where('tin', '==', formData.tin));
        const distSnap = await getDocs(distQ).catch(e => handleFirestoreError(e, OperationType.LIST, 'distributors'));
        if (!distSnap.empty) {
          setFoundEntity({ ...distSnap.docs[0].data(), id: distSnap.docs[0].id, type: 'distributor' });
        }
      }
    } catch (error) {
      console.error("Error searching TIN:", error);
    } finally {
      setSearchingTIN(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
       let userId = editingId;
       if (editingId) {
          // Update existing user
          await updateDoc(doc(db, 'users', editingId), {
            ...formData,
            entityId: foundEntity?.id || '',
            updatedAt: serverTimestamp(),
          }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${editingId}`));
          
          setUsers(users.map(u => u.id === editingId ? { ...u, ...formData, entityId: foundEntity?.id || '' } : u));
       } else {
          // Create new user
          const userRef = doc(collection(db, 'users'));
          userId = userRef.id;
          await setDoc(userRef, {
            ...formData,
            entityId: foundEntity?.id || '',
            status: 'active',
            createdAt: serverTimestamp(),
          }).catch(e => handleFirestoreError(e, OperationType.WRITE, `users/${userRef.id}`));
          
          setUsers([{ id: userRef.id, ...formData, entityId: foundEntity?.id || '', status: 'active' }, ...users]);
       }

       // CRITICAL: Linking entity back to the owner
       if (foundEntity && userId) {
         const collectionName = foundEntity.type === 'store' ? 'stores' : 'distributors';
         await updateDoc(doc(db, collectionName, foundEntity.id), {
           ownerId: userId,
           updatedAt: serverTimestamp()
         }).catch(e => console.error("Failed to link entity to owner:", e));
       }
       
       setShowModal(false);
       setEditingId(null);
       setFormData({
         name: '', phone: '', tin: '', role: 'store_owner', level: 'admin', position: '', region: '', district: '', password: ''
       });
       setFoundEntity(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      tin: user.tin || '',
      role: user.role || 'store_owner',
      level: user.level || 'admin',
      position: user.position || '',
      region: user.region || '',
      district: user.district || '',
      password: user.password || '',
    });
    setEditingId(user.id);
    setShowModal(true);
    // If TIN exists, we might want to "search" for the entity automatically to show it.
    if (user.tin) {
      // Small delay or just set foundEntity if we have it in user object (we don't have entity name usually)
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Ushbu foydalanuvchini o\'chirishni xohlaysizmi?')) return;
    try {
      await updateDoc(doc(db, 'users', id), { status: 'deleted' }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${id}`));
      setUsers(users.filter(u => u.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = users.filter(u => 
    u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirstRow, indexOfLastRow);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Foydalanuvchilar Paneli</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tizim kirish ruxsatnomalari va boshqaruv</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/30 hover:bg-slate-800 transition-all active:scale-95"
        >
          <UserPlus size={16} />
          Yangi Foydalanuvchi
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Ism yoki telefon bo'yicha qidirish..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-100/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Foydalanuvchi</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lavozim / Roli</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">TASHKILOT (STIR)</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {currentRows.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-all overflow-hidden bg-slate-50">
                        <UserIcon size={24} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tighter">{user.name || 'Noma\'lum'}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{user.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest w-fit ${
                        user.role === 'super_admin' ? 'bg-rose-100 text-rose-600' :
                        user.role === 'distributor' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {user.role}
                      </span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase italic">{user.position} ({user.level})</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{user.tin || '—'}</span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase">STIR bo'yicha bog'langan</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(user)}
                        className="p-2 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors"
                        title="Tahrirlash"
                      >
                        <Shield size={16} />
                      </button>
                      <button 
                         onClick={() => handleDelete(user.id)}
                         className="p-2 hover:bg-rose-100 rounded-xl text-rose-600 transition-colors"
                         title="O'chirish"
                      >
                         <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qatorar:</span>
            <select 
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black outline-none focus:ring-2 focus:ring-slate-100 transition-all"
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[10, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tight ml-2">
              {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filtered.length)} dan {filtered.length} ta
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => paginate(currentPage - 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Only show a few pages around current page if there are too many
                if (totalPages > 5 && (page < currentPage - 1 || page > currentPage + 1) && page !== 1 && page !== totalPages) {
                  if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="px-1">...</span>;
                  return null;
                }
                return (
                  <button
                    key={page}
                    onClick={() => paginate(page)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-xl text-[10px] font-black transition-all ${
                      currentPage === page 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                      : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => paginate(currentPage + 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-300 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Add User */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingId ? 'Tahrirlash' : 'Yangi Foydalanuvchi'}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{editingId ? 'Ma\'lumotlarni o\'zgartirish' : 'Tizimga kirish huquqini taqdim etish'}</p>
                 </div>
                 <button onClick={() => { setShowModal(false); setEditingId(null); }} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                    <X size={20} className="text-slate-500" />
                 </button>
              </div>

              <form onSubmit={handleAddUser} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                 <div className="space-y-4">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">F.I.SH</label>
                       <input 
                         required
                         type="text" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                         placeholder="Ismni kiriting..."
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Telefon Raqami (Login)</label>
                       <input 
                         required
                         type="tel" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                         placeholder="+998 90 123 45 67"
                         value={formData.phone}
                         onChange={e => setFormData({...formData, phone: e.target.value})}
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Parol</label>
                       <input 
                         required={!editingId}
                         type="text" 
                         minLength={8}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                         placeholder="Kamida 8 ta belgi"
                         value={formData.password}
                         onChange={e => setFormData({...formData, password: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">STIR (TASHKILOTNI BOG'LASH)</label>
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="STIR raqami..."
                            value={formData.tin}
                            onChange={e => setFormData({...formData, tin: e.target.value})}
                          />
                          <button 
                            type="button"
                            onClick={searchByTIN}
                            disabled={searchingTIN || !formData.tin}
                            className="px-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase disabled:opacity-50"
                          >
                             {searchingTIN ? '...' : 'IZLASH'}
                          </button>
                       </div>
                       {foundEntity && (
                         <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Building size={14} className="text-emerald-600" />
                               <span className="text-[10px] font-black text-emerald-700 uppercase">{foundEntity.name}</span>
                            </div>
                            <Check size={14} className="text-emerald-600" />
                         </motion.div>
                       )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Roli</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                            value={formData.role}
                            onChange={e => setFormData({...formData, role: e.target.value})}
                          >
                             <option value="store_owner">Do'kon</option>
                             <option value="distributor">Distribyutor</option>
                             <option value="super_admin">Super Admin</option>
                          </select>
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Daraja</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                            value={formData.level}
                            onChange={e => setFormData({...formData, level: e.target.value})}
                          >
                             <option value="admin">Admin</option>
                             <option value="employee">Hodim</option>
                          </select>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Viloyat</label>
                          <select 
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none"
                            value={formData.region}
                            onChange={e => setFormData({...formData, region: e.target.value, district: ''})}
                          >
                            <option value="">Tanlang</option>
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
                            <option value="">Tanlang</option>
                            {formData.region && UZBEKISTAN_LOCATIONS[formData.region]?.map(district => (
                              <option key={district} value={district}>{district}</option>
                            ))}
                          </select>
                       </div>
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Lavozimi</label>
                       <input 
                         type="text" 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none transition-all"
                         placeholder="Masalan: Menejer"
                         value={formData.position}
                         onChange={e => setFormData({...formData, position: e.target.value})}
                       />
                    </div>
                 </div>

                 <div className="md:col-span-2 pt-6">
                    <button 
                      type="submit"
                      className="w-full py-4 bg-slate-900 text-white rounded-[20px] text-xs font-black uppercase tracking-widest shadow-2xl shadow-slate-900/40 hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                    >
                       <Shield size={18} />
                       {editingId ? 'Saqlash' : 'Foydalanuvchini yaratish va Ruxsat berish'}
                    </button>
                 </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
