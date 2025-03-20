const API_BASE_URL:string = 'http://localhost:8080/';


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
            message: response.statusText
        }
    }


    return await response.json();

}

export default fetchApi;