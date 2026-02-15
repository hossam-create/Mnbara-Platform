# Project Constitution

This document outlines the core principles and standards for the Mnbara Platform. All contributors must adhere to these guidelines to ensure a high-quality, secure, and performant application.

## 1. Code Quality

### Principles

- **Readability first**: Write code that is easy to understand. verbose variable names are preferred over obscure abbreviations.

- **DRY (Don't Repeat Yourself)**: Extract common logic into reusable functions or components.
- **SOLID**: Adhere to SOLID principles for object-oriented design and architecture.
- **Type Safety**: Use Strict TypeScript. `any` is strictly prohibited unless absolutely necessary and documented.

### Standards
- **Linting**: All code must pass ESLint checks without warnings.
- **Formatting**: Prettier must be used for consistent code formatting.
- **Comments**: Document complex logic. Public APIs must have JSDoc/TSDoc comments.
- **Error Handling**: Fail gracefully. distinct error types should be used, and exceptions must be caught and logged appropriately.

## 2. Testing Standards

### Principles
- **Test-Driven Mindset**: Write tests that validate requirements before or alongside implementation.
- **Safety Critical**: Financial and security-critical paths (e.g., payments, auth) must have 100% coverage.

### Requirements

- **Unit Tests**: Cover individual functions and components. Mock external dependencies.

- **Integration Tests**: Verify interactions between services and databases.
- **E2E Tests**: Validate critical user flows (e.g., Sign up, Bidding, Checkout).
- **CI/CD**: specific tests must pass in the CI pipeline before merging.

## 3. User Experience Consistency

### Principles
- **Desktop-First (eBay Parity)**: The initial focus is on a robust desktop experience matching the density and utility of eBay.
- **Responsiveness**: All layouts must adapt gracefully to mobile and tablet screens, even if optimized for desktop.
- **Feedback**: Every user action (click, form submit) must provide immediate visual feedback (loading spinners, success toasts, error messages).
- **Accessibility**: Follow WCAG 2.1 AA standards. Semantic HTML key navigation support.

### Design System

- **Colors**: Use the canonical MNbarh brand palette. No hardcodded hex values outside of the theme config.

- **Typography**: Adhere to the defined type scale.
- **Components**: Reuse shared UI components (Buttons, Inputs, Modals) to ensure visual consistency.

## 4. Performance Requirements

### Principles
- **Speed**: The application must feel instant.
- **Efficiency**: Minimize resource usage (CPU, Memory, Network) on both client and server.

### Metric

- **Core Web Vitals**:

  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **API Latency**: P95 response time should be under 200ms for non-reporting endpoints.
- **Bundle Size**: Initial JS bundle size should be minimized (target < 200KB gzipped). Lazy load non-critical routes.

## 5. Security & Integrity

- **Zero Trust**: Validate all inputs at every boundary (API, Database, RPC).

- **Audit Trails**: All financial and sensitive administrative actions must be irrevocably logged.
- **Secrets**: Never commit secrets to version control. Use environment variables and secret management services.
