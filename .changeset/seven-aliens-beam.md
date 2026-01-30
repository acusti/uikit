---
'@acusti/date-picker': minor
'@acusti/uikit-docs': patch
---

**Breaking:** DatePicker now uncontrolled with
`defaultDateStart`/`defaultDateEnd` props

- **Renamed props:**: `dateStart` → `defaultDateStart`, `dateEnd` →
  `defaultDateEnd`
- **Behavior change:**: DatePicker is now fully uncontrolled - props only
  set initial values, not ongoing state
- **Reset pattern:**: To reset the picker’s state, change the component’s
  `key` prop instead of updating date props
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

This change resolves ` react-hooks/set-state-in-effect` ESLint errors and
follows React conventions for uncontrolled components.
