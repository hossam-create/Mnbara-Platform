# IDE Setup Guide

This guide provides setup instructions for various IDEs and editors to work with the Mnbara Platform monorepo.

## VS Code (Recommended)

### Installation

1. **Download VS Code**
   - Visit https://code.visualstudio.com/
   - Download and install for your OS

2. **Open the Workspace**
   ```bash
   code .
   ```

### Recommended Extensions

Install these extensions from the VS Code marketplace:

1. **Prettier - Code formatter**
   - ID: `esbenp.prettier-vscode`
   - Provides automatic code formatting

2. **ESLint**
   - ID: `dbaeumer.vscode-eslint`
   - Provides linting and code quality checks

3. **Nx Console**
   - ID: `nrwl.nx-console`
   - Provides UI for Nx commands

4. **TypeScript Vue Plugin**
   - ID: `Vue.vscode-typescript-vue-plugin`
   - Provides TypeScript support for Vue files

5. **GitLens**
   - ID: `eamodio.gitlens`
   - Provides Git integration and blame information

6. **Docker**
   - ID: `ms-azuretools.vscode-docker`
   - Provides Docker support

7. **Remote - Containers**
   - ID: `ms-vscode-remote.remote-containers`
   - Allows development in Docker containers

8. **Remote - SSH**
   - ID: `ms-vscode-remote.remote-ssh`
   - Allows remote development over SSH

### Automatic Setup

The workspace includes pre-configured settings:

- **Settings:** `.vscode/settings.json`
  - Auto-formatting on save
  - ESLint auto-fix on save
  - TypeScript strict mode
  - Path aliases configured

- **Debug Configurations:** `.vscode/launch.json`
  - Pre-configured debug targets for each service
  - Press F5 to start debugging

- **Tasks:** `.vscode/tasks.json`
  - Pre-configured build, test, and lint tasks
  - Access via Ctrl+Shift+B (build) or Ctrl+Shift+P (tasks)

### Manual Configuration

If extensions don't auto-install:

1. **Open Extensions Panel**
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (macOS)

2. **Search and Install**
   - Search for each extension ID above
   - Click "Install"

3. **Reload Window**
   - Press `Ctrl+Shift+P` and type "Reload Window"

### Keyboard Shortcuts

- **Format Document:** `Shift+Alt+F`
- **Format Selection:** `Ctrl+K Ctrl+F`
- **Quick Fix:** `Ctrl+.`
- **Go to Definition:** `F12`
- **Find References:** `Shift+F12`
- **Rename Symbol:** `F2`
- **Debug:** `F5`
- **Stop Debugging:** `Shift+F5`
- **Toggle Breakpoint:** `F9`

### Debugging

1. **Set Breakpoints**
   - Click on the line number to set a breakpoint

2. **Start Debugging**
   - Press F5 or go to Run → Start Debugging
   - Select the service to debug

3. **Debug Controls**
   - Continue: F5
   - Step Over: F10
   - Step Into: F11
   - Step Out: Shift+F11

### Workspace Settings

The workspace is configured with:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## WebStorm / IntelliJ IDEA

### Setup

1. **Open Project**
   - File → Open → Select project root

2. **Configure Node.js**
   - Settings → Languages & Frameworks → Node.js and NPM
   - Set Node interpreter to your Node.js installation

3. **Enable TypeScript**
   - Settings → Languages & Frameworks → TypeScript
   - Set TypeScript language service version to "Bundled"

4. **Configure ESLint**
   - Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint
   - Enable ESLint
   - Set configuration file to `.eslintrc.json`

5. **Configure Prettier**
   - Settings → Languages & Frameworks → JavaScript → Prettier
   - Enable Prettier
   - Set configuration file to `.prettierrc`

### Running Commands

1. **Open Terminal**
   - View → Tool Windows → Terminal

2. **Run npm scripts**
   ```bash
   npm run build
   npm run test
   npm run dev
   ```

3. **Run Nx commands**
   ```bash
   nx build @mnbara/types
   nx test @mnbara/utils
   ```

### Debugging

1. **Create Run Configuration**
   - Run → Edit Configurations
   - Click "+" and select "Node.js"
   - Set JavaScript file to service entry point

2. **Start Debugging**
   - Run → Debug (Shift+F9)

## Vim / Neovim

### Setup

1. **Install LSP Client**
   ```bash
   # For vim-lsp
   git clone https://github.com/prabirshrestha/vim-lsp ~/.vim/pack/plugins/start/vim-lsp
   ```

2. **Configure TypeScript Support**
   ```vim
   " Add to ~/.vimrc or ~/.config/nvim/init.vim
   if executable('typescript-language-server')
     au User lsp_setup call lsp#register_server({
       \ 'name': 'typescript',
       \ 'cmd': {server_info -> ['typescript-language-server', '--stdio']},
       \ 'root_uri': {server_info -> lsp#utils#path_to_uri(lsp#utils#find_nearest_parent_file_or_folder(expand('%:p:h'), 'tsconfig.json'))},
       \ 'whitelist': ['typescript', 'typescript.tsx'],
       \ })
   endif
   ```

3. **Install Prettier Plugin**
   ```bash
   npm install -g prettier
   ```

### Running Commands

Use terminal mode:
```bash
:!npm run build
:!npm run test
:!npm run dev
```

## Sublime Text

### Setup

1. **Install Package Control**
   - Visit https://packagecontrol.io/installation

2. **Install Packages**
   - Press Ctrl+Shift+P (Windows/Linux) or Cmd+Shift+P (macOS)
   - Type "Package Control: Install Package"
   - Install:
     - TypeScript
     - Prettier
     - ESLint
     - Babel

3. **Configure Settings**
   - Preferences → Settings
   - Add:
   ```json
   {
     "typescript_tsdk": "node_modules/typescript/lib",
     "prettier_on_save": true,
     "eslint_on_save": true
   }
   ```

### Running Commands

1. **Open Terminal**
   - Tools → Build System → New Build System
   - Create custom build system for npm scripts

2. **Run Commands**
   - Tools → Build (Ctrl+B)

## Atom

### Setup

1. **Install Packages**
   - Edit → Preferences → Install
   - Search and install:
     - atom-typescript
     - prettier-atom
     - linter-eslint
     - atom-ide-ui

2. **Configure Settings**
   - Edit → Preferences → Settings
   - Enable "Format on Save" for Prettier

### Running Commands

1. **Open Terminal**
   - Packages → Platformio-IDE Terminal → New Terminal

2. **Run Commands**
   ```bash
   npm run build
   npm run test
   npm run dev
   ```

## Emacs

### Setup

1. **Install LSP Mode**
   ```elisp
   (use-package lsp-mode
     :ensure t
     :commands lsp)
   ```

2. **Configure TypeScript**
   ```elisp
   (use-package typescript-mode
     :ensure t
     :mode "\\.ts\\'"
     :hook (typescript-mode . lsp))
   ```

3. **Install Prettier**
   ```bash
   npm install -g prettier
   ```

### Running Commands

Use shell mode:
```bash
M-x shell
npm run build
npm run test
npm run dev
```

## General Tips for All IDEs

### 1. Install Global Tools

```bash
npm install -g nx
npm install -g prettier
npm install -g eslint
npm install -g typescript
```

### 2. Configure Path Aliases

Most IDEs should automatically recognize TypeScript path aliases from `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@mnbara/*": ["packages/*"]
    }
  }
}
```

### 3. Enable Strict Mode

Ensure TypeScript strict mode is enabled:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### 4. Configure Formatting

All IDEs should use Prettier for formatting:

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5"
}
```

### 5. Enable Linting

All IDEs should use ESLint for code quality:

```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "no-debugger": "warn"
  }
}
```

## Troubleshooting

### TypeScript Errors Not Showing

1. Restart the IDE
2. Clear cache: `rm -rf node_modules/.cache`
3. Reinstall dependencies: `npm install`

### Prettier Not Formatting

1. Check if Prettier is installed: `npm list prettier`
2. Verify `.prettierrc` exists
3. Restart the IDE

### ESLint Not Working

1. Check if ESLint is installed: `npm list eslint`
2. Verify `.eslintrc.json` exists
3. Run `npm run lint` to check for errors

### Debugger Not Stopping at Breakpoints

1. Ensure source maps are enabled
2. Check that the correct file is being debugged
3. Restart the debugger

## Next Steps

- Read [DEVELOPMENT_SETUP.md](../DEVELOPMENT_SETUP.md) for environment setup
- Check [DEVELOPMENT_SCRIPTS.md](./DEVELOPMENT_SCRIPTS.md) for available commands
- Review [Architecture Guide](./architecture/NEW_STRUCTURE.md) for project structure

---

**Last Updated:** March 2, 2026  
**Version:** 1.0
