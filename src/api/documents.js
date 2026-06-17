import API_BASE_URL, { apiGet, getToken } from "./client";

export async function getDocuments() {
    return apiGet("/documents");
}   

export async function getDocument(documentId){
    return apiGet(`/documents/${documentId}`);
}

export async function getDocumentText(documentId) {
    return apiGet(`/documents/${documentId}/text`);
}


export async function uploadDocument(file) {
    const formData = new FormData();
    formData.append("file", file);
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    return response.json();
}
