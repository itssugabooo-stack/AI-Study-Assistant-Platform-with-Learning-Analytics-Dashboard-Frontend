import { Component } from 'react'
import ErrorPage from '../pages/ErrorPage'

class PageBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <ErrorPage
        {...this.props.recovery}
        title="Something went wrong"
        description="StudyPilot couldn’t display this page. Try opening it again."
        onRetry={() => this.setState({ failed: false })}
      />
    )
  }
}

export default PageBoundary
