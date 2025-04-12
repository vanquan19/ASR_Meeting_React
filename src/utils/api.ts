const API_BASE_URL: string = `${import.meta.env.VITE_API_BASE_URL}:${import.meta.env.VITE_API_PORT}/api/`;

interface fetchOptions extends RequestInit {
    token?: string;
}

const fetchApi = async (url: string, options: fetchOptions = {}) => {
    const { token, headers = {}, body, ...rest } = options;

    const isFormData = body instanceof FormData;

    const finalHeaders: HeadersInit = {
        ...headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...rest,
        body,
        headers: finalHeaders,
    });

    if (!response.ok) {
        return {
            code: response.status,
            message: response.statusText,
        };
    }

    return await response.json();
};

export default fetchApi;
