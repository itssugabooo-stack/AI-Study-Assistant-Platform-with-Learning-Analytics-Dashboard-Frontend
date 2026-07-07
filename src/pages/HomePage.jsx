import Logo from '../components/Logo'

const benefits = [
  {
    icon: '01',
    title: 'Summaries faster',
    description: 'Turn long PDFs into short study notes you can review quickly.',
  },
  {
    icon: '02',
    title: 'Practice from PDFs',
    description: 'Generate flashcards and exams directly from uploaded documents.',
  },
  {
    icon: '03',
    title: 'Track your scores',
    description: 'See quiz attempts, averages, and progress from your dashboard.',
  },
  {
    icon: '04',
    title: 'One study workspace',
    description: 'Keep documents, AI tools, roadmap, and practice history together.',
  },
]

const features = [
  {
    number: '01',
    title: 'AI Summary Generator',
    description:
      'Turn lengthy PDF notes and lecture slides into concise summaries that highlight the concepts that matter.',
    image: '/images/summary-generator.png',
  },
  {
    number: '02',
    title: 'Quiz Generator',
    description:
      'Create quizzes from your uploaded materials to test knowledge and identify topics that need more attention.',
    image: '/images/quiz-generator.png',
  },
  {
    number: '03',
    title: 'Flashcard Generator',
    description:
      'Build automatic flashcards for active recall, quick revision, and stronger long-term memory.',
    image: '/images/flashcard-motif.png',
  },
  {
    number: '04',
    title: 'Learning Analytics',
    description:
      'Monitor quiz scores, study activity, learning trends, and progress through one clear dashboard.',
    image: '/images/learning-analytics.png',
  },
]

const steps = [
  ['Create an account', 'Set up your personal learning profile.'],
  ['Upload materials', 'Add PDF notes, lecture slides, or study documents.'],
  ['Generate resources', 'Create summaries, quizzes, and flashcards with AI.'],
  ['Study and practice', 'Review resources and strengthen your understanding.'],
  ['Monitor progress', 'Use analytics to identify areas for improvement.'],
]

function HomePage({ onGetStarted, onLogin }) {
  return (
    <main className="study-home">
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="section-kicker">Your intelligent learning companion</p>
          <h1>Welcome to <span>StudyPilot</span></h1>
          <p>
            Transform study materials into summaries, quizzes, flashcards, and
            personalized learning insights powered by artificial intelligence.
          </p>
          <div className="hero-actions">
            <button className="home-primary-button" onClick={onGetStarted}>
              Get started
            </button>
            <a className="home-secondary-link" href="#how-it-works">
              See how it works
            </a>
          </div>
          <div className="hero-proof">
            <span><strong>3</strong> AI study tools</span>
            <span><strong>1</strong> progress dashboard</span>
            <span><strong>24/7</strong> learning support</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="StudyPilot analytics preview">
          <div className="hero-visual-top">
            <span>Learning overview</span>
            <strong>+18% this week</strong>
          </div>
          <div className="hero-score-card">
            <span>Quiz average</span>
            <strong>86%</strong>
            <div><span /></div>
          </div>
          <div className="hero-mini-grid">
            <article><strong>12</strong><span>Study hours</span></article>
            <article><strong>24</strong><span>Flashcards</span></article>
          </div>
          <div className="hero-bars">
            {[42, 68, 53, 78, 64, 92, 82].map((height, index) => (
              <span key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-benefits" id="benefits">
        <div className="section-heading">
          <p className="section-kicker">Why choose StudyPilot?</p>
          <h2>Spend less time organizing and more time understanding.</h2>
          <p>
            StudyPilot analyzes your materials and creates useful learning
            resources, helping you focus on concepts and academic performance.
          </p>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article key={benefit.title}>
              <span aria-hidden="true">{benefit.icon}</span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section" id="features">
        <div className="section-heading">
          <p className="section-kicker">Our features</p>
          <h2>Everything you need to learn smarter.</h2>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className={feature.image ? 'feature-card has-image' : 'feature-card'} key={feature.title}>
              <span>{feature.number}</span>
              {feature.image && (
                <img
                  alt={`${feature.title} illustration`}
                  className="feature-card-image"
                  src={feature.image}
                />
              )}
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-process" id="how-it-works">
        <div className="section-heading">
          <p className="section-kicker">How StudyPilot works</p>
          <h2>From study material to measurable progress.</h2>
        </div>
        <div className="step-list">
          {steps.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-section home-about" id="about">
        <div>
          <p className="section-kicker">About StudyPilot</p>
          <h2>A smarter workspace for studying from PDFs.</h2>
        </div>
        <div className="about-copy">
          <p>
            StudyPilot is an AI-powered learning assistant that helps students
            upload PDF materials, generate study resources, practice with exams,
            and track learning progress from one dashboard.
          </p>
          <div className="about-values">
            <article>
              <h3>What it does</h3>
              <p>Creates summaries, flashcards, exams, roadmaps, and text previews.</p>
            </article>
            <article>
              <h3>Why it helps</h3>
              <p>Reduces study setup time so students can focus on understanding.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-section home-contact" id="contact">
        <div className="section-heading">
          <p className="section-kicker">Contact us</p>
          <h2>Need help or want to share feedback?</h2>
          <p>Contact the StudyPilot team for project questions, testing feedback, or improvement ideas.</p>
        </div>
        <div className="contact-grid">
          <a href="mailto:support@studypilot.com"><span>Email</span>support@studypilot.com</a>
          <p><span>Availability</span>Monday to Friday, 09:00 AM - 05:00 PM</p>
          <p><span>Project</span>Computer Science Final Year Project</p>
        </div>
      </section>

      <section className="home-cta">
        <div>
          <p className="section-kicker">Start learning smarter today</p>
          <h2>Make your study materials work harder for you.</h2>
        </div>
        <div>
          <button className="home-primary-button" onClick={onGetStarted}>
            Create your account
          </button>
          <button className="cta-login-button" onClick={onLogin}>
            Already a member? Login
          </button>
        </div>
      </section>

      <footer className="home-footer">
        <div><Logo /></div>
        <p>AI-powered learning analytics for smarter study.</p>
        <p>&copy; 2026 StudyPilot</p>
      </footer>
    </main>
  )
}

export default HomePage
