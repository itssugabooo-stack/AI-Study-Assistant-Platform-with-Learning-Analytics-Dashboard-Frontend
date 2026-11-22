import { apiGet, apiGetBlob, apiPostForm, getToken } from "./client";

export async function getDocuments(options) {
    return apiGet("/documents", options);
}   

export async function getDocument(documentId, options){
    return apiGet(`/documents/${documentId}`, options);
}

export async function getDocumentPdf(documentId, options) {
    return apiGetBlob(`/documents/${encodeURIComponent(documentId)}/file`, options);
}


export async function uploadDocument(file) {
    if (!getToken()) {
        const error = new Error('Sign in again before uploading.');
        error.status = 401;
        throw error;
    }

    const formData = new FormData();
    formData.append("file", file);
    return apiPostForm("/documents/upload", formData);
}
