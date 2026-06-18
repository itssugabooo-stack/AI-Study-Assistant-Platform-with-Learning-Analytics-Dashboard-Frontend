import { apiGet, apiPost } from './client';

export async function getQuizAttempts() {
    return apiGet('/quizzes/attempts');
}

export async function submitQuizAttempt(documentId, answers) {
    return apiPost(`/quizzes/submit`, {
        document_id: documentId,
        answers,
    });
}