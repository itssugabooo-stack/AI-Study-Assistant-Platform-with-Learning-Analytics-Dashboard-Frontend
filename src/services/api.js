import { getMyAnalytics } from "../api/analytics";
import { getCurrentUser as fetchCurrentUser, loginUser, registerUser } from "../api/auth";

export async function login(email, password) {
    return loginUser(email, password);
}

export async function register(fullName, email, password) {
    return registerUser(email, fullName, password);
}

export async function getCurrentUser() {
    return fetchCurrentUser();
}

export async function getAnalytics() {
    return getMyAnalytics();
}
