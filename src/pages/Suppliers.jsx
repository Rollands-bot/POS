import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Plus, Search, Trash2, Edit2, X, Save, Phone, MapPin, User } from 'lucide-react'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    telepon: '',
    kontak_person: ''
  })

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    setLoading(true)
    const { data } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false })
    if (data) setSuppliers(data)
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (editingId) {
       await supabase.from('suppliers').update(formData).eq('id', editingId)
    } else {
       await supabase.from('suppliers').insert([formData])
    }
    closeModal()
    fetchSuppliers()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus supplier ini?')) {
      await supabase.from('suppliers').delete().eq('id', id)
      fetchSuppliers()
    }
  }

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditingId(supplier.id)
      setFormData({
        nama: supplier.nama,
        alamat: supplier.alamat || '',
        telepon: supplier.telepon || '',
        kontak_person: supplier.kontak_person || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        nama: '',
        alamat: '',
        telepon: '',
        kontak_person: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const filtered = suppliers.filter(s => 
    s.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.kontak_person && s.kontak_person.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Supplier</h1>
        <button 
          onClick={() => openModal()}
          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all"
        >
          <Plus size={18} /> Tambah Supplier
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder="Cari nama supplier atau kontak person..." 
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
                <th className="p-4">Nama Supplier</th>
                <th className="p-4">Kontak Person</th>
                <th className="p-4">Telepon</th>
                <th className="p-4">Alamat</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                 <tr><td colSpan="5" className="p-8 text-center text-gray-500">Data tidak ditemukan</td></tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{s.nama}</td>
                    <td className="p-4 text-gray-600 flex items-center gap-2">
                      <User size={14} className="text-gray-400"/> {s.kontak_person || '-'}
                    </td>
                    <td className="p-4 text-gray-600 font-mono text-sm">
                       <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400"/> {s.telepon || '-'}
                       </div>
                    </td>
                    <td className="p-4 text-gray-600 text-sm truncate max-w-xs">
                       <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400"/> {s.alamat || '-'}
                       </div>
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => openModal(s)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">{editingId ? 'Edit Supplier' : 'Tambah Supplier'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Supplier</label>
                <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                  value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kontak Person (PIC)</label>
                <input type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                  value={formData.kontak_person} onChange={e => setFormData({...formData, kontak_person: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telepon / WhatsApp</label>
                <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                  value={formData.telepon} onChange={e => setFormData({...formData, telepon: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                <textarea className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" rows="3"
                  value={formData.alamat} onChange={e => setFormData({...formData, alamat: e.target.value})} />
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
