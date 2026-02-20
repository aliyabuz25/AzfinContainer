import React from 'react';
import { Mail, Save } from 'lucide-react';
import { SMTPSettings } from '../utils/smtpSettings';

interface SmtpSettingsViewProps {
    settings: SMTPSettings;
    dirty: boolean;
    saving: boolean;
    onChange: (field: keyof SMTPSettings, value: string | number | boolean) => void;
    onSave: () => Promise<void> | void;
}

const fieldClassName = 'w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-bold text-primary focus:ring-4 focus:ring-accent/10 outline-none';
const labelClassName = 'text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-2';

const SmtpSettingsView: React.FC<SmtpSettingsViewProps> = ({
    settings,
    dirty,
    saving,
    onChange,
    onSave
}) => {
    return (
        <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                        <Mail className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary">SMTP AYARLARI</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Müraciətlər adminə düşür, əlavə olaraq e-poçta da göndərilir</p>
                    </div>
                </div>
                <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? 'SAXLANILIR...' : dirty ? 'SMTP SAXLA' : 'SMTP SAXLANIB'}
                </button>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">SMTP Aktiv</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Açıqdırsa hər müraciətdən sonra mail göndərilir</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => onChange('enabled', e.target.checked)}
                            className="h-5 w-5 accent-accent"
                        />
                    </div>

                    <div className="bg-slate-50 rounded-2xl px-5 py-4 border border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary">Secure TLS</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Port 465 üçün adətən aktiv, 587 üçün deaktiv olur</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.secure}
                            onChange={(e) => onChange('secure', e.target.checked)}
                            className="h-5 w-5 accent-accent"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClassName}>SMTP Host</label>
                        <input
                            type="text"
                            value={settings.host}
                            onChange={(e) => onChange('host', e.target.value)}
                            className={fieldClassName}
                            placeholder="smtp.your-provider.com"
                        />
                    </div>
                    <div>
                        <label className={labelClassName}>SMTP Port</label>
                        <input
                            type="number"
                            min={1}
                            value={settings.port}
                            onChange={(e) => onChange('port', Number(e.target.value) || 0)}
                            className={fieldClassName}
                            placeholder="587"
                        />
                    </div>
                    <div>
                        <label className={labelClassName}>SMTP User</label>
                        <input
                            type="text"
                            value={settings.user}
                            onChange={(e) => onChange('user', e.target.value)}
                            className={fieldClassName}
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className={labelClassName}>SMTP Password</label>
                        <input
                            type="password"
                            value={settings.pass}
                            onChange={(e) => onChange('pass', e.target.value)}
                            className={fieldClassName}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClassName}>From (Göndərən)</label>
                        <input
                            type="text"
                            value={settings.from}
                            onChange={(e) => onChange('from', e.target.value)}
                            className={fieldClassName}
                            placeholder="Azfin <noreply@azfin.az>"
                        />
                    </div>
                    <div>
                        <label className={labelClassName}>To (Alıcılar)</label>
                        <input
                            type="text"
                            value={settings.to}
                            onChange={(e) => onChange('to', e.target.value)}
                            className={fieldClassName}
                            placeholder="mail1@azfin.az, mail2@azfin.az"
                        />
                    </div>
                    <div>
                        <label className={labelClassName}>CC (Opsional)</label>
                        <input
                            type="text"
                            value={settings.cc}
                            onChange={(e) => onChange('cc', e.target.value)}
                            className={fieldClassName}
                        />
                    </div>
                    <div>
                        <label className={labelClassName}>BCC (Opsional)</label>
                        <input
                            type="text"
                            value={settings.bcc}
                            onChange={(e) => onChange('bcc', e.target.value)}
                            className={fieldClassName}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClassName}>Mövzu Prefix</label>
                    <input
                        type="text"
                        value={settings.subjectPrefix}
                        onChange={(e) => onChange('subjectPrefix', e.target.value)}
                        className={fieldClassName}
                        placeholder="AZFIN"
                    />
                </div>
            </div>
        </div>
    );
};

export default SmtpSettingsView;
