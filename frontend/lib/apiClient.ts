const API_BASE_URL = '/api';
const DEFAULT_DB_RETRY_DELAY_MS = 2000;
const DEFAULT_DB_RETRIES = 6;

const normalizeSnippet = (value: string, maxLength = 220): string => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    if (normalized.length <= maxLength) return normalized;
    return `${normalized.slice(0, maxLength - 3)}...`;
};

const extractHtmlErrorMessage = (html: string): string | null => {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch?.[1]) {
        return normalizeSnippet(titleMatch[1].replace(/\s*\|\s*/g, ' - '), 140);
    }

    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match?.[1]) {
        return normalizeSnippet(h1Match[1].replace(/<[^>]+>/g, ' '), 140);
    }

    return null;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
    const fallback = `API error (${response.status})`;
    let payload: any = null;

    try {
        payload = await response.clone().json();
    } catch (_) {
        try {
            const text = (await response.clone().text()).trim();
            if (text) {
                const htmlMessage = extractHtmlErrorMessage(text);
                if (htmlMessage) return `${fallback}: ${htmlMessage}`;
                return `${fallback}: ${normalizeSnippet(text)}`;
            }
        } catch (_) {
            // noop
        }
    }

    if (payload?.error) return `${fallback}: ${payload.error}`;
    if (payload?.message) return `${fallback}: ${payload.message}`;
    return fallback;
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        throw new Error(await parseErrorMessage(response));
    }
    return response.json();
};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const isDbNotReadyError = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error ?? '');
    return message.includes('DB_NOT_READY') || message.includes('Database is not ready yet');
};

export const retryDbReady = async <T>(
    operation: () => Promise<T>,
    options?: {
        retries?: number;
        delayMs?: number;
    }
): Promise<T> => {
    const retries = options?.retries ?? DEFAULT_DB_RETRIES;
    const delayMs = options?.delayMs ?? DEFAULT_DB_RETRY_DELAY_MS;

    let lastError: unknown = null;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!isDbNotReadyError(error) || attempt === retries) {
                throw error;
            }
            await wait(delayMs);
        }
    }

    throw lastError instanceof Error ? lastError : new Error('Request failed');
};

export const apiClient = {
    async get(endpoint: string) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`);
        return handleResponse(response);
    },
    async post(endpoint: string, body: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return handleResponse(response);
    },
    async patch(endpoint: string, body: any) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return handleResponse(response);
    },
    async delete(endpoint: string) {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE'
        });
        return handleResponse(response);
    },
    async upload(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData
        });
        return handleResponse(response);
    }
};
