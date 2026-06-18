import { apiPost} from './client';

export async function generateSummary(documentId) {
    return apiPost(`/ai/documents/${documentId}/summary`);
}

export async function generateFlashcards(documentId) {
    return apiPost(`/ai/documents/${documentId}/flashcards`);
}

export async function generateQuiz(documentId) {
    return apiPost(`/ai/documents/${documentId}/quiz`);
}


export async function generateRoadmap(documentId) {
    return apiPost(`/roadmap/documents/${documentId}`);
}
