import API_BASE_URL ,{ apiPost, apiGet, setToken, removeToken } from './client'; //apiPost to send the email/password to the backend, then setToken to save the JWT token.

export async function loginUser(email, password) {
    const data = await apiPost ("/auth/login",{
        email,
        password,
    });

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
    });
}

export async function getCurrentUser(){
    return apiGet("/users/me");
} 

export function logoutUser() {
    removeToken();  
}

