import { useState, useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Loader2, CheckCircle, User, Keyboard, AlertTriangle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function POS() {
  const { session } = useAuth()
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Amounts
  const [cashGiven, setCashGiven] = useState('')
  
  const searchInputRef = useRef(null)

  const fetchData = async () => {
    const [prodRes, custRes] = await Promise.all([
        supabase.from('products').select('*').gt('stok', 0),
        supabase.from('customers').select('*').order('nama')
    ])
    
    if (prodRes.data) setProducts(prodRes.data)
    if (custRes.data) setCustomers(custRes.data)
    setLoading(false)
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        if (existing.qty >= product.stok) return prev // Prevent overselling
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item)
      }
      return [...prev, { ...product, qty: 1 }]
    })
    setSearchTerm('') // Clear search after adding
    if(searchInputRef.current) searchInputRef.current.focus()
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta
        if (newQty < 1) return item
        // Find original product to check stock limit
        const original = products.find(p => p.id === id)
        if (original && newQty > original.stok) return item
        return { ...item, qty: newQty }
      }
      return item
    }))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (item.harga_jual * item.qty), 0)
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    if (processing || success) return

    setProcessing(true)
    const totalAmount = calculateTotal()
    
    // Prepare payload for atomic transaction
    const itemsPayload = cart.map(item => ({
      sku: item.sku,
      qty: item.qty,
      price: item.harga_jual,
      name: item.nama_barang
    }))

    const { error } = await supabase.rpc('create_transaction_atomic', {
      p_items: itemsPayload,
      p_customer_id: selectedCustomer || null,
      p_subtotal: totalAmount,
      p_tax: 0,
      p_discount: 0,
      p_total_amount: totalAmount,
      p_payment_method: paymentMethod,
      p_cash_given: cashGiven ? parseFloat(cashGiven) : totalAmount,
      p_change_amount: cashGiven ? parseFloat(cashGiven) - totalAmount : 0,
      p_user_id: session?.user?.id
    })

    if (error) {
      setErrorMsg(error.message)
      setTimeout(() => setErrorMsg(null), 3000)
    } else {
      setSuccess(true)
      setCart([])
      setCashGiven('')
      setSelectedCustomer(null)
      fetchData() // Refresh stock
      setTimeout(() => setSuccess(false), 2000)
    }
    setProcessing(false)
  }

  useEffect(() => {
    fetchData()
    // Focus search on mount
    if(searchInputRef.current) searchInputRef.current.focus()

    // Keyboard Shortcuts
    const handleKeyDown = (e) => {
        if (e.key === 'F2') {
            e.preventDefault()
            searchInputRef.current?.focus()
        }
        if (e.key === 'F4') {
            e.preventDefault()
            handleCheckout()
        }
        if (e.key === 'Escape') {
            e.preventDefault()
            setCart([])
            setCashGiven('')
            setSelectedCustomer(null)
        }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const filteredProducts = products.filter(p => 
    p.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchTerm))
  )

  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-9rem)]">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="F2: Cari Barang / SKU / Scan Barcode..." 
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-lg transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length === 1) {
                  addToCart(filteredProducts[0])
                }
              }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={18} />
            {errorMsg}
          </div>
        )}

        <div className="h-[500px] md:h-auto flex-1 overflow-y-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-4 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stok === 0}
                className="text-left p-4 rounded-xl border border-gray-100 hover:border-yellow-400 hover:shadow-md transition-all group bg-gray-50 hover:bg-white flex flex-col h-full justify-between"
              >
                <div>
                    <h3 className="font-bold text-gray-800 line-clamp-2 group-hover:text-yellow-600 leading-snug text-sm">{product.nama_barang}</h3>
                    <p className="text-xs text-gray-400 mt-1 mb-2 font-mono">{product.sku}</p>
                </div>
                <div className="flex justify-between items-end w-full mt-2">
                  <span className="font-bold text-gray-900 text-sm">Rp {product.harga_jual.toLocaleString()}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${product.stok < 5 ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'}`}>
                    {product.stok}
                  </span>
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center text-gray-400 py-10 flex flex-col items-center">
                <Search size={48} className="text-gray-200 mb-2"/>
                <p>Produk tidak ditemukan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="w-full md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col h-auto md:h-full overflow-hidden shrink-0">
        {/* Customer Select */}
        <div className="p-3 bg-yellow-50 border-b border-yellow-100">
             <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-yellow-200">
                <User size={18} className="text-yellow-500"/>
                <select 
                    className="flex-1 bg-transparent outline-none text-sm font-medium text-gray-700"
                    value={selectedCustomer || ''}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                    <option value="">-- Pilih Pelanggan (Opsional) --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.nama} - {c.plat_nomor || '-'}</option>)}
                </select>
             </div>
        </div>

        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
             <div className="p-2 bg-yellow-400 rounded-lg text-white"><Banknote size={20}/></div>
             Keranjang Belanja
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
               <div className="p-4 bg-gray-100 rounded-full mb-2"><Keyboard size={24}/></div>
               <p>Keranjang kosong</p>
               <div className="flex gap-2 text-xs bg-gray-100 px-3 py-1 rounded-full">
                  <span className="font-bold border border-gray-300 px-1 rounded bg-white">F2</span> Cari
                  <span className="font-bold border border-gray-300 px-1 rounded bg-white">F4</span> Bayar
               </div>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 line-clamp-1">{item.nama_barang}</h4>
                  <p className="text-xs text-gray-500">@ Rp {item.harga_jual.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                    <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Minus size={14} /></button>
                    <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-4">
          <div className="flex justify-between items-center text-lg font-bold text-gray-800">
            <span>Total</span>
            <span>Rp {calculateTotal().toLocaleString()}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setPaymentMethod('cash')}
              className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === 'cash' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              <Banknote size={16} /> Tunai
            </button>
            <button 
              onClick={() => setPaymentMethod('qris')}
              className={`py-2 px-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all ${paymentMethod === 'qris' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-white border-gray-200 text-gray-600'}`}
            >
              <CreditCard size={16} /> QRIS
            </button>
          </div>

          {paymentMethod === 'cash' && (
              <input 
                type="number" 
                placeholder="Uang Diterima (Rp)" 
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                value={cashGiven}
                onChange={e => setCashGiven(e.target.value)}
              />
          )}

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing || success}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all transform active:scale-95 ${success ? 'bg-green-500 shadow-green-500/30' : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/20'}`}
          >
            {processing ? (
              <Loader2 className="animate-spin" /> 
            ) : success ? (
              <> <CheckCircle /> Transaksi Berhasil! </>
            ) : (
              'Bayar Sekarang (F4)'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
