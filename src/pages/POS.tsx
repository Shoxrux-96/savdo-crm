import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  query,
  where,
  increment
} from 'firebase/firestore';
import { Product, SaleItem, Sale, Store } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Minus, 
  Plus, 
  CreditCard, 
  Banknote, 
  UserPlus,
  Printer,
  Scan,
  X
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function POS({ store }: { store: Store | null }) {
  const storeId = store?.id || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [basket, setBasket] = useState<SaleItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [scannerType, setScannerType] = useState<'usb' | 'bluetooth' | 'wifi'>('usb');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [storeId]);

  async function fetchProducts() {
    if (!storeId) return;
    try {
      const q = collection(db, `stores/${storeId}/products`);
      const querySnapshot = await getDocs(q).catch(e => handleFirestoreError(e, OperationType.LIST, `stores/${storeId}/products`));
      if (!querySnapshot) return;
      const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }

  const addToBasket = (product: Product) => {
    setBasket(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: product.price 
      }];
    });
    setSearchTerm('');
  };

  const updateQuantity = (productId: string, delta: number) => {
    setBasket(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const total = basket.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (basket.length === 0) return;
    if (!storeId) {
      alert("Do'kon ma'lumotlari topilmadi.");
      return;
    }

    try {
      const salesRef = collection(db, `stores/${storeId}/sales`);
      const saleData = {
        storeId,
        items: basket,
        totalAmount: total,
        paymentMethod,
        status: 'completed',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(salesRef, saleData).catch(e => handleFirestoreError(e, OperationType.CREATE, `stores/${storeId}/sales`));
      if (!docRef) return;
      
      for (const item of basket) {
        const productRef = doc(db, `stores/${storeId}/products`, item.productId);
        await updateDoc(productRef, {
          quantity: increment(-item.quantity),
          updatedAt: serverTimestamp()
        }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `stores/${storeId}/products/${item.productId}`));
      }

      const saleWithId = { id: docRef.id, ...saleData, createdAt: new Date() } as Sale;
      setLastSale(saleWithId);
      setShowReceipt(true);
      setBasket([]);
      fetchProducts();

      // Auto-print after a short delay to allow re-render
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "pos-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scanner.render((decodedText) => {
        const product = products.find(p => p.sku === decodedText);
        if (product) {
          addToBasket(product);
        }
        scanner.clear();
        setIsScanning(false);
      }, (error) => {});
    }, 100);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => 
      p.sku === searchTerm || p.name.toLowerCase() === searchTerm.toLowerCase()
    );
    if (product) {
      addToBasket(product);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header Info */}
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sotuv Kassa</h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Mahsulot skanerlang yoki qidiring va savatchaga qo'shing</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Section: Scanner Controls */}
        <div className="xl:col-span-3 space-y-6 flex flex-col h-full overflow-y-auto pr-2">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Scan size={18} />
              </div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Skaner</h3>
            </div>

            {/* Connection Toggles */}
            <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl">
              {(['usb', 'bluetooth', 'wifi'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setScannerType(type)}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    scannerType === type 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-slate-400 hover:bg-white hover:text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {type === 'usb' && <div className="w-2 h-2 rounded-full bg-current opacity-50" />}
                    {type}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-center space-y-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Skaner avtomatik aniqlanadi</p>
              
              <div className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:border-blue-200 transition-colors relative overflow-hidden">
                {isScanning ? (
                  <div id="pos-reader" className="w-full h-full"></div>
                ) : (
                  <>
                    <div className="w-20 h-20 text-slate-200 group-hover:text-blue-100 transition-colors">
                      <Scan size={80} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-500 transition-colors">USB skaner ulang yoki kamerani yoqing</p>
                  </>
                )}
                {isScanning && (
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="absolute top-4 right-4 p-2 bg-rose-50 text-rose-500 rounded-full"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {!isScanning && (
                <button 
                  onClick={startScanner}
                  className="w-full py-4 bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                >
                  <Scan size={20} />
                  Kamera bilan skanerlash
                </button>
              )}
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Qo'lda kiritish</label>
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Shtrix-kod yoki nomi..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                />
                <button type="submit" className="w-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                  <Search size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Section: Interactive Cart */}
        <div className="xl:col-span-9 flex flex-col h-full bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingCart size={18} />
              </div>
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Savatcha</h3>
            </div>
            <div className="px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest italic tracking-tighter">
              {basket.length} ta mahsulot
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {basket.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4 py-20 italic">
                <ShoppingCart size={64} className="opacity-20" />
                <p className="text-xs uppercase tracking-widest font-black opacity-40">Mahsulot skanerlang yoki qidiring</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white/80 backdrop-blur-md">
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nomi</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Birlik narxi</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Miqdor</th>
                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Jami</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  <AnimatePresence initial={false}>
                    {basket.map((item) => (
                      <motion.tr 
                        key={item.productId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-4">
                          <div className="font-black text-slate-800 text-xs tracking-tight">{item.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">ID: {item.productId.slice(-6)}</div>
                        </td>
                        <td className="px-8 py-4 text-center font-bold text-slate-600 text-xs">
                          {item.price.toLocaleString()} so'm
                        </td>
                        <td className="px-8 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all text-slate-500"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-10 text-center font-black text-slate-900 text-xs">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all text-slate-500"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right font-black text-blue-600 text-xs">
                          {(item.price * item.quantity).toLocaleString()} so'm
                        </td>
                        <td className="px-8 py-4">
                          <button 
                            onClick={() => updateQuantity(item.productId, -item.quantity)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            )}
          </div>

          <div className="p-8 bg-slate-50/50 border-t border-slate-100 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'cash', label: 'Naqd', icon: Banknote },
                { id: 'card', label: 'Karta', icon: CreditCard },
                { id: 'credit', label: 'Qarz', icon: UserPlus },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`flex items-center justify-center gap-3 py-4 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all ${
                    paymentMethod === m.id 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-500/20' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 active:scale-95'
                  }`}
                >
                  <m.icon size={18} />
                  {m.label}
                </button>
              ))}
            </div>

            <button 
              disabled={basket.length === 0}
              onClick={handleCheckout}
              className="w-full py-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-lg uppercase tracking-tighter rounded-3xl transition-all shadow-2xl shadow-blue-500/30 flex items-center justify-center gap-4 italic active:scale-[0.98]"
            >
              Sotuvni tasdiqlash — {total.toLocaleString()} so'm
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
              <div className="text-center mb-10">
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[30px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/10">
                  <ShoppingCart size={40} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Muvaffaqiyatli!</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 opacity-60">Sotuv tizimga saqlandi</p>
              </div>

              <div className="print-area space-y-4 text-[10px] font-bold font-mono bg-slate-50 p-8 rounded-3xl mb-8 border border-slate-100 print:bg-white print:p-0 print:border-none">
                <div className="text-center border-b border-dashed border-slate-200 pb-4 mb-4">
                  <p className="font-black text-slate-800 uppercase tracking-widest text-sm">{store?.name || 'Do\'kon Cheki'}</p>
                  <p className="opacity-40 mt-1 italic uppercase">{lastSale?.createdAt ? new Date(lastSale.createdAt).toLocaleString() : new Date().toLocaleString()}</p>
                </div>
                <div className="space-y-3">
                  {lastSale?.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-4">
                      <span className="flex-1 uppercase italic tracking-tighter leading-tight">{item.name}</span>
                      <span className="font-black text-slate-800">{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t border-dashed border-slate-200 pt-6 mt-2 text-sm font-black text-slate-900">
                  <span className="uppercase tracking-tighter">JAMI:</span>
                  <span className="text-blue-600 italic">{lastSale?.totalAmount.toLocaleString()} UZS</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => window.print()}
                  className="w-full py-5 bg-blue-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
                >
                  <Printer size={18} />
                  Chekni chiqarish
                </button>
                <button 
                  onClick={() => setShowReceipt(false)}
                  className="w-full py-5 bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:text-slate-600 transition-colors"
                >
                  Yopish
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
