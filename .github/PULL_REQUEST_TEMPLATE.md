### Summary

<!-- Provide a short description of the change -->

### Related Issue

<!-- Link to the related issue: #ISSUE_NUMBER -->
<!-- If this relates to an ACTION_PLAN.md task, mention it: Task #N -->

### Changes

<!-- List the main changes made in this PR -->

-
-
-

### How to Test Locally

<!-- Provide step-by-step instructions to test this PR -->

1. `git checkout <branch-name>`
2. `docker-compose up --build`
3. Run: `<commands>`
   - Example: `npm run test`
   - Example: `curl http://localhost:3001/health`

### Acceptance Criteria

<!-- Copy from ACTION_PLAN.md or define new criteria -->

- [ ] Acceptance criterion 1
- [ ] Acceptance criterion 2
- [ ] Acceptance criterion 3

### Screenshots / Logs

<!-- If applicable, add screenshots or paste logs -->

```
Paste relevant logs here
```

### Notes

<!-- Any additional information reviewers should know -->

- **Migrations**: YES/NO - `npm run migrate` required?
- **Secrets/Env updated**: YES/NO
- **Breaking changes**: YES/NO
- **CI logs**: <paste link or attach screenshot>

### Checklist

- [ ] Code compiles without errors
- [ ] All tests pass locally
- [ ] No secrets in commit history
- [ ] Docker Compose runs successfully
- [ ] CI passes (or will pass after merge)
- [ ] Documentation updated (if needed)
- [ ] Migration notes added (if applicable)

### Reviewer

@hossam-create
