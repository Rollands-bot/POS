import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Save, Store } from 'lucide-react'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    store_name: 'ScooterLink POS',
    store_address: '',
    store_phone: '',
    tax_rate: 0,
    footer_message: 'Terima kasih telah berbelanja!'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    // Fetch ID 1 (Single Row Settings pattern)
    const { data } = await supabase.from('settings').select('*').limit(1).single()
    if (data) setFormData(data)
    setLoading(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    // Upsert ID 1
    const { error } = await supabase.from('settings').upsert({ ...formData, id: 1 })
    if (error) alert('Gagal menyimpan')
    else alert('Pengaturan disimpan!')
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Toko</h1>
        
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
                    <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="text" className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                        value={formData.store_name} onChange={e => setFormData({...formData, store_name: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Toko (Untuk Struk)</label>
                    <textarea rows="3" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                        value={formData.store_address} onChange={e => setFormData({...formData, store_address: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                        value={formData.store_phone} onChange={e => setFormData({...formData, store_phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pajak PPN (%)</label>
                        <input type="number" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                        value={formData.tax_rate} onChange={e => setFormData({...formData, tax_rate: e.target.value})} />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pesan Footer Struk</label>
                    <input type="text" className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none" 
                        value={formData.footer_message} onChange={e => setFormData({...formData, footer_message: e.target.value})} />
                </div>

                <button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center gap-2">
                    <Save size={18} /> Simpan Pengaturan
                </button>
            </form>
        </div>
    </div>
  )
}
