import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Plus, Search, Trash2, Edit2, X, Save } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  
  const [formData, setFormData] = useState({
    nama_barang: '',
    sku: '',
    stok: 0,
    harga_jual: 0,
    kategori: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setProducts(data)
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (editingProduct) {
       await supabase.from('products').update(formData).eq('id', editingProduct.id)
    } else {
       await supabase.from('products').insert([formData])
    }
    closeModal()
    fetchProducts()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus produk ini?')) {
      await supabase.from('products').delete().eq('id', id)
      fetchProducts()
    }
  }

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        nama_barang: product.nama_barang,
        sku: product.sku,
        stok: product.stok,
        harga_jual: product.harga_jual,
        kategori: product.kategori
      })
    } else {
      setEditingProduct(null)
      setFormData({
        nama_barang: '',
        sku: '',
        stok: 0,
        harga_jual: 0,
        kategori: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
  }

  const filteredProducts = products.filter(p => 
    p.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Produk</h1>
        <button 
          onClick={() => openModal()}
          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all"
        >
          <Plus size={18} /> Tambah Produk
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder="Cari nama barang atau SKU..." 
               className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm font-medium">
              <tr>
                <th className="p-4">Nama Barang</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Stok</th>
                <th className="p-4 text-right">Harga</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : filteredProducts.length === 0 ? (
                 <tr><td colSpan="6" className="p-8 text-center text-gray-500">Produk tidak ditemukan</td></tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-800">{p.nama_barang}</td>
                    <td className="p-4 text-gray-500 font-mono text-sm">{p.sku}</td>
                    <td className="p-4 text-gray-500">{p.kategori}</td>
                    <td className={`p-4 text-right font-medium ${p.stok < 5 ? 'text-red-500' : 'text-gray-700'}`}>
                      {p.stok}
                    </td>
                    <td className="p-4 text-right text-gray-700">Rp {p.harga_jual.toLocaleString()}</td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => openModal(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                  value={formData.nama_barang} onChange={e => setFormData({...formData, nama_barang: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                    value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                  <input type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                    value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual</label>
                  <input required type="number" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                    value={formData.harga_jual} onChange={e => setFormData({...formData, harga_jual: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                  <input required type="number" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                    value={formData.stok} onChange={e => setFormData({...formData, stok: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Batal</button>
                <button type="submit" className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-400/20 flex items-center gap-2">
                  <Save size={18} /> Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
