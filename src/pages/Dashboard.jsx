import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabase'
import { DollarSign, ShoppingBag, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl ${color} text-white shadow-lg shadow-gray-200`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</p>
      <h3 className="text-2xl font-extrabold text-gray-800 mt-1">{value}</h3>
    </div>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTx: 0,
    lowStock: 0,
    totalProducts: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // 1. Get today's transactions
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .select('total_amount')
      .gte('created_at', todayISO)

    // 2. Get product stats
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .select('stok')

    if (!txError && !prodError) {
      const todaySales = txData.reduce((acc, curr) => acc + (curr.total_amount || 0), 0)
      const lowStock = prodData.filter(p => p.stok < 5).length
      
      setStats({
        todaySales,
        todayTx: txData.length,
        lowStock,
        totalProducts: prodData.length
      })
    }
    setLoading(false)
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-yellow-500" /></div>

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
           <p className="text-gray-500">Welcome back, here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Penjualan Hari Ini" 
          value={`Rp ${stats.todaySales.toLocaleString()}`} 
          icon={DollarSign} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Transaksi Hari Ini" 
          value={stats.todayTx} 
          icon={ShoppingBag} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Total Produk" 
          value={stats.totalProducts} 
          icon={TrendingUp} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Stok Menipis (<5)" 
          value={stats.lowStock} 
          icon={AlertTriangle} 
          color="bg-red-500" 
        />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
         <h2 className="text-lg font-bold mb-4">Aktivitas Terkini</h2>
         <p className="text-gray-400 text-sm">Belum ada aktivitas yang direkam secara detail di dashboard ini untuk versi MVP.</p>
      </div>
    </div>
  )
}
