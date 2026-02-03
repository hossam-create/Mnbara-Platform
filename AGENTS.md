# Mnbara Platform - AI Agent Skills

This file contains skills for AI coding agents working on the Mnbara platform.

---

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When you need guidance on specific tasks in the Mnbara platform, check if any of the available skills below can help.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
- The skill content will load with detailed instructions
- Base directory provided in output for resolving bundled resources

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Skills provide progressive disclosure - load only when needed
</usage>

<available_skills>

<skill>
<name>mnbara-backend-setup</name>
<description>Complete guide for setting up and working with Mnbara backend services (microservices architecture, Prisma, TypeScript). Load when creating new services, working with databases, or understanding the backend structure.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>

---

## Quick Reference

### Load a Skill
```bash
npx openskills read mnbara-backend-setup
```

### Install Additional Skills
```bash
# Install Anthropic's official skills
npx openskills install anthropics/skills

# Update AGENTS.md
npx openskills sync
```

### List Installed Skills
```bash
npx openskills list
```

---

## Project-Specific Skills

### mnbara-backend-setup
Complete guide for backend development including:
- Microservices architecture
- Creating new services
- Prisma database setup
- TypeScript patterns
- Testing strategies
- Port allocation
- Best practices

**When to use**: Creating new backend services, working with databases, understanding the architecture.

---

## External Skills (Optional)

You can install additional skills from Anthropic's marketplace:

```bash
npx openskills install anthropics/skills
```

This includes skills for:
- PDF manipulation
- Git workflows
- Data analysis
- And more...

---

## Creating Custom Skills

To create a new skill for Mnbara:

1. Create directory: `.claude/skills/my-skill/`
2. Create `SKILL.md` with frontmatter:
   ```markdown
   ---
   name: my-skill
   description: When to use this skill
   ---
   
   # My Skill Instructions
   ...
   ```
3. Run `npx openskills sync` to update this file

---

**Last Updated**: 2 فبراير 2026  
**OpenSkills Version**: Compatible with Anthropic Agent Skills specification
