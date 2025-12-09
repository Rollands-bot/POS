import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    totalCost: 0
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    
    // Simple Client-side aggregation for MVP
    // Ideally this should be a Supabase View or RPC for performance on large data
    const { data: transactions } = await supabase.from('transactions').select('total_amount')
    const { data: purchases } = await supabase.from('purchases').select('total_cost')

    const revenue = transactions?.reduce((acc, curr) => acc + (curr.total_amount || 0), 0) || 0
    const count = transactions?.length || 0
    const cost = purchases?.reduce((acc, curr) => acc + (curr.total_cost || 0), 0) || 0

    setSummary({
        totalRevenue: revenue,
        totalTransactions: count,
        totalCost: cost
    })
    setLoading(false)
  }

  const StatBox = ({ title, value, icon: Icon, color }) => (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className={`p-4 rounded-xl ${color} text-white`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
      </div>
  )

  return (
    <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Laporan Toko</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatBox 
                title="Total Pendapatan" 
                value={`Rp ${summary.totalRevenue.toLocaleString()}`} 
                icon={DollarSign} 
                color="bg-green-500"
            />
             <StatBox 
                title="Total Transaksi" 
                value={summary.totalTransactions} 
                icon={BarChart3} 
                color="bg-blue-500"
            />
             <StatBox 
                title="Total Pengeluaran (Beli)" 
                value={`Rp ${summary.totalCost.toLocaleString()}`} 
                icon={TrendingDown} 
                color="bg-red-500"
            />
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
            <TrendingUp size={48} className="mx-auto text-gray-200 mb-4"/>
            <h3 className="text-lg font-bold text-gray-800">Analitik Lanjutan</h3>
            <p className="text-gray-500 max-w-md mx-auto mt-2">
                Fitur grafik detail, laporan per kategori, dan analisis laba rugi akan tersedia pada update berikutnya.
                Saat ini data transaksi tersimpan aman di database untuk diolah.
            </p>
        </div>
    </div>
  )
}
