import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import {
  Users,
  Plus,
  ShieldCheck,
  Briefcase,
  CreditCard,
  ChefHat,
  Package,
  Edit2,
  CheckCircle2,
  XCircle,
  Key,
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('cashier');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddUser = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('cashier');
    setPhone('');
    setActive(true);
    setShowModal(true);
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role);
    setPhone(u.phone || '');
    setActive(u.active === 1);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name,
          role,
          phone,
          active: active ? 1 : 0,
          password: password || undefined,
        });
      } else {
        if (!password) {
          alert('Password required for new user');
          return;
        }
        await api.createUser({
          name,
          email,
          password,
          role,
          phone,
        });
      }
      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      alert(`User operation error: ${err.message}`);
    }
  };

  const roleBadges: Record<UserRole, { label: string; bg: string; text: string }> = {
    admin: { label: 'Admin / Owner', bg: 'bg-purple-100 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300' },
    manager: { label: 'Floor Manager', bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300' },
    cashier: { label: 'POS Cashier', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300' },
    kitchen: { label: 'Kitchen / Chef', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300' },
    inventory: { label: 'Inventory Lead', bg: 'bg-cyan-100 dark:bg-cyan-950', text: 'text-cyan-700 dark:text-cyan-300' },
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Staff & Role-Based Access Control
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400">
              RBAC Protected
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage staff credentials, role-based module authorization, and account access permissions.
          </p>
        </div>

        <button
          onClick={openAddUser}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">System Role</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => {
                const rb = roleBadges[u.role] || roleBadges.cashier;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {u.name}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${rb.bg} ${rb.text}`}>
                        {rb.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {u.phone || '-'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.active === 1
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {u.active === 1 ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditUser(u)}
                        className="px-2.5 py-1 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveUser}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingUser ? 'Edit Staff Member' : 'Add New Staff Member'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Chen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  disabled={!!editingUser}
                  placeholder="staff@savoria.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editingUser ? 'Reset Password (optional)' : 'Password *'}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? 'Leave blank to keep existing' : 'Minimum 6 characters'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="admin">Admin / Owner</option>
                    <option value="manager">Floor Manager</option>
                    <option value="cashier">POS Cashier</option>
                    <option value="kitchen">Kitchen / Chef</option>
                    <option value="inventory">Inventory Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555)..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Account is active and permitted to sign in
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                {editingUser ? 'Save Updates' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
