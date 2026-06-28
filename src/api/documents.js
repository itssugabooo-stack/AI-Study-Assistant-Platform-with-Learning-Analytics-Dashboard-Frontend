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

    if (!token) {
        throw new Error('Please login again before uploading.')
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        let message = `Upload failed: ${response.status}`

        try {
            const errorData = await response.json()
            message = errorData.detail || message
        } catch {
            // Keep the status message when the backend does not return JSON.
        }

        throw new Error(message)
    }


    return response.json();

}
