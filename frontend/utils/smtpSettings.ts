import { apiClient } from '../lib/apiClient';

export interface SMTPSettings {
    enabled: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    to: string;
    cc: string;
    bcc: string;
    subjectPrefix: string;
}

export const DEFAULT_SMTP_SETTINGS: SMTPSettings = {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
    to: '',
    cc: '',
    bcc: '',
    subjectPrefix: 'AZFIN',
};

const normalizeSmtpSettings = (payload: any): SMTPSettings => {
    const source = payload && typeof payload === 'object' ? payload : {};
    return {
        enabled: Boolean(source.enabled),
        host: String(source.host ?? ''),
        port: Number(source.port) > 0 ? Number(source.port) : DEFAULT_SMTP_SETTINGS.port,
        secure: Boolean(source.secure),
        user: String(source.user ?? ''),
        pass: String(source.pass ?? ''),
        from: String(source.from ?? ''),
        to: String(source.to ?? ''),
        cc: String(source.cc ?? ''),
        bcc: String(source.bcc ?? ''),
        subjectPrefix: String(source.subjectPrefix ?? DEFAULT_SMTP_SETTINGS.subjectPrefix),
    };
};

export const fetchSmtpSettings = async (): Promise<SMTPSettings> => {
    try {
        const data = await apiClient.get('/admin/smtp-settings');
        return normalizeSmtpSettings(data);
    } catch (error) {
        console.error('Error fetching SMTP settings:', error);
        return { ...DEFAULT_SMTP_SETTINGS };
    }
};

export const saveSmtpSettings = async (settings: SMTPSettings) => {
    try {
        const response = await apiClient.post('/admin/smtp-settings', settings);
        return {
            data: normalizeSmtpSettings(response?.settings || settings),
            error: null
        };
    } catch (error) {
        console.error('Error saving SMTP settings:', error);
        return { data: null, error };
    }
};
