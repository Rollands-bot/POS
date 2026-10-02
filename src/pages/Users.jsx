import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../hooks/useAuth'
import { ROLE_OPTIONS, ROLE_LABELS } from '../utils/roles'
import { Plus, Search, Edit2, KeyRound, X, Save, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

const ROLE_BADGE = {
  admin: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  kasir: 'bg-blue-50 text-blue-600 border-blue-100',
  gudang: 'bg-green-50 text-green-600 border-green-100',
}

const MIN_PASSWORD = 6

const inputClass = 'w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none'

// Pesan error yang lebih jelas kalau fungsi SQL belum dipasang di Supabase
const friendlyError = (error) => {
  if (!error) return null
  if (error.code === 'PGRST202' || /could not find the function/i.test(error.message)) {
    return 'Fungsi kelola user belum terpasang. Jalankan file supabase_user_management.sql di Supabase SQL Editor.'
  }
  return error.message
}

const PasswordInput = ({ value, onChange, placeholder }) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input
        required
        minLength={MIN_PASSWORD}
        type={visible ? 'text' : 'password'}
        className={clsx(inputClass, 'pr-10')}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="new-password"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

const RoleSelect = ({ value, onChange }) => (
  <div className="space-y-2">
    {ROLE_OPTIONS.map(opt => (
      <label
        key={opt.value}
        className={clsx(
          'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
          value === opt.value ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'
        )}
      >
        <input
          type="radio"
          name="role"
          value={opt.value}
          checked={value === opt.value}
          onChange={() => onChange(opt.value)}
          className="mt-1 accent-yellow-500"
        />
        <div>
          <div className="font-medium text-gray-800 text-sm">{opt.label}</div>
          <div className="text-xs text-gray-500">{opt.description}</div>
        </div>
      </label>
    ))}
  </div>
)

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      <div className="overflow-y-auto">{children}</div>
    </div>
  </div>
)

const ModalActions = ({ onCancel, saving, label = 'Simpan' }) => (
  <div className="pt-4 flex justify-end gap-3">
    <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl">Batal</button>
    <button
      type="submit"
      disabled={saving}
      className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-white font-bold rounded-xl shadow-lg shadow-yellow-400/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} {label}
    </button>
  </div>
)

const ErrorBox = ({ message }) =>
  message ? <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100">{message}</div> : null

export default function Users() {
  const { session, refreshProfile } = useAuth()
  const currentUserId = session?.user?.id

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [notice, setNotice] = useState(null)

  // modal: null | { type: 'create' } | { type: 'edit', user } | { type: 'password', user }
  const [modal, setModal] = useState(null)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const loadUsers = useCallback(() =>
    supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        setLoadError(friendlyError(error))
        setUsers(data ?? [])
        setLoading(false)
      }), [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const openModal = (type, user = null) => {
    setFormError(null)
    setNotice(null)
    if (type === 'create') {
      setFormData({ email: '', full_name: '', password: '', role: 'kasir' })
    } else if (type === 'edit') {
      setFormData({ full_name: user.full_name || '', role: user.role || 'kasir' })
    } else {
      setFormData({ password: '', confirm: '' })
    }
    setModal({ type, user })
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (modal.type === 'password' && formData.password !== formData.confirm) {
      setFormError('Konfirmasi password tidak sama')
      return
    }

    setSaving(true)
    let result
    if (modal.type === 'create') {
      result = await supabase.rpc('admin_create_user', {
        p_email: formData.email,
        p_password: formData.password,
        p_full_name: formData.full_name,
        p_role: formData.role,
      })
    } else if (modal.type === 'edit') {
      result = await supabase.rpc('admin_update_user', {
        p_user_id: modal.user.id,
        p_full_name: formData.full_name,
        p_role: formData.role,
      })
    } else {
      result = await supabase.rpc('admin_reset_password', {
        p_user_id: modal.user.id,
        p_password: formData.password,
      })
    }
    setSaving(false)

    if (result.error) {
      setFormError(friendlyError(result.error))
      return
    }

    if (modal.type === 'create') {
      setNotice(`User ${formData.email.trim().toLowerCase()} berhasil dibuat. Sekarang sudah bisa login.`)
    } else if (modal.type === 'edit') {
      setNotice(`Data ${modal.user.email} berhasil diperbarui.`)
    } else {
      setNotice(`Password ${modal.user.email} berhasil diganti.`)
    }
    setModal(null)

    // Kalau admin mengubah dirinya sendiri, muat ulang role-nya
    if (modal.type === 'edit' && modal.user.id === currentUserId) refreshProfile()
    loadUsers()
  }

  const term = searchTerm.toLowerCase()
  const filtered = users.filter(u =>
    (u.email || '').toLowerCase().includes(term) ||
    (u.full_name || '').toLowerCase().includes(term) ||
    (ROLE_LABELS[u.role] || '').toLowerCase().includes(term)
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola User</h1>
          <p className="text-sm text-gray-500">Tambah akun karyawan, atur role, dan reset password.</p>
        </div>
        <button
          onClick={() => openModal('create')}
          className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-xl flex items-center justify-center gap-2 font-medium shadow-md transition-all"
        >
          <Plus size={18} /> Tambah User
        </button>
      </div>

      {notice && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-4 text-sm border border-green-100 flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-green-500 hover:text-green-700"><X size={16} /></button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari email, nama, atau role..."
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
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Dibuat</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : loadError ? (
                <tr><td colSpan="4" className="p-8 text-center text-red-500">{loadError}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Data tidak ditemukan</td></tr>
              ) : (
                filtered.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {(u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-gray-800 truncate">
                            {u.full_name || '-'}
                            {u.id === currentUserId && <span className="ml-2 text-xs font-medium text-gray-400">(Anda)</span>}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={clsx('px-2.5 py-1 rounded-lg text-xs font-bold border', ROLE_BADGE[u.role] || 'bg-gray-100 text-gray-500 border-gray-200')}>
                        {ROLE_LABELS[u.role] || 'Tanpa role'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openModal('edit', u)} title="Edit nama & role" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => openModal('password', u)} title="Reset password" className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg">
                          <KeyRound size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === 'create' && (
        <Modal title="Tambah User" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <ErrorBox message={formError} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" className={inputClass} placeholder="karyawan@gmail.com" autoComplete="off"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" className={inputClass} placeholder="Opsional"
                value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <PasswordInput placeholder={`Minimal ${MIN_PASSWORD} karakter`}
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <RoleSelect value={formData.role} onChange={role => setFormData({ ...formData, role })} />
            </div>
            <ModalActions onCancel={closeModal} saving={saving} label="Buat User" />
          </form>
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit User" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <ErrorBox message={formError} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" disabled className={clsx(inputClass, 'bg-gray-50 text-gray-500')} value={modal.user.email || ''} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input type="text" className={inputClass}
                value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <RoleSelect value={formData.role} onChange={role => setFormData({ ...formData, role })} />
            </div>
            {modal.user.id === currentUserId && formData.role !== 'admin' && (
              <p className="text-xs text-yellow-700 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                Anda sedang mengubah role akun Anda sendiri. Setelah disimpan, Anda tidak bisa membuka halaman ini lagi.
              </p>
            )}
            <ModalActions onCancel={closeModal} saving={saving} />
          </form>
        </Modal>
      )}

      {modal?.type === 'password' && (
        <Modal title="Reset Password" onClose={closeModal}>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <ErrorBox message={formError} />
            <p className="text-sm text-gray-500">
              Atur password baru untuk <span className="font-medium text-gray-800">{modal.user.email}</span>.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
              <PasswordInput placeholder={`Minimal ${MIN_PASSWORD} karakter`}
                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ulangi Password</label>
              <PasswordInput
                value={formData.confirm} onChange={e => setFormData({ ...formData, confirm: e.target.value })} />
            </div>
            <ModalActions onCancel={closeModal} saving={saving} label="Ganti Password" />
          </form>
        </Modal>
      )}
    </div>
  )
}
