import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  LogOut, 
  Truck, 
  Users, 
  ArrowDownCircle,
  BarChart3,
  Settings,
  Menu,
  X,
  Calendar
} from 'lucide-react'
import clsx from 'clsx'

const NavItem = ({ to, icon: Icon, label, onClick }) => {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium duration-200 group",
        isActive 
          ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/20" 
          : "text-gray-500 hover:bg-yellow-50 hover:text-yellow-600"
      )}
    >
      <Icon size={20} className={clsx(isActive ? "text-white" : "text-gray-400 group-hover:text-yellow-600")} />
      <span>{label}</span>
    </Link>
  )
}

export default function Layout({ children }) {
  const { signOut, session } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    const updateDate = () => {
      const now = new Date()
      const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
      // Format: Tuesday, 09 December 2025
      setCurrentDate(now.toLocaleDateString('en-GB', options))
    }
    updateDate()
    // Optional: Update every minute if the app stays open long enough for the day to change, but mostly static is fine.
    const interval = setInterval(updateDate, 60000)
    return () => clearInterval(interval)
  }, [])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const closeSidebar = () => setIsSidebarOpen(false)

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={clsx(
          "fixed md:static inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center p-2">
                 <img 
                    src="/scooterlink.png" 
                    alt="ScooterLink Logo" 
                    className="w-full h-full object-contain"
                  />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-800 hidden md:block">ScooterLink</span>
          </div>
          <button 
            onClick={closeSidebar}
            className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 mb-4 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4 mt-2">Main Menu</div>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" onClick={closeSidebar} />
          <NavItem to="/pos" icon={ShoppingCart} label="Point of Sale" onClick={closeSidebar} />

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4 mt-8">Inventory</div>
          <NavItem to="/products" icon={Package} label="Products" onClick={closeSidebar} />
          <NavItem to="/purchases" icon={ArrowDownCircle} label="Purchases" onClick={closeSidebar} />
          <NavItem to="/suppliers" icon={Truck} label="Suppliers" onClick={closeSidebar} />

          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-4 mt-8">Management</div>
          <NavItem to="/customers" icon={Users} label="Customers" onClick={closeSidebar} />
          <NavItem to="/reports" icon={BarChart3} label="Reports" onClick={closeSidebar} />
          <NavItem to="/settings" icon={Settings} label="Settings" onClick={closeSidebar} />
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-gray-50 rounded-xl border border-gray-100">
             <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-yellow-400/20">
                {session?.user?.email?.[0].toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-gray-800 truncate">Store Admin</p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
             </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-sm font-medium group"
          >
            <LogOut size={18} className="group-hover:stroke-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <button 
                    onClick={toggleSidebar}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden transition-colors"
                >
                    <Menu size={24} />
                </button>
                <h2 className="text-xl font-bold text-gray-800 hidden md:block">Overview</h2>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 text-gray-600 text-sm font-medium">
                    <Calendar size={16} className="text-yellow-500" />
                    {currentDate}
                </div>
            </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  )
}
