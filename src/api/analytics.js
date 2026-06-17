import { apiGet } from "./client";

export async function getMyAnalytics() {
    return apiGet("/analytics/me");
}