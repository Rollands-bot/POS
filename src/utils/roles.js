export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin', description: 'Akses penuh ke semua menu' },
  { value: 'kasir', label: 'Kasir', description: 'Point of Sale & data pelanggan' },
  { value: 'gudang', label: 'Gudang', description: 'Produk, pembelian & supplier' },
]

export const ROLE_LABELS = Object.fromEntries(ROLE_OPTIONS.map(r => [r.value, r.label]))

// Halaman mana yang boleh dibuka oleh role apa
export const ROUTE_ROLES = {
  '/dashboard': ['admin'],
  '/pos': ['admin', 'kasir'],
  '/customers': ['admin', 'kasir'],
  '/products': ['admin', 'gudang'],
  '/purchases': ['admin', 'gudang'],
  '/suppliers': ['admin', 'gudang'],
  '/reports': ['admin'],
  '/settings': ['admin'],
  '/users': ['admin'],
}

export const isValidRole = (role) => Boolean(ROLE_LABELS[role])

export const canAccess = (role, path) => Boolean(ROUTE_ROLES[path]?.includes(role))

// Halaman pertama yang dibuka setelah login, sesuai role
export const getHomePath = (role) =>
  ['/dashboard', '/pos', '/products'].find(path => canAccess(role, path)) ?? null
