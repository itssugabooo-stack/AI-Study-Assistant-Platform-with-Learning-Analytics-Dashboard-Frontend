const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://studypilot-mamn.onrender.com';
export default API_BASE_URL;    
let hasWarmedApiConnection = false;

export function getToken(){
    return localStorage.getItem("access_token");
}

export function setToken(token) {
    localStorage.setItem("access_token", token);
}

export function removeToken(){
    localStorage.removeItem("access_token");
}

export function warmApiConnection() {
    if (hasWarmedApiConnection || !API_BASE_URL) {
        return;
    }

    hasWarmedApiConnection = true;

    fetch(`${API_BASE_URL}/docs`, {
        method: "GET",
        mode: "no-cors",
        cache: "no-store",
    }).catch(() => {
        // This is only a speed warm-up. Ignore failures.
    });
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

if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
        const errorData = await response.json();
        message = errorData.detail || message;
    } catch {
        // Keep default message when backend does not return JSON.
    }

    throw new Error(message)
}

return response.json();
}

export async function apiPost(path, data, options = {}) {
    const shouldUseAuth = options.auth !== false;
    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 
            "Content-Type": "application/json",
             ...(shouldUseAuth ? getAuthHeaders() : {}),
    },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        let message = `Request failed: ${response.status}`;

        try {
            const errorData = await response.json();
            message = errorData.detail || message;
        } catch {
            // Keep default message when backend does not return JSON.
        }

        throw new Error(message)
    }
    return response.json();
}

export async function apiPostForm(path, data, options = {}) {
    const shouldUseAuth = options.auth !== false;
    const body = new URLSearchParams();

    Object.entries(data).forEach(([key, value]) => {
        body.append(key, value);
    });

    const response = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(shouldUseAuth ? getAuthHeaders() : {}),
        },
        body,
    });

    if (!response.ok) {
        let message = `Request failed: ${response.status}`;

        try {
            const errorData = await response.json();
            message = errorData.detail || message;
        } catch {
            // Keep default message when backend does not return JSON.
        }

        throw new Error(message)
    }

    return response.json();
}
