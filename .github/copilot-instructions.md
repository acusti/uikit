# UIKit Monorepo Development Guide

UIKit is a TypeScript-based React component library and utilities monorepo containing 17+ packages including UI components, React hooks, AWS utilities, text processing tools, and more. The repository uses Yarn 4 with Plug'n'Play (PnP), Vite for building, Vitest for testing, and Storybook for documentation.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Critical Build & Test Timing Information

**NEVER CANCEL long-running commands.** All timing below includes 50% buffer for timeout recommendations:

- `yarn install`: ~4 seconds with cache, ~90 seconds fresh (TIMEOUT: 120 seconds)
- `yarn build`: ~57 seconds (TIMEOUT: 90 seconds) - **NEVER CANCEL**
- `yarn test`: ~10 seconds (TIMEOUT: 30 seconds)  
- `yarn lint`: ~16 seconds (TIMEOUT: 45 seconds)
- `yarn format`: ~3 seconds (TIMEOUT: 30 seconds)
- `yarn tsc`: ~26 seconds (TIMEOUT: 60 seconds)
- `yarn buildall`: Used for Storybook build and deployment to Netlify (~65 seconds then fails on storybook in sandboxed environments) - **DO NOT USE for development**

## Essential Setup & Development Commands

**Bootstrap the repository:**
```bash
# Repository uses Yarn 4+ with PnP
yarn install  # Fast with cache (~4s), slower fresh install (~90s)
# Always run build before starting development
yarn build    # NEVER CANCEL - takes ~57 seconds
```

**Development workflow:**
```bash
# Start Storybook development server for component testing
yarn dev     # Starts Storybook server on http://localhost:6006

# Alternative: make changes and test with:
yarn build  # NEVER CANCEL - takes ~57 seconds  
yarn test   # Takes ~10 seconds
yarn lint   # Takes ~16 seconds
```

**Run tests:**
```bash
yarn test        # Full test suite - takes ~10 seconds
yarn test:watch  # Watch mode for development
```

**Known test failures (EXPECTED):**
- 2 tests in `packages/post/src/index.test.ts` fail due to network dependency on `countries.trevorblades.com`
- These failures are NOT related to your changes and can be ignored

**Type checking:**
```bash
yarn tsc  # Takes ~26 seconds - EXPECT FAILURE in aws-signature-v4 package
```

**Known TypeScript issues (EXPECTED):**
- `packages/aws-signature-v4/src/index.ts` has type errors related to `Uint8Array<ArrayBufferLike>` - this is a known issue
- All other packages should type-check successfully

**Linting:**
```bash
yarn lint      # Takes ~16 seconds
yarn lintfix   # Auto-fix linting issues
yarn format    # Format code with Prettier
```

## Manual Validation Requirements

**After making changes, ALWAYS perform these validation steps:**

1. **Build validation:**
   ```bash
   yarn build  # NEVER CANCEL - must complete (~58 seconds)
   ```

2. **Test validation:**
   ```bash
   yarn test  # Expect 2 network failures, rest should pass
   ```

3. **Lint validation:**
   ```bash
   yarn lint  # Must pass with 0 errors (warnings OK)
   ```

4. **Component validation scenarios:**
   - If changing React components in `packages/*/src/`, run the component's specific test file
   - For UI components (dropdown, input-text, css-value-input, date-picker), verify the test suite passes
   - For hooks (use-keyboard-events, use-is-out-of-bounds, use-bounding-client-rect), test via Storybook stories using `yarn dev`

## Repository Structure & Key Locations

**Package organization:**
```
packages/
├── UI Components:
│   ├── dropdown/           # Dropdown component with positioning
│   ├── input-text/         # Uncontrolled text input
│   ├── css-value-input/    # CSS value input with validation
│   └── date-picker/        # Date picker with range support
├── React Hooks:
│   ├── use-keyboard-events/      # Key event listeners
│   ├── use-is-out-of-bounds/     # Element boundary detection
│   └── use-bounding-client-rect/ # Element dimensions
├── Utilities:
│   ├── parsing/            # JSON parsing with error tolerance
│   ├── textual/            # Text transformation utilities
│   ├── matchmaking/        # Fuzzy string matching
│   ├── uniquify/           # String uniqueness utility
│   └── styling/            # CSS-in-JS utilities
├── AWS/Network:
│   ├── appsync-fetch/      # AWS AppSync GraphQL client
│   ├── aws-signature-v4/   # AWS SigV4 signing (HAS TYPE ERRORS)
│   └── post/               # GraphQL request utility
└── docs/                   # Storybook documentation (CURRENTLY BROKEN)
```

**Configuration files:**
- `package.json` - Root workspace configuration with scripts
- `vite.config.base.js` - Shared Vite build configuration
- `tsconfig.json` - TypeScript project references
- `eslint.config.js` - ESLint flat config with React rules
- `.yarnrc.yml` - Yarn PnP configuration

## Known Issues & Workarounds

**Storybook development server:**
- `yarn dev` starts Storybook server for component testing and development
- May experience module resolution issues in sandboxed environments
- **Workaround:** Use `yarn build && yarn test` for validation in constrained environments

**Build warnings you can ignore:**
- TypeScript version compatibility warnings from eslint plugins
- React package detection warnings in eslint
- One React Hooks warning in `packages/input-text/src/InputText.tsx`

**Network-dependent tests:**
- 2 tests in `packages/post/` fail when external API is unreachable
- These are expected failures in sandboxed environments

## Common Validation Patterns

**When adding new packages:**
1. Add to `tsconfig.json` references array
2. Add workspace dependency in consuming packages
3. Run `yarn build` to verify topological build order
4. Add tests and verify with `yarn test`

**When modifying React components:**
1. Build: `yarn build` (NEVER CANCEL - ~58 seconds)
2. Test: `yarn test` - component tests should pass
3. Lint: `yarn lint` - must have 0 errors
4. Manual test: Run `yarn dev` to start Storybook and test components via their stories (add stories when fixing bugs or changing behavior)

**When working with TypeScript:**
- Run `yarn tsc` but expect aws-signature-v4 to fail (known issue)
- Focus on your package's type checking success
- Use `yarn workspace @acusti/{package-name} run tsc` for individual packages

**Before committing:**
```bash
yarn build  # NEVER CANCEL - takes ~57 seconds
yarn test   # Expect 2 network failures
yarn lint   # Must pass
yarn format # Format all files (~3 seconds)
```

## Package Manager Details

**Yarn PnP specifics:**
- Uses `.pnp.cjs` and `.pnp.loader.mjs` for module resolution
- Dependencies are cached in `.yarn/cache/`
- No `node_modules` folder - everything resolved through PnP
- Very fast installs (~4 seconds) due to zero-install approach

**Workspace commands:**
```bash
# Run command in specific package
yarn workspace @acusti/{package-name} {command}

# Run command in all packages
yarn workspaces foreach {command}

# Build excluding docs (default)
yarn build

# Build including docs for Netlify deployment (may fail in sandboxed environments)
# yarn buildall  # Used for Storybook build and deployment to Netlify
```

## Troubleshooting

**If yarn install fails:**
- Check Node.js version (requires >=20)
- Clear `.yarn/cache/` and retry
- Verify `.yarnrc.yml` and `.pnp.cjs` are present

**If build fails:**
- Run `yarn tsc` to see TypeScript errors
- Check individual package builds: `yarn workspace @acusti/{pkg} run build`
- Known failure in aws-signature-v4 is expected

**If tests fail beyond the 2 network errors:**
- Run individual package tests: `yarn workspace @acusti/{pkg} run test`
- Check for React testing library setup in affected packages
- Verify test files end with `.test.ts` or `.test.tsx`

**Validation checklist for changes:**
- [ ] `yarn build` completes successfully (NEVER CANCEL - ~57 seconds)
- [ ] `yarn test` passes (ignore 2 network failures)
- [ ] `yarn lint` shows 0 errors (warnings acceptable)
- [ ] `yarn format` completes successfully
- [ ] Manual testing of affected functionality
- [ ] TypeScript compilation succeeds for your packages