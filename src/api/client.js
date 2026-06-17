const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export default API_BASE_URL;    

export function getToken(){
    return localStorage.getItem("access_token");
}

export function setToken(token) {
    localStorage.setItem("access_token", token);
}

export function removeToken(){
    localStorage.removeItem("access_token");
}

function getAuthHeaders() {
    const token = getToken();

    if(!token){
        return{};
    }

    return {
        Authorization: `Bearer ${token}`,   
                   
    }   
}

export async function apiGet(path) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            ...getAuthHeaders()
        },
});

return response.json();
}

export async function apiPost(path, data) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 
            "Content-Type": "application/json",
             ...getAuthHeaders(),
    },
        body: JSON.stringify(data),
    });
    return response.json();
}
