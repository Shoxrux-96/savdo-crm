import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { auth, db, handleFirestoreError, OperationType, testConnection } from './lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, where, getDocs, limit, addDoc, setDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Store, UserProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Store as StoreIcon,
  Search,
  Users,
  Globe,
  Truck,
  CreditCard
} from 'lucide-react';

// Pages
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Reports from './pages/Reports';
import AdminDashboard from './pages/AdminDashboard';
import DistributorDashboard from './pages/DistributorDashboard';

// Admin Pages
import StoresList from './pages/admin/StoresList';
import DistributorsList from './pages/admin/DistributorsList';
import PlansList from './pages/admin/PlansList';
import AdminReports from './pages/admin/AdminReports';
import SubscriptionManagement from './pages/admin/SubscriptionManagement';
import UsersList from './pages/admin/UsersList';

// Distributor Pages
import Warehouse from './pages/distributor/Warehouse';
import MarketplaceManagement from './pages/distributor/MarketplaceManagement';
import Orders from './pages/distributor/Orders';

// Shared Pages
import Marketplace from './pages/shared/Marketplace';

import { UZBEKISTAN_LOCATIONS } from './constants/locations';


export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const checkSession = async () => {
      console.log("Checking session...");
      testConnection(); // Run in background to log errors if any
      const savedUser = localStorage.getItem('app_user_profile');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setProfile(parsed);
        setUser({ uid: parsed.id, displayName: parsed.name });
        
        if (parsed.role === 'store_owner' && parsed.id) {
          const storesRef = collection(db, 'stores');
          const q = query(storesRef, where('ownerId', '==', parsed.id), limit(1));
          try {
            const querySnapshot = await getDocs(q);
            if (querySnapshot && !querySnapshot.empty) {
               const storeDoc = querySnapshot.docs[0];
               setStore({ id: storeDoc.id, ...storeDoc.data() } as Store);
            } else {
              console.warn("No store found for owner:", parsed.id);
            }
          } catch (e) {
            console.error("Store fetch failed:", e);
          }
        }
      }

      try {
        console.log("Bootstrapping check...");
        const adminPhone = '+998999649695';
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phone', '==', adminPhone), limit(1));
        const adminSnap = await getDocs(q);
        
        if (adminSnap.empty) {
          console.log("Super-admin not found, creating...");
          const adminId = 'super_admin_001';
          const adminProfile: UserProfile = {
            id: adminId,
            phone: adminPhone,
            password: '999649695',
            name: 'Asosiy Admin',
            role: 'super_admin',
            status: 'active'
          };
          await setDoc(doc(db, 'users', adminId), adminProfile);
          console.log("Super-admin created successfully.");
        } else {
          console.log("Super-admin already exists.");
        }
      } catch (e) {
        console.error("Bootstrap error:", e);
      }
      
      setLoading(false);
    };

    checkSession();
  }, []);

  const handleLogin = async (phone: string, pass: string) => {
    let cleanPhone = phone.replace(/\s+/g, '').trim();
    if (!cleanPhone.startsWith('+')) {
      cleanPhone = '+' + cleanPhone;
    }
    console.log("Attempting login for:", cleanPhone);
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('phone', '==', cleanPhone));
      const snap = await getDocs(q).catch(e => {
        handleFirestoreError(e, OperationType.LIST, 'users');
      });
      
      if (!snap || snap.empty) {
        console.log("No user found with this phone");
        alert("Telefon raqam yoki parol noto'g'ri!");
        setLoading(false);
        return;
      }

      const userData = snap.docs[0].data() as UserProfile;
      const userProfile = { ...userData, id: snap.docs[0].id };
      
      console.log("User found, checking password...");
      if (userProfile.password !== pass) {
        console.log("Password mismatch");
        alert("Telefon raqam yoki parol noto'g'ri!");
        setLoading(false);
        return;
      }

      if (userProfile.status !== 'active') {
        alert("Sizning hisobingiz bloklangan yoki o'chirilgan!");
        setLoading(false);
        return;
      }

      console.log("Login successful");
      setProfile(userProfile);
      setUser({ uid: userProfile.id, displayName: userProfile.name });
      localStorage.setItem('app_user_profile', JSON.stringify(userProfile));

      if (userProfile.role === 'store_owner') {
        const storesRef = collection(db, 'stores');
        const sq = query(storesRef, where('ownerId', '==', userProfile.id), limit(1));
        const sSnap = await getDocs(sq);
        if (!sSnap.empty) {
          setStore({ id: sSnap.docs[0].id, ...sSnap.docs[0].data() } as Store);
        } else {
          console.warn("Store not found for user:", userProfile.id);
          // Actually, if we don't find a store, the UI will show the "Do'kon ma'lumotlari topilmadi" message we added earlier.
        }
      }
    } catch (error) {
      console.error("Login xatosi:", error);
      alert("Tizimga kirishda xatolik yuz berdi. Internet ulanishini tekshiring.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user_profile');
    setProfile(null);
    setUser(null);
    setStore(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-[32px] shadow-2xl max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-500/20">
            <StoreIcon size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">StoreControl</h1>
          <p className="text-sm font-bold text-slate-500 mb-10 uppercase tracking-widest text-[10px]">Tizimga kirish</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const target = e.target as any;
            handleLogin(target.phone.value, target.password.value);
          }} className="space-y-6 text-left">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Telefon Raqami</label>
              <input 
                name="phone"
                type="tel" 
                required
                placeholder="+998 90 123 45 67"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Parol</label>
              <input 
                name="password"
                type="password" 
                required
                minLength={8}
                placeholder="********"
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kirilmoqda...
                </>
              ) : "Kirish"}
            </button>
          </form>
          
          <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Texnik yordam: +998 90 000 00 00
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-xl text-[10px] font-bold text-blue-600 text-left">
            <p className="uppercase tracking-widest mb-1">Test rejimi:</p>
            <p>Tel: +998 99 964 96 95</p>
            <p>Parol: 999649695</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (profile?.role === 'store_owner' && !store && loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const renderSidebar = () => {
    const commonNav = [
      { id: 'dashboard', label: 'Bosh sahifa', icon: LayoutDashboard },
    ];

    const storeNav = [
      { id: 'pos', label: 'Kassa / POS', icon: ShoppingCart },
      { id: 'inventory', label: 'Omborxona', icon: Package },
      { id: 'marketplace', label: 'Marketplace', icon: Globe },
      { id: 'reports', label: 'Hisobotlar', icon: BarChart3 },
    ];

    const adminNav = [
      { id: 'stores', label: 'Do\'konlar', icon: StoreIcon },
      { id: 'distributors', label: 'Distribyutorlar', icon: Truck },
      { id: 'marketplace', label: 'Marketplace', icon: Globe },
      { id: 'plans', label: 'Tariflar', icon: CreditCard },
      { id: 'reports', label: 'Hisobotlar', icon: BarChart3 },
      { id: 'payments', label: 'To\'lovlar', icon: CreditCard },
      { id: 'users', label: 'Foydalanuvchilar', icon: Users },
    ];

    const distributorNav = [
      { id: 'warehouse', label: 'Omborxona', icon: Package },
      { id: 'marketplace', label: 'Marketplace', icon: Globe },
      { id: 'orders', label: 'Buyurtmalar', icon: ShoppingCart },
    ];

    let navItems = [...commonNav];
    if (profile?.role === 'super_admin') navItems = [...navItems, ...adminNav];
    if (profile?.role === 'store_owner') navItems = [...navItems, ...storeNav];
    if (profile?.role === 'distributor') navItems = [...navItems, ...distributorNav];

    return (
      <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-900/20">S</div>
          <div>
            <span className="font-black text-lg text-white tracking-tighter block leading-none">SaaS CRM</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
              {profile?.role.replace('_', ' ')}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-bold tracking-tight ${
                activeTab === item.id 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <item.icon size={18} className={activeTab === item.id ? 'text-blue-400' : 'opacity-60'} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 p-2 rounded-lg bg-slate-800/30">
            <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 flex items-center justify-center text-slate-400 font-black">
              {profile?.name?.charAt(0)}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{profile?.name}</p>
              <p className="text-[10px] text-slate-500 truncate font-bold">{store?.name || profile?.phone}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black text-rose-400 hover:bg-rose-500/10 border border-rose-500/0 hover:border-rose-500/20 rounded-lg transition-all uppercase tracking-widest"
          >
            <LogOut size={14} />
            Tizimdan chiqish
          </button>
        </div>
      </aside>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {renderSidebar()}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
              {activeTab.replace('_', ' ')}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Tizim boshqaruvi va monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
              <Search className="w-4 h-4 text-slate-400 mr-3" />
              <input 
                type="text" 
                placeholder="Global qidiruv..." 
                className="bg-transparent border-none text-xs font-bold w-64 outline-none placeholder:text-slate-400"
              />
            </div>
            
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
               <div className="text-right">
                 <p className="text-[10px] font-black text-slate-900 leading-none">{profile?.name}</p>
                 <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mt-1">{profile?.phone}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 font-bold">
                 {profile?.name?.charAt(0)}
               </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-[#f8fafc] custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-8 h-full"
            >
              {profile?.role === 'super_admin' && (
                <>
                  {activeTab === 'dashboard' && <AdminDashboard />}
                  {activeTab === 'stores' && <StoresList />}
                  {activeTab === 'distributors' && <DistributorsList />}
                  {activeTab === 'marketplace' && <Marketplace />}
                  {activeTab === 'plans' && <PlansList />}
                  {activeTab === 'reports' && <AdminReports />}
                  {activeTab === 'payments' && <SubscriptionManagement />}
                  {activeTab === 'users' && <UsersList />}
                </>
              )}
              
              {profile?.role === 'store_owner' && (
                <>
                  {!store ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                      <StoreIcon size={64} className="opacity-20" />
                      <p className="text-sm font-black uppercase tracking-widest italic tracking-tighter opacity-40">Do'kon ma'lumotlari topilmadi</p>
                      <button onClick={handleLogout} className="px-6 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs">Chiqish</button>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'dashboard' && <Dashboard storeId={store.id} />}
                      {activeTab === 'pos' && <POS store={store} />}
                      {activeTab === 'inventory' && <Inventory storeId={store.id} />}
                      {activeTab === 'marketplace' && <Marketplace />}
                      {activeTab === 'reports' && <Reports storeId={store.id} />}
                    </>
                  )}
                </>
              )}

              {profile?.role === 'distributor' && (
                <>
                  {activeTab === 'dashboard' && <DistributorDashboard />}
                  {activeTab === 'warehouse' && <Warehouse />}
                  {activeTab === 'marketplace' && <MarketplaceManagement />}
                  {activeTab === 'orders' && <Orders />}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function CreateStore({ user, onStoreCreated }: { user: any, onStoreCreated: (s: Store) => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [creating, setCreating] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !region || !district) return;
    
    setCreating(true);
    try {
      const storesRef = collection(db, 'stores');
      const docRef = await addDoc(storesRef, {
        name,
        address,
        region,
        district,
        ownerId: user.uid,
        subscriptionStatus: 'active',
        createdAt: serverTimestamp()
      });
      
      onStoreCreated({
        id: docRef.id,
        name,
        address,
        region,
        district,
        ownerId: user.uid,
        subscriptionStatus: 'active',
        createdAt: new Date()
      });
    } catch (error) {
      console.error("Error creating store:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 py-12">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white p-10 rounded-[32px] shadow-2xl max-w-xl w-full"
      >
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-500/20">
           <StoreIcon size={32} />
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Do'koningizni sozlang</h1>
        <p className="text-sm font-bold text-slate-500 mb-8 uppercase tracking-widest text-[10px]">Tizimdan foydalanishni boshlash uchun ma'lumotlarni kiritish zarur</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Do'kon nomi</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Erkatoy O'yinchoqlari"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Viloyat</label>
              <select 
                value={region}
                onChange={(e) => {
                  setRegion(e.target.value);
                  setDistrict('');
                }}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                required
              >
                <option value="">Tanlang</option>
                {Object.keys(UZBEKISTAN_LOCATIONS).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tuman</label>
              <select 
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                disabled={!region}
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50"
                required
              >
                <option value="">Tanlang</option>
                {region && UZBEKISTAN_LOCATIONS[region]?.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Aniq Manzil</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masalan: Beruniy ko'chasi, 45-uy"
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <button 
            type="submit"
            disabled={creating}
            className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-black uppercase tracking-widest rounded-[20px] transition-all shadow-2xl shadow-blue-500/40 relative overflow-hidden group"
          >
            <span className="relative z-10">{creating ? 'Yaratilmoqda...' : 'Do\'konni yaratish'}</span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
