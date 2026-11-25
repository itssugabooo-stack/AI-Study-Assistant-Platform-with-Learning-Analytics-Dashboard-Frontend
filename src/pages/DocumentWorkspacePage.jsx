import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { getDocument, getDocumentPdf } from "../api/documents";
import {
  getStudyMaterials,
  generateSummary,
  generateFlashcards,
  generateQuiz,
  generateRoadmap,
} from "../api/ai";
import { submitQuizAttempt } from "../api/quizzes";
import ResourceState from "../components/ResourceState";
import RoadmapSteps from "../components/RoadmapSteps";
import Skeleton from "../components/Skeleton";
import RouteLink from "../components/RouteLink";
import {
  generationErrorMessage,
  getPreparationIssue,
  preparationMessages,
} from "../documentPreparation";
import { guidedStudyEnabled } from "../guidedStudyFlag";
import { openPdf } from "../openPdf";
import { documentPath, workspacePaths } from "../routes";
import useResource from "../useResource";
import ErrorPage from "./ErrorPage";

const tools = [
  {
    id: "summary",
    label: "Summary",
    description: "Turn the key ideas in this PDF into a concise set of notes.",
    generate: generateSummary,
  },
  {
    id: "flashcards",
    label: "Flashcards",
    description:
      "Test your recall with questions and reveal each answer as you go.",
    generate: generateFlashcards,
  },
  {
    id: "quiz",
    label: "Quiz",
    description:
      "Answer questions from this PDF and save your score to Practice.",
    generate: generateQuiz,
  },
  {
    id: "roadmap",
    label: "Roadmap",
    description: "Get an ordered list of topics to review from this PDF.",
    generate: generateRoadmap,
  },
];

const pdfOpenMessages = {
  blocked:
    "Your browser blocked the new tab. Allow pop-ups for this site and try again.",
  closed:
    "The PDF tab was closed before the file opened. Try opening it again.",
  unauthorized: "Sign in again to open this PDF.",
  unavailable: "This PDF is not available to your account.",
  failed: "We could not open this PDF. Please try again.",
};

function isScorableQuiz(data) {
  return (
    data?.quiz_id != null &&
    Array.isArray(data.questions) &&
    data.questions.length > 0 &&
    data.questions.every(
      (item) =>
        typeof item?.question === "string" &&
        Array.isArray(item.choices) &&
        item.choices.length >= 2,
    )
  );
}

function PreparationNotice({ issue, onUpload }) {
  return (
    <div className="sp-empty">
      <p role={issue === "no_text" ? "status" : "alert"}>
        {preparationMessages[issue]}
      </p>
      <button
        className={
          issue === "extraction_failed"
            ? "sp-button sp-secondary"
            : "sp-button sp-primary"
        }
        type="button"
        onClick={onUpload}
      >
        Upload PDF
      </button>
    </div>
  );
}

function DocumentWorkspacePage({
  documentId,
  activeTool,
  onSelectTool,
  onNavigate,
  onUpload,
}) {
  const loadDocument = useCallback(
    (options) => getDocument(documentId, options),
    [documentId],
  );
  const documentResource = useResource(loadDocument);
  const loadMaterials = useCallback(
    (options) => getStudyMaterials(documentId, options),
    [documentId],
  );
  const materialsResource = useResource(loadMaterials);
  const document = documentResource.data;
  const [preparation, setPreparation] = useState(null);
  const preparationStatus =
    preparation ??
    (document?.has_extracted_text ? "ready" : document?.processing_status);
  const textReady = preparationStatus === "ready";
  const generationBlocked =
    preparationStatus === "missing" || preparationStatus === "no_text";
  const [generations, setGenerations] = useState({});
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [quizSubmitLoading, setQuizSubmitLoading] = useState(false);
  const [quizSubmitError, setQuizSubmitError] = useState("");
  const [quizResult, setQuizResult] = useState(null);
  const [pdfStatus, setPdfStatus] = useState(null);
  const pdfRequest = useRef(null);
  const generatingTool = useRef(null);
  const submittingQuiz = useRef(false);
  const questionHeading = useRef(null);
  const resultHeading = useRef(null);

  const tool = tools.find(({ id }) => id === activeTool);
  const generation = generations[activeTool];
  const generating = generation?.status === "loading";
  const anyGenerating = Object.values(generations).some(
    ({ status }) => status === "loading",
  );
  const quizGenerating = generations.quiz?.status === "loading";
  // A completed generation takes precedence over any saved read, even if that read finishes later.
  const material = generation?.data ?? materialsResource.data?.[activeTool];
  const regenerating = generating && Boolean(material);
  const quizData = generations.quiz?.data ?? materialsResource.data?.quiz;
  const quiz = isScorableQuiz(quizData) ? quizData.questions : [];
  const question = quiz[questionIndex];
  const answeredCount = Object.keys(selectedQuizAnswers).length;
  const canSubmitQuiz =
    quiz.length > 0 &&
    answeredCount === quiz.length &&
    !quizGenerating &&
    !quizSubmitLoading &&
    !quizResult;
  const showQuiz = activeTool === "quiz" && Boolean(question);

  useLayoutEffect(() => {
    if (showQuiz)
      (quizResult ? resultHeading : questionHeading).current?.focus();
  }, [questionIndex, quizData, quizResult, showQuiz]);

  useLayoutEffect(() => () => pdfRequest.current?.abort(), [documentId]);

  async function handleOpenPdf() {
    if (pdfRequest.current) return;
    const controller = new AbortController();
    pdfRequest.current = controller;
    setPdfStatus("loading");
    const status = await openPdf(
      (options) => getDocumentPdf(documentId, options),
      controller.signal,
    );
    pdfRequest.current = null;
    if (!controller.signal.aborted) setPdfStatus(status);
  }

  async function handleGenerate() {
    if (
      !tool ||
      generationBlocked ||
      generatingTool.current ||
      (tool.id === "quiz" && submittingQuiz.current)
    )
      return;
    const { id: toolId } = tool;
    generatingTool.current = toolId;
    setGenerations((previous) => ({
      ...previous,
      [toolId]: { data: previous[toolId]?.data, status: "loading" },
    }));

    try {
      const data = await tool.generate(documentId);
      if (toolId === "quiz") {
        if (!isScorableQuiz(data)) throw new Error("Invalid quiz response");
        setSelectedQuizAnswers({});
        setQuestionIndex(0);
        setQuizResult(null);
        setQuizSubmitError("");
      }
      setPreparation("ready");
      setGenerations((previous) => ({
        ...previous,
        [toolId]: { status: "success", data },
      }));
    } catch (error) {
      const issue = getPreparationIssue(error);
      if (issue) setPreparation(issue);
      setGenerations((previous) => ({
        ...previous,
        [toolId]: { data: previous[toolId]?.data, status: "error", error },
      }));
    } finally {
      generatingTool.current = null;
    }
  }

  function handleSelectQuizAnswer(questionIndex, choiceIndex) {
    if (
      quizResult ||
      submittingQuiz.current ||
      generatingTool.current === "quiz"
    )
      return;

    setSelectedQuizAnswers((previous) => ({
      ...previous,
      [questionIndex]: choiceIndex,
    }));
  }

  async function handleSubmitExam() {
    if (
      !canSubmitQuiz ||
      submittingQuiz.current ||
      generatingTool.current === "quiz"
    )
      return;
    submittingQuiz.current = true;
    setQuizSubmitLoading(true);
    setQuizSubmitError("");

    try {
      const answers = quiz.map((_, index) => ({
        question_index: index,
        selected_choice_index: selectedQuizAnswers[index],
      }));
      const result = await submitQuizAttempt(quizData.quiz_id, answers);
      setQuizResult(result);
    } catch (error) {
      setQuizSubmitError(
        error?.status === 429
          ? "Quiz grading is busy right now. Please wait a moment and try again."
          : "We could not submit your quiz. Your answers are still here; please try again.",
      );
    } finally {
      submittingQuiz.current = false;
      setQuizSubmitLoading(false);
    }
  }

  if (documentResource.status === "error") {
    const missing = documentResource.error?.status === 404;
    const signedOut = documentResource.error?.status === 401;
    return (
      <ErrorPage
        embedded
        title={
          missing
            ? "Document not found"
            : signedOut
              ? "Sign in again"
              : "Couldn’t open this document"
        }
        description={
          missing
            ? "This PDF may no longer be available in your library."
            : signedOut
              ? "Your session has expired. Sign out, then sign in again to open your PDF."
              : "Try loading the document again or open another PDF from your library."
        }
        onBack={() => onNavigate("library")}
        backLabel="Back to library"
        onRetry={missing || signedOut ? undefined : documentResource.retry}
      />
    );
  }

  return (
    <div className="sp-page">
      <RouteLink
        className="sp-text-button sp-back-link"
        to={workspacePaths.library}
      >
        ← Back to library
      </RouteLink>
      <header className="sp-page-heading sp-document-heading">
        {document ? (
          <h1>{document.original_filename}</h1>
        ) : (
          <h1 className="sp-visually-hidden">Document workspace</h1>
        )}
        {!document && (
          <ResourceState
            resource={documentResource}
            loading="Loading document…"
            variant="heading"
          />
        )}
        {document && (
          <>
            <div className="sp-document-meta">
              <p role="status">
                {textReady
                  ? "Ready to study"
                  : preparationMessages[preparationStatus]
                    ? "Not ready to study"
                    : "Not prepared yet"}
              </p>
              <button
                className="sp-button sp-secondary"
                type="button"
                title="Opens in a new tab"
                onClick={handleOpenPdf}
                disabled={pdfStatus === "loading"}
              >
                Open PDF
              </button>
              {pdfStatus === "loading" && <p role="status">Opening PDF...</p>}
            </div>
            {pdfStatus === "missing" && (
              <PreparationNotice issue="missing" onUpload={onUpload} />
            )}
            {pdfOpenMessages[pdfStatus] && (
              <p className="sp-error" role="alert">
                {pdfOpenMessages[pdfStatus]}
              </p>
            )}
          </>
        )}
      </header>

      {document && (
        <div className="sp-workspace">
          <nav
            className="sp-tool-rail"
            aria-label={
              guidedStudyEnabled
                ? "Guided study and quick reference"
                : "Document tools"
            }
          >
            {guidedStudyEnabled && (
              <RouteLink to={documentPath(documentId, "study")}>
                Guided study
              </RouteLink>
            )}
            {tools.map(({ id, label }) => (
              <RouteLink
                key={id}
                to={documentPath(documentId, id)}
                aria-current={activeTool === id ? "page" : undefined}
              >
                {label}
              </RouteLink>
            ))}
          </nav>
          <label className="sp-field sp-tool-picker">
            Study tool
            <select
              value={activeTool}
              onChange={(event) => onSelectTool(event.target.value)}
            >
              {guidedStudyEnabled && (
                <option value="study">Guided study</option>
              )}
              {tools.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <section
            className="sp-tool-panel"
            aria-labelledby="tool-title"
            key={activeTool}
          >
            <div className="sp-section-heading">
              <div>
                <h2 id="tool-title">{tool?.label}</h2>
                {!showQuiz && tool?.description && <p>{tool.description}</p>}
              </div>
              {tool && !generationBlocked && (
                <>
                  <button
                    className="sp-button sp-primary sp-generation-button"
                    type="button"
                    onClick={handleGenerate}
                    aria-busy={generating}
                    disabled={
                      anyGenerating ||
                      (activeTool === "quiz" && quizSubmitLoading)
                    }
                  >
                    <span aria-hidden={generating}>
                      {material ? "Regenerate" : "Generate"} {tool.label.toLowerCase()}
                    </span>
                    <span
                      className="sp-generation-progress"
                      aria-hidden={!generating}
                    >
                      {material && (
                        <span className="sp-generation-spinner" aria-hidden="true" />
                      )}
                      {material ? "Regenerating…" : "Generating…"}
                    </span>
                  </button>
                  <span className="sp-visually-hidden" role="status">
                    {regenerating ? `Regenerating ${tool.label.toLowerCase()}…` : ""}
                  </span>
                </>
              )}
            </div>

            {preparationMessages[preparationStatus] &&
              !(preparationStatus === "missing" && pdfStatus === "missing") && (
                <PreparationNotice
                  issue={preparationStatus}
                  onUpload={onUpload}
                />
              )}

            {tool &&
              (!generating || materialsResource.status !== "loading") && (
                <ResourceState
                  resource={materialsResource}
                  loading="Loading saved study materials…"
                  failure="We could not load your saved study materials."
                />
              )}
            {generating && !material && (
              <Skeleton label={`Generating ${tool.label.toLowerCase()}…`} />
            )}
            {generation?.status === "error" &&
              !getPreparationIssue(generation.error) && (
                <p className="sp-error" role="alert">
                  {generationErrorMessage(generation.error)}
                </p>
              )}

            {material && activeTool === "summary" && (
              <p className="sp-reading">
                {material.summary || "This PDF returned an empty summary."}
              </p>
            )}
            {material &&
              activeTool === "flashcards" &&
              (material.flashcards?.length ? (
                <div className="sp-flashcards">
                  {material.flashcards.map((card, index) => (
                    <details key={`${card.question}-${index}`}>
                      <summary>{card.question}</summary>
                      <p>{card.answer}</p>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="sp-muted">This PDF returned no flashcards.</p>
              ))}
            {material &&
              activeTool === "roadmap" &&
              (material.steps?.length ? (
                <RoadmapSteps steps={material.steps} />
              ) : (
                <p className="sp-muted">This PDF returned no study steps.</p>
              ))}

            {showQuiz &&
              (quizResult ? (
                <div className="sp-quiz-result">
                  <h3 ref={resultHeading} tabIndex={-1}>
                    Quiz results
                  </h3>
                  <strong className="sp-result-score">
                    {quizResult.score_percentage}%
                  </strong>
                  <p>
                    {quizResult.correct_answers} correct out of{" "}
                    {quizResult.total_questions}
                  </p>
                  <div className="sp-actions">
                    <button
                      className="sp-button sp-primary"
                      type="button"
                      onClick={() => onNavigate("practice")}
                    >
                      View practice history
                    </button>
                  </div>
                </div>
              ) : (
                <div className="sp-quiz">
                  <div className="sp-question-progress">
                    <h3 ref={questionHeading} tabIndex={-1}>
                      Question {questionIndex + 1} of {quiz.length}
                    </h3>
                    <span role="status">
                      {answeredCount} of {quiz.length} answered
                    </span>
                  </div>
                  <progress
                    aria-label="Questions answered"
                    value={answeredCount}
                    max={quiz.length}
                  />
                  <fieldset
                    className="sp-question"
                    disabled={quizSubmitLoading || quizGenerating}
                  >
                    <legend>{question.question}</legend>
                    {question.choices.map((choice, choiceIndex) => (
                      <label className="sp-choice" key={choiceIndex}>
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={
                            selectedQuizAnswers[questionIndex] === choiceIndex
                          }
                          onChange={() =>
                            handleSelectQuizAnswer(questionIndex, choiceIndex)
                          }
                        />
                        <span>{choice}</span>
                      </label>
                    ))}
                  </fieldset>
                  {quizSubmitError && (
                    <p className="sp-error" role="alert">
                      {quizSubmitError}
                    </p>
                  )}
                  {quizSubmitLoading && (
                    <p className="sp-status" role="status">
                      Submitting quiz for grading…
                    </p>
                  )}
                  <div className="sp-quiz-actions">
                    <button
                      className="sp-button sp-secondary"
                      type="button"
                      onClick={() => setQuestionIndex(questionIndex - 1)}
                      disabled={
                        questionIndex === 0 ||
                        quizSubmitLoading ||
                        quizGenerating
                      }
                    >
                      ← Previous
                    </button>
                    {questionIndex + 1 < quiz.length ? (
                      <button
                        className="sp-button sp-primary"
                        type="button"
                        onClick={() => setQuestionIndex(questionIndex + 1)}
                        disabled={
                          selectedQuizAnswers[questionIndex] === undefined ||
                          quizGenerating
                        }
                      >
                        Next →
                      </button>
                    ) : (
                      <button
                        className="sp-button sp-primary"
                        type="button"
                        onClick={handleSubmitExam}
                        disabled={!canSubmitQuiz}
                      >
                        {quizSubmitLoading
                          ? "Submitting…"
                          : quizSubmitError
                            ? "Retry submission"
                            : "Submit quiz"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </section>
        </div>
      )}
    </div>
  );
}

export default DocumentWorkspacePage;
