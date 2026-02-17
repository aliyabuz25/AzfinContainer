const API_BASE_URL = '/api';

const parseErrorMessage = async (response: Response): Promise<string> => {
    const fallback = `API error (${response.status})`;
    let payload: any = null;

    try {
        payload = await response.clone().json();
    } catch (_) {
        try {
            const text = (await response.clone().text()).trim();
            if (text) return `${fallback}: ${text}`;
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
