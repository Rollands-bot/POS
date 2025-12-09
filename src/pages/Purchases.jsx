import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Plus, Search, Trash2, Save, ShoppingCart, Truck, Loader2, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Purchases() {
  const { session } = useAuth()
  const [step, setStep] = useState(1) // 1: Header (Supplier), 2: Items
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Form Header
  const [header, setHeader] = useState({
    supplier_id: '',
    no_po: '',
    supplier_name: ''
  })

  // Cart
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    const [supRes, prodRes] = await Promise.all([
      supabase.from('suppliers').select('*'),
      supabase.from('products').select('*')
    ])
    if (supRes.data) setSuppliers(supRes.data)
    if (prodRes.data) setProducts(prodRes.data)
    setLoading(false)
  }

  const handleHeaderSubmit = (e) => {
    e.preventDefault()
    if (!header.supplier_id || !header.no_po) return alert('Supplier dan No. PO wajib diisi')
    const selectedSupplier = suppliers.find(s => s.id === header.supplier_id)
    setHeader(prev => ({ ...prev, supplier_name: selectedSupplier?.nama }))
    setStep(2)
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) return prev // Already in cart, edit there
      return [...prev, { 
        product_id: product.id, 
        nama_barang: product.nama_barang, 
        sku: product.sku,
        qty: 1, 
        cost_price: product.harga_beli || 0 
      }]
    })
    setSearchTerm('')
  }

  const updateItem = (id, field, value) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === id) {
        return { ...item, [field]: value }
      }
      return item
    }))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.product_id !== id))
  }

  const calculateTotal = () => {
    return cart.reduce((acc, item) => acc + (item.qty * item.cost_price), 0)
  }

  const handleSubmitPurchase = async () => {
    if (cart.length === 0) return
    setProcessing(true)

    const { error } = await supabase.rpc('process_restock_atomic', {
      p_supplier_id: header.supplier_id,
      p_no_po: header.no_po,
      p_items: cart.map(item => ({
        product_id: item.product_id,
        qty: parseInt(item.qty),
        cost_price: parseInt(item.cost_price)
      })),
      p_user_id: session?.user?.id
    })

    if (error) {
      alert('Gagal memproses pembelian: ' + error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        // Reset ALL
        setSuccess(false)
        setCart([])
        setStep(1)
        setHeader({ supplier_id: '', no_po: '', supplier_name: '' })
        fetchInitialData() // Refresh stock data
      }, 2000)
    }
    setProcessing(false)
  }

  const filteredProducts = products.filter(p => 
    p.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center">Loading Data...</div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pembelian Barang (Restock)</h1>
        {step === 2 && (
            <div className="text-sm bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                Supplier: <b>{header.supplier_name}</b> | PO: <b>{header.no_po}</b>
            </div>
        )}
      </div>

      {step === 1 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-xl mx-auto">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Truck className="text-yellow-500"/> Informasi Supplier & PO
          </h2>
          <form onSubmit={handleHeaderSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Supplier</label>
              <select required className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none"
                value={header.supplier_id} onChange={e => setHeader({...header, supplier_id: e.target.value})}>
                <option value="">-- Pilih Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor PO (Purchase Order)</label>
              <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none"
                placeholder="Contoh: PO-2023-10-001"
                value={header.no_po} onChange={e => setHeader({...header, no_po: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg mt-4">
              Lanjut Pilih Barang
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
           {/* Left: Product Selection */}
           <div className="flex-1 flex flex-col gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                    type="text" 
                    placeholder="Cari Barang untuk ditambahkan..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {searchTerm && (
                    <div className="absolute z-10 bg-white shadow-xl border border-gray-100 mt-2 rounded-xl w-full max-w-lg max-h-60 overflow-y-auto">
                        {filteredProducts.map(p => (
                            <button key={p.id} onClick={() => addToCart(p)} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                <div className="font-bold text-gray-800">{p.nama_barang}</div>
                                <div className="text-xs text-gray-500">SKU: {p.sku} | Stok Saat Ini: {p.stok}</div>
                            </button>
                        ))}
                    </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4">Barang</th>
                            <th className="p-4 w-32">Qty Masuk</th>
                            <th className="p-4 w-40">Harga Beli (@)</th>
                            <th className="p-4 w-40 text-right">Subtotal</th>
                            <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {cart.length === 0 ? (
                            <tr><td colSpan="5" className="p-8 text-center text-gray-400">Belum ada barang dipilih</td></tr>
                        ) : cart.map(item => (
                            <tr key={item.product_id}>
                                <td className="p-4">
                                    <div className="font-bold text-gray-800">{item.nama_barang}</div>
                                    <div className="text-xs text-gray-500">{item.sku}</div>
                                </td>
                                <td className="p-4">
                                    <input type="number" min="1" className="w-full p-2 border rounded-lg text-center"
                                        value={item.qty} onChange={e => updateItem(item.product_id, 'qty', parseInt(e.target.value))} />
                                </td>
                                <td className="p-4">
                                    <input type="number" min="0" className="w-full p-2 border rounded-lg"
                                        value={item.cost_price} onChange={e => updateItem(item.product_id, 'cost_price', parseInt(e.target.value))} />
                                </td>
                                <td className="p-4 text-right font-medium">
                                    Rp {(item.qty * item.cost_price).toLocaleString()}
                                </td>
                                <td className="p-4">
                                    <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
              </div>
           </div>

           {/* Right: Summary */}
           <div className="w-full lg:w-80 flex flex-col gap-4">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <h3 className="text-gray-500 font-medium mb-2">Total Pembelian</h3>
                   <div className="text-3xl font-bold text-gray-800 mb-6">Rp {calculateTotal().toLocaleString()}</div>
                   
                   <div className="space-y-3">
                       <button onClick={handleSubmitPurchase} disabled={cart.length === 0 || processing || success}
                        className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex justify-center items-center gap-2 transition-all ${success ? 'bg-green-500' : 'bg-gray-900 hover:bg-gray-800'}`}>
                           {processing ? <Loader2 className="animate-spin"/> : success ? <><CheckCircle/> Berhasil</> : 'Proses Restock'}
                       </button>
                       <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                           Kembali / Batal
                       </button>
                   </div>
               </div>
           </div>
        </div>
      )}
    </div>
  )
}
