import {apiGet, apiPost} from "./client";

export async function getFlashcards(){
    return apiGet("/flashcards");
}

export async function saveFlashcard(documentId, question, answer) {
    return apiPost("/flashcards", {
        document_id: documentId,
        question,
        answer ,            
    });
}