import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Scan,
  X,
  Save
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function Inventory({ storeId }: { storeId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const [isGeneralScanning, setIsGeneralScanning] = useState(false);
  
  const initialFormState = {
    name: '',
    sku: '',
    price: 0,
    cost: 0,
    quantity: 0,
    category: '',
    unit: 'dona',
    lowStockThreshold: 5
  };

  const [newProduct, setNewProduct] = useState<Partial<Product>>(initialFormState);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [storeId]);

  // General Scanner Cleanup
  useEffect(() => {
    return () => {
      // Any cleanup needed for the scanner if the component unmounts
    };
  }, []);

  async function fetchProducts() {
    if (!storeId) return;
    setLoading(true);
    try {
      const q = query(collection(db, `stores/${storeId}/products`), orderBy('updatedAt', 'desc'));
      const querySnapshot = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, `stores/${storeId}/products` || 'stores/unknown/products'));
      if (!querySnapshot) return;
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      alert("Do'kon ma'lumotlari yuklanmadi. Sahifani yangilang.");
      return;
    }
    try {
      const productsRef = collection(db, `stores/${storeId}/products`);
      
      if (editingId) {
        const productDoc = doc(db, `stores/${storeId}/products`, editingId);
        await updateDoc(productDoc, {
          ...newProduct,
          updatedAt: serverTimestamp()
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `stores/${storeId}/products/${editingId}`));
      } else {
        await addDoc(productsRef, {
          ...newProduct,
          storeId,
          updatedAt: serverTimestamp()
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, `stores/${storeId}/products`));
      }

      setIsAddModalOpen(false);
      setEditingId(null);
      setNewProduct(initialFormState);
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Haqiqatdan ham o'chirmoqchimisiz?")) return;
    try {
      const productDoc = doc(db, `stores/${storeId}/products`, id);
      await deleteDoc(productDoc).catch(e => handleFirestoreError(e, OperationType.DELETE, `stores/${storeId}/products/${id}`));
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setNewProduct({
      name: product.name,
      sku: product.sku,
      price: product.price,
      cost: product.cost,
      quantity: product.quantity,
      category: product.category,
      unit: product.unit,
      lowStockThreshold: product.lowStockThreshold,
      expiryDate: product.expiryDate
    });
    setIsAddModalOpen(true);
  };

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const startScanner = (type: 'add' | 'search') => {
    // Clear existing scanner if any
    if (scannerRef.current) {
      scannerRef.current.clear().catch(e => console.warn("Scanner clear failed", e));
      scannerRef.current = null;
    }

    if (type === 'add') setIsScanning(true);
    else setIsGeneralScanning(true);

    setTimeout(() => {
      const targetId = type === 'add' ? "reader" : "search-reader";
      const scanner = new Html5QrcodeScanner(
        targetId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );
      scannerRef.current = scanner;

      scanner.render((decodedText) => {
        if (type === 'add') {
          setNewProduct(prev => ({ ...prev, sku: decodedText }));
          setIsScanning(false);
        } else {
          setSearchTerm(decodedText);
          setIsGeneralScanning(false);
        }
        scanner.clear().catch(e => console.warn("Scanner clear failed", e));
        scannerRef.current = null;
      }, (error) => {
        // console.warn(error);
      });
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(e => console.warn("Scanner clear failed", e));
      scannerRef.current = null;
    }
    setIsScanning(false);
    setIsGeneralScanning(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Omborxona</h1>
          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest leading-none mt-1">Mahsulotlar qoldig'i va zaxira nazorati</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Qidiruv (Nomi, SKU)..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 w-64 lg:w-80 transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => isGeneralScanning ? stopScanner() : startScanner('search')}
              className={`p-3.5 rounded-2xl border transition-all shadow-sm ${isGeneralScanning ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600'}`}
              title="Skayner yordamida qidirish"
            >
              {isGeneralScanning ? <X size={20} /> : <Scan size={20} />}
            </button>
          </div>
          <button 
            onClick={() => {
              setEditingId(null);
              setNewProduct(initialFormState);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            <Plus size={20} />
            Yangi Mahsulot
          </button>
        </div>
      </div>

      {isGeneralScanning && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-slate-900 rounded-[40px] p-8 overflow-hidden mb-8 relative"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <h3 className="font-black text-[10px] uppercase tracking-[0.2em] italic">Mahsulotni skanerlang</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Shtrix-kod avtomatik aniqlanadi</p>
            </div>
            <button 
              onClick={stopScanner}
              className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div id="search-reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-3xl"></div>
        </motion.div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] animate-pulse">Yuklanmoqda...</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm flex flex-col flex-1 overflow-hidden min-h-[500px]">
           <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.2em]">Ombor Holati (Real-Vaqt)</h3>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest italic">{filteredProducts.length} ta mahsulot</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">SKU / Kod</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Mahsulot Nomi</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-center">Qoldiq</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 text-right">Narxi (UZS)</th>
                  <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">Holat</th>
                  <th className="px-8 py-4 border-b border-slate-50"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <p className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{product.sku || 'Noma\'lum'}</p>
                    </td>
                    <td className="px-8 py-5">
                       <p className="text-[11px] font-black text-slate-900 uppercase tracking-tighter italic">{product.name}</p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{product.category}</p>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className={`text-[11px] font-black uppercase italic ${product.quantity <= (product.lowStockThreshold || 5) ? 'text-rose-600' : 'text-slate-900'}`}>{product.quantity} {product.unit}</span>
                    </td>
                    <td className="px-8 py-5 text-right font-black text-slate-900 italic text-xs">
                      {product.price.toLocaleString()}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        {product.quantity <= (product.lowStockThreshold || 5) ? (
                          <div className="flex items-center gap-1.5 text-rose-500">
                             <AlertCircle size={12} />
                             <span className="text-[9px] font-black uppercase tracking-widest italic leading-none">Kam qoldi</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-500">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                             <span className="text-[9px] font-black uppercase tracking-widest italic leading-none">Yetarli</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={() => handleEditClick(product)}
                           className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                         >
                           <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => handleDeleteProduct(product.id)}
                           className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-300 italic text-xs uppercase tracking-widest font-black opacity-40">
                      Mahsulotlar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full p-10 max-h-[90vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">
                      {editingId ? "Tahrirlash" : "Yangi Mahsulot"}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ma'lumotlarni to'ldiring</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingId(null);
                    setNewProduct(initialFormState);
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {isScanning && (
                <div className="mb-8 bg-slate-50 p-6 rounded-[32px] relative overflow-hidden border-2 border-dashed border-slate-200">
                  <div id="reader" className="w-full"></div>
                  <button 
                    onClick={stopScanner}
                    className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg text-rose-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <form onSubmit={handleAddProduct} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Mahsulot nomi</label>
                    <input 
                      type="text" 
                      required
                      value={newProduct.name}
                      onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-300"
                      placeholder="Masalan: Pepsi 1.5L"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Shtrix-kod / SKU</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newProduct.sku}
                        onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-mono outline-none focus:ring-4 focus:ring-blue-500/10"
                        placeholder="860123456789"
                      />
                      <button 
                        type="button"
                        onClick={() => startScanner('add')}
                        className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
                      >
                        <Scan size={20} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Kategoriya</label>
                    <input 
                      type="text" 
                      value={newProduct.category}
                      onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-200"
                      placeholder="Ichimliklar"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Sotuv narxi (so'm)</label>
                    <input 
                      type="number" 
                      required
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Asl Narxi (so'm)</label>
                    <input 
                      type="number" 
                      required
                      value={newProduct.cost}
                      onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Miqdori & Birligi</label>
                    <div className="flex gap-2">
                       <input 
                        type="number" 
                        required
                        value={newProduct.quantity}
                        onChange={e => setNewProduct({...newProduct, quantity: Number(e.target.value)})}
                        className="flex-1 px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-blue-500/10"
                      />
                      <select 
                        value={newProduct.unit}
                        onChange={e => setNewProduct({...newProduct, unit: e.target.value})}
                        className="w-24 px-3 bg-slate-100 border-none rounded-2xl text-[10px] font-black uppercase italic outline-none"
                      >
                        <option value="dona">dona</option>
                        <option value="kg">kg</option>
                        <option value="litr">litr</option>
                        <option value="blok">blok</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Kam qolish chegarasi</label>
                    <input 
                      type="number" 
                      value={newProduct.lowStockThreshold}
                      onChange={e => setNewProduct({...newProduct, lowStockThreshold: Number(e.target.value)})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:ring-4 focus:ring-blue-500/10"
                    />
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button 
                    type="submit"
                    className="flex-1 py-5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    <Save size={18} />
                    Saqlash
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-8 py-5 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-slate-600 transition-colors"
                  >
                    Bekor qilish
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
