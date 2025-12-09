import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Plus, Search, Trash2, Edit2, X, Save, Bike, MessageSquare, History } from 'lucide-react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  const [formData, setFormData] = useState({
    nama: '',
    no_hp: '',
    plat_nomor: '',
    alamat: ''
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    const { data } = await supabase.from('customers').select('*').order('total_spend', { ascending: false })
    if (data) setCustomers(data)
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (editingId) {
       await supabase.from('customers').update(formData).eq('id', editingId)
    } else {
       await supabase.from('customers').insert([formData])
    }
    closeModal()
    fetchCustomers()
  }

  const handleDelete = async (id) => {
    if (window.confirm('Yakin hapus pelanggan ini?')) {
      await supabase.from('customers').delete().eq('id', id)
      fetchCustomers()
    }
  }

  const openModal = (cust = null) => {
    if (cust) {
      setEditingId(cust.id)
      setFormData({
        nama: cust.nama,
        no_hp: cust.no_hp || '',
        plat_nomor: cust.plat_nomor || '',
        alamat: cust.alamat || ''
      })
    } else {
      setEditingId(null)
      setFormData({
        nama: '',
        no_hp: '',
        plat_nomor: '',
        alamat: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingId(null)
  }

  const filtered = customers.filter(c => 
    c.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.plat_nomor && c.plat_nomor.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (c.no_hp && c.no_hp.includes(searchTerm))
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Pelanggan (CRM)</h1>
        <button 
          onClick={() => openModal()}
          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium shadow-md transition-all"
        >
          <Plus size={18} /> Tambah Pelanggan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
             <input 
               type="text" 
               placeholder="Cari nama, plat nomor, atau no HP..." 
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
                <th className="p-4">Nama Pelanggan</th>
                <th className="p-4">Plat Nomor</th>
                <th className="p-4">No. HP</th>
                <th className="p-4 text-right">Total Belanja</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                 <tr><td colSpan="5" className="p-8 text-center text-gray-500">Data tidak ditemukan</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                        <div className="font-bold text-gray-800">{c.nama}</div>
                        <div className="text-xs text-gray-400">{c.alamat}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                        <span className="flex items-center gap-2 bg-gray-100 px-2 py-1 rounded-lg w-fit text-sm font-mono border border-gray-200">
                            <Bike size={14}/> {c.plat_nomor || '-'}
                        </span>
                    </td>
                    <td className="p-4 text-gray-600 font-mono text-sm">
                        <a href={`https://wa.me/${c.no_hp}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-green-600 transition-colors">
                            {c.no_hp || '-'} <MessageSquare size={12} />
                        </a>
                    </td>
                    <td className="p-4 text-right font-medium text-green-600">
                        Rp {c.total_spend?.toLocaleString() || 0}
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button onClick={() => openModal(c)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
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
              <h3 className="font-bold text-gray-800">{editingId ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input required type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                  value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plat Nomor</label>
                  <input type="text" placeholder="B 1234 XYZ" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none uppercase font-mono" 
                    value={formData.plat_nomor} onChange={e => setFormData({...formData, plat_nomor: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. HP (WA)</label>
                  <input type="text" placeholder="62812..." className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                    value={formData.no_hp} onChange={e => setFormData({...formData, no_hp: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Domisili</label>
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
