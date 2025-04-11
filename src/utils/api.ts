const API_BASE_URL:string = `${import.meta.env.VITE_API_BASE_URL}:${import.meta.env.VITE_API_PORT}/`;


interface fetchOptions extends RequestInit {
    token?: string;
}


const fetchApi = async (url: string, options: fetchOptions = {})=> {
    const {token, headers, ...rest} = options;
    const response = await fetch(`${API_BASE_URL}${url}`, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
            ...headers
        },
    });

    if (!response.ok) {
        return {
            code: response.status,
            message: response.statusText,
        }
    }


    return await response.json();

}

export default fetchApi;