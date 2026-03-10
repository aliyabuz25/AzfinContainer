import React from 'react';
import { Lock, Plus, Trash2, UserCircle2 } from 'lucide-react';
import { AdminUserItem } from '../types';

interface AdminAccountsViewProps {
  users: AdminUserItem[];
  createUsername: string;
  createPassword: string;
  setCreateUsername: (value: string) => void;
  setCreatePassword: (value: string) => void;
  onCreate: () => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('az-AZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const AdminAccountsView: React.FC<AdminAccountsViewProps> = ({
  users,
  createUsername,
  createPassword,
  setCreateUsername,
  setCreatePassword,
  onCreate,
  onDelete,
  loading,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-accent/5 text-accent rounded-full text-[10px] font-black uppercase tracking-widest">
            <Lock className="h-4 w-4" /> Admin Hesabları
          </div>
          <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic leading-none">HESABLARI İDARƏ ET</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <input
            type="text"
            value={createUsername}
            onChange={(e) => setCreateUsername(e.target.value)}
            placeholder="Yeni admin istifadəçi adı"
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-4 focus:ring-accent/10 outline-none"
          />
          <input
            type="password"
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            placeholder="Yeni admin şifrəsi"
            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-primary focus:ring-4 focus:ring-accent/10 outline-none"
          />
          <button
            type="button"
            onClick={onCreate}
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Hesab Əlavə Et
          </button>
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-primary flex items-center justify-center">
                  <UserCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-primary tracking-tight">{user.username}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {formatCreatedAt(user.created_at)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onDelete(user.id)}
                className="w-10 h-10 rounded-2xl bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100 transition-all flex items-center justify-center"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAccountsView;
