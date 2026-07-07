import { apiPost, apiPostForm, apiGet, setToken, removeToken } from './client' //apiPost to send the email/password to the backend, then setToken to save the JWT token.

export async function loginUser(email, password) {
    removeToken();

    let data;

    try {
        data = await apiPost("/auth/login", {
            email,
            password,
        }, { auth: false });
    } catch (jsonLoginError) {
        try {
            data = await apiPostForm("/auth/login", {
                username: email,
                password,
            }, { auth: false });
        } catch {
            throw jsonLoginError;
        }
    }

    if (data.access_token) {
        setToken(data.access_token);
    }
   
    return data;
}

export async function registerUser(email, fullName, password)   {
    return apiPost("/users/register", {
        email,
        full_name: fullName,
        password,
    }, { auth: false });
}

export async function getCurrentUser(){
    return apiGet("/users/me");
} 

export function logoutUser() {
    removeToken();  
}

