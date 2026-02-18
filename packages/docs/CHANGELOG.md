# @acusti/uikit-docs

## 0.4.8

### Patch Changes

- Updated dependencies [6ec2fff]
    - @acusti/date-picker@0.16.0

## 0.4.7

### Patch Changes

- Updated dependencies [8a6fd7f]
    - @acusti/dropdown@0.54.0

## 0.4.6

### Patch Changes

- Updated dependencies [48c735b]
- Updated dependencies [f578799]
    - @acusti/dropdown@0.53.0

## 0.4.5

### Patch Changes

- Add support for `props.minHeight` for multi-line `InputText` elements to
  ensure that the textarea element is never resized shorter than that value
  and render `minHeight`/`maxHeight` as inline styles when using
  `field-sizing: content` to render auto-resizing textareas
- d72a772: **Breaking:** DatePicker now uncontrolled with
  `defaultDateStart`/`defaultDateEnd` props
    - **Renamed props:**: `dateStart` → `defaultDateStart`, `dateEnd` →
      `defaultDateEnd`
    - **Behavior change:**: DatePicker is now fully uncontrolled - props
      only set initial values, not ongoing state
    - **Reset pattern:**: To reset the picker’s state, change the
      component’s `key` prop instead of updating date props
    - **Migration:**
        - Replace `dateStart`/`dateEnd` with
          `defaultDateStart`/`defaultDateEnd`
        - Implement key-based reset for clearing selected dates
        - Remove any logic that updates date props to control the picker
          externally

    **Before:**

    ```tsx
    <DatePicker
        dateStart={selectedDate}
        dateEnd={endDate}
        onChange={handleChange}
    />
    ```

    **After:**

    ```tsx
    <DatePicker
        key={resetKey}
        defaultDateStart={selectedDate}
        defaultDateEnd={endDate}
        onChange={handleChange}
    />
    ```

    This change resolves ` react-hooks/set-state-in-effect` ESLint errors
    and follows React conventions for uncontrolled components.

- Updated dependencies
- Updated dependencies [d72a772]
    - @acusti/input-text@2.3.0
    - @acusti/date-picker@0.15.0

## 0.4.4

### Patch Changes

- Updated dependencies [1f2f96f]
    - @acusti/dropdown@0.52.0

## 0.4.3

### Patch Changes

- Updated dependencies [c7e0e28]
- Updated dependencies [dcb8377]
- Updated dependencies [0d6411e]
- Updated dependencies [7fd6663]
    - @acusti/dropdown@0.51.0
    - @acusti/input-text@2.2.1
    - @acusti/css-value-input@2.2.1

## 0.4.2

### Patch Changes

- Updated dependencies [316e8a3]
- Updated dependencies [b335084]
- Updated dependencies [571dbaa]
    - @acusti/date-picker@0.14.0

## 0.4.1

### Patch Changes

- Updated dependencies [d583745]
- Updated dependencies [91ebab9]
- Updated dependencies [5e1b41c]
- Updated dependencies [d3a2908]
    - @acusti/date-picker@0.13.0

## 0.4.0

### Minor Changes

- b587309: Update all React components to use the modern (v17+)
  [React JSX transform](https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)

### Patch Changes

- Updated dependencies [b587309]
    - @acusti/css-value-input@2.1.0
    - @acusti/date-picker@0.12.0
    - @acusti/input-text@2.1.0
    - @acusti/dropdown@0.50.0

## 0.3.3

### Patch Changes

- Updated dependencies [68cb4fb]
    - @acusti/dropdown@0.49.0

## 0.3.2

### Patch Changes

- Updated dependencies
    - @acusti/date-picker@0.11.1
    - @acusti/dropdown@0.48.1

## 0.3.1

### Patch Changes

- Updated dependencies [f87de22]
    - @acusti/dropdown@0.48.0

## 0.3.0

### Minor Changes

- e42f474: Use vite in library mode to build all packages and cleanup the
  build artifacts to only include required files. This means no more test
  files in the build and no more src/ directory.

### Patch Changes

- Updated dependencies [e42f474]
- Updated dependencies [d328a73]
    - @acusti/css-value-input@2.0.0
    - @acusti/date-picker@0.11.0
    - @acusti/dropdown@0.47.0
    - @acusti/input-text@2.0.0
    - @acusti/use-is-out-of-bounds@0.15.0
    - @acusti/use-keyboard-events@0.11.0

## 0.2.0

### Minor Changes

- Update all NPM and CI dependencies to latest, including eslint,
  typescript (v5.8.3), vitest, babel, and node-gyp, resolving all known
  security vulnerabilities, and adopt the eslint canonical plugin and
  enable new rules.
