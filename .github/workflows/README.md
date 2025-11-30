# GitHub Actions Workflows

This directory contains the automated CI/CD workflows for the Mnbara Platform.

## Workflows

### 1. CI (`ci.yml`)
Runs on every push and pull request to `main` and `develop`.
- **Backend Build**: Builds and tests all 13 microservices.
- **Frontend Build**: Builds Web and Mobile applications.
- **Docker Validation**: Validates `docker-compose.yml` syntax.
- **Security Scan**: Runs Gitleaks to check for secrets.

### 2. CodeQL (`codeql.yml`)
Runs GitHub's CodeQL security analysis.
- Scans JavaScript/TypeScript code for vulnerabilities.
- Runs on push to `main` and weekly schedule.

### 3. ESLint (`eslint.yml`)
Runs linting checks across the codebase.
- Ensures code quality and consistency.

### 4. Deploy AWS (`deploy-aws.yml`)
(Planned) Deploys the application to AWS.
- Currently a placeholder/template for future deployment.

## Usage

These workflows run automatically. You can view the status in the "Actions" tab of the GitHub repository.
