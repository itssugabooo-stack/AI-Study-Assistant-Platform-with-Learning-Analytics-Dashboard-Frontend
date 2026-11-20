import { apiGet, apiPost } from "./client";

export async function getQuizAttempts(options) {
  return apiGet("/quizzes/attempts", options);
}

export async function submitQuizAttempt(quizId, answers) {
  return apiPost(`/quizzes/submit`, {
    quiz_id: quizId,
    answers,
  });
}
