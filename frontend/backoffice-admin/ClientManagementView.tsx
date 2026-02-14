import React from 'react';
import { Plus, Trash2, Image, Upload, User, LayoutGrid } from 'lucide-react';
import { ClientItem } from '../types';

interface ClientManagementViewProps {
    clients: any[];
    heading: string;
    onClientsChange: (clients: any[]) => void;
    onHeadingChange: (heading: string) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, id: string, cb: (url: string) => void) => void;
}

const ClientManagementView: React.FC<ClientManagementViewProps> = ({
    clients,
    heading,
    onClientsChange,
    onHeadingChange,
    handleImageUpload
}) => {

    const safeClients = Array.isArray(clients) ? clients : [];

    const handleAddClient = () => {
        const newClient = {
            id: Date.now().toString(),
            name: 'Yeni Şirkət',
            logo: ''
        };
        onClientsChange([...safeClients, newClient]);
    };

    const handleRemoveClient = (idx: number) => {
        const newClients = [...safeClients];
        newClients.splice(idx, 1);
        onClientsChange(newClients);
    };

    const handleUpdateClient = (idx: number, field: string, value: string) => {
        const newClients = [...safeClients];
        if (typeof newClients[idx] === 'string') {
            newClients[idx] = { name: newClients[idx], logo: '', id: Date.now().toString() };
        }
        newClients[idx] = { ...newClients[idx], [field]: value };
        onClientsChange(newClients);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <header className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-sm space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent rounded-full text-[9px] font-black uppercase tracking-widest">
                            <LayoutGrid className="h-3 w-3" /> MÜŞTƏRİLƏR BÖLMƏSİ
                        </div>
                        <h2 className="text-3xl font-black text-primary tracking-tighter uppercase italic leading-none">Tərəfdaşların İdarəedilməsi</h2>
                    </div>
                    <button
                        onClick={handleAddClient}
                        className="flex items-center justify-center gap-3 bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all shadow-lg shadow-primary/10 active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> YENİ ŞİRKƏT ƏLAVƏ ET
                    </button>
                </div>

                <div className="h-px bg-slate-100 w-full" />

                <div className="space-y-4 max-w-2xl">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Bölmə Başlığı (Saytda görünən mətn)</label>
                    <div className="relative group">
                        <input
                            type="text"
                            value={heading || ''}
                            onChange={(e) => onHeadingChange(e.target.value)}
                            className="w-full bg-slate-50 border border-transparent focus:border-accent/20 focus:bg-white rounded-2xl px-6 py-4 text-sm font-bold text-primary outline-none transition-all shadow-inner placeholder:text-slate-300"
                            placeholder="Məsələn: BİZƏ GÜVƏNƏN MÜŞTƏRİLƏRİMİZ"
                        />
                        <LayoutGrid className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-200 group-focus-within:text-accent transition-colors" />
                    </div>
                </div>
            </header>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {safeClients.map((client: any, idx: number) => {
                    const name = typeof client === 'string' ? client : client.name;
                    const logo = typeof client === 'string' ? '' : client.logo;

                    return (
                        <div key={idx} className="bg-white rounded-[28px] border border-slate-100 p-6 hover:shadow-2xl hover:border-accent/20 transition-all group relative overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400">
                                    {idx + 1}
                                </div>
                                <button
                                    onClick={() => handleRemoveClient(idx)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="space-y-6 flex-grow">
                                {/* Image Uploader Area */}
                                <div className="relative group/img aspect-video bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden">
                                    {logo ? (
                                        <img src={logo} alt={name} className="w-full h-full object-contain p-4 transition-transform group-hover/img:scale-105" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Image className="h-8 w-8 text-slate-200" />
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">LOGO YOXDUR</span>
                                        </div>
                                    )}

                                    <label className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]">
                                        <div className="bg-white px-5 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary transform translate-y-2 group-hover/img:translate-y-0 transition-transform">
                                            <Upload className="h-3 w-3 text-accent" /> LOGO YÜKLƏ
                                        </div>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, `client-${idx}`, (url) => handleUpdateClient(idx, 'logo', url))}
                                        />
                                    </label>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 px-1">Şirkət Adı</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => handleUpdateClient(idx, 'name', e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-primary focus:ring-2 focus:ring-accent/10 outline-none transition-all"
                                            placeholder="AD DAXİL EDİN..."
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-300 px-1">Logo URL</label>
                                        <input
                                            type="text"
                                            value={logo || ''}
                                            onChange={(e) => handleUpdateClient(idx, 'logo', e.target.value)}
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-[10px] font-medium text-slate-400 focus:text-primary outline-none transition-all truncate"
                                            placeholder="URL daxil edin və ya yükləyin..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Empty State / Add Button */}
                {safeClients.length === 0 && (
                    <div className="col-span-full py-20 bg-slate-50/50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-20 h-20 bg-white rounded-[32px] flex items-center justify-center shadow-lg text-slate-200">
                            <Plus className="h-10 w-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-primary uppercase italic tracking-tight">Hələ heç bir müştəri yoxdur</h3>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Siyahıya başlamaq üçün aşağıdakı düyməyə basın</p>
                        </div>
                        <button
                            onClick={handleAddClient}
                            className="bg-primary text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-accent transition-all shadow-xl active:scale-95"
                        >
                            İLK ŞİRKƏTİ ƏLAVƏ ET
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientManagementView;
