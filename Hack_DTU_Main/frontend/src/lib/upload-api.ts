import { API_BASE_URL, APIResponse } from './auth-api';

export const uploadFile = async (file: File, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
            // Content-Type is mostly automatically set by browser with boundary for FormData
        },
        body: formData
    });

    const resData: APIResponse = await response.json();

    if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'File upload failed');
    }

    return resData.data.url;
};
