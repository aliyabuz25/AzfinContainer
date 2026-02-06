import React from 'react';
import { Plus, Trash2, Image, Upload, User, LayoutGrid } from 'lucide-react';
import { ClientItem } from '../types';

interface ClientManagementViewProps {
    clients: any[]; // using any temporarily to avoid strict typing issues with string/object mix during migration if any
    onChange: (clients: any[]) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, id: string, cb: (url: string) => void) => void;
}

const ClientManagementView: React.FC<ClientManagementViewProps> = ({ clients, onChange, handleImageUpload }) => {

    const safeClients = Array.isArray(clients) ? clients : [];

    const handleAddClient = () => {
        const newClient = {
            id: Date.now().toString(),
            name: '',
            logo: ''
        };
        onChange([...safeClients, newClient]);
    };

    const handleRemoveClient = (idx: number) => {
        const newClients = [...safeClients];
        newClients.splice(idx, 1);
        onChange(newClients);
    };

    const handleUpdateClient = (idx: number, field: string, value: string) => {
        const newClients = [...safeClients];
        // Ensure object structure
        if (typeof newClients[idx] === 'string') {
            newClients[idx] = { name: newClients[idx], logo: '', id: Date.now().toString() };
        }
        newClients[idx] = { ...newClients[idx], [field]: value };
        onChange(newClients);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <header className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm flex items-end justify-between gap-10">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        <LayoutGrid className="h-4 w-4" /> MÜŞTƏRİLƏR
                    </div>
                    <h2 className="text-4xl font-black text-primary tracking-tighter uppercase italic leading-none">Tərəfdaş Şirkətlər</h2>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {safeClients.map((client: any, idx: number) => {
                    // Normalization on the fly if needed
                    const name = typeof client === 'string' ? client : client.name;
                    const logo = typeof client === 'string' ? '' : client.logo;

                    return (
                        <div key={idx} className="bg-white rounded-[32px] border border-slate-100 p-8 hover:shadow-xl transition-all group">
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">#{idx + 1}</span>
                                <button
                                    onClick={() => handleRemoveClient(idx)}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Image Uploader */}
                                <div className="space-y-3">
                                    <div className="relative w-full aspect-[3/2] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center group/img">
                                        {logo ? (
                                            <img src={logo} alt={name} className="w-full h-full object-contain p-4 mix-blend-multiply" />
                                        ) : (
                                            <Image className="h-8 w-8 text-slate-200" />
                                        )}

                                        <label className="absolute inset-0 bg-black/0 group-hover/img:bg-black/5 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all cursor-pointer">
                                            <div className="bg-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:scale-105 transition-transform">
                                                <Upload className="h-3 w-3" /> Yüklə
                                            </div>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleImageUpload(e, `client-${idx}`, (url) => handleUpdateClient(idx, 'logo', url))}
                                            />
                                        </label>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Logo URL..."
                                        value={logo || ''}
                                        onChange={(e) => handleUpdateClient(idx, 'logo', e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-[10px] font-bold text-slate-500 focus:text-primary outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block px-1">Şirkət Adı</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => handleUpdateClient(idx, 'name', e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-blue-500/5 outline-none pl-10"
                                            placeholder="Şirkət adı..."
                                        />
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <button
                    onClick={handleAddClient}
                    className="flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-200 p-8 text-slate-400 hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50/50 transition-all group min-h-[300px]"
                >
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Yeni Müştəri Əlavə Et</span>
                </button>
            </div>
        </div>
    );
};

export default ClientManagementView;
