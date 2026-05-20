---
name: Kinetic Workflow
colors:
  surface: '#faf8ff'
  surface-dim: '#d9d9e5'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3fe'
  surface-container: '#ededf9'
  surface-container-high: '#e7e7f3'
  surface-container-highest: '#e1e2ed'
  on-surface: '#191b23'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3039'
  inverse-on-surface: '#f0f0fb'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#943700'
  on-tertiary: '#ffffff'
  tertiary-container: '#bc4800'
  on-tertiary-container: '#ffede6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb596'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7d2d00'
  background: '#faf8ff'
  on-background: '#191b23'
  surface-variant: '#e1e2ed'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  container-max: 1280px
  gutter: 1.5rem
---

## Brand & Style

The brand personality is **precise, transparent, and efficient**. Designed for high-stakes workflow tracking, it adopts an **Enterprise-Lite Minimalism** aesthetic. The goal is to reduce cognitive load by removing unnecessary visual noise, focusing instead on data clarity and functional status-driven navigation.

The design system utilizes heavy whitespace to separate distinct workstreams and subtle borders to define information architecture without overwhelming the user. It avoids heavy gradients or shadows, opting instead for a flat, layered approach that feels fast and responsive.

**Key Principles:**
- **Clarity over Decoration:** Every visual element must serve a functional purpose.
- **Status-First Navigation:** Use color purposefully to indicate where a task sits in the lifecycle.
- **Density Control:** Maintain high legibility in data-heavy views through generous line heights and systematic padding.

## Colors

The palette is anchored by a **Slate/Gray neutral base** to provide a professional, calm environment. Color is used sparingly and semantically to denote the lifecycle of a workflow item.

- **Primary (Blue):** Used for "Submitted" states and primary calls to action.
- **Attention (Amber):** Reserved for "Under Review" to signal ongoing internal processes.
- **Interaction (Indigo):** Used for "Needs More Information" to prompt user intervention.
- **Success (Emerald):** Final "Approved" states.
- **Danger (Rose):** Final "Rejected" states or destructive actions.

Surface backgrounds use `neutral_base` to differentiate the application canvas from white card-based content containers.

## Typography

The design system utilizes **Inter** for its exceptional legibility in digital interfaces and technical environments. The type scale is optimized for high-density data viewing, particularly within TanStack Table implementations.

- **Headlines:** Use tighter letter spacing and heavier weights to provide clear section anchoring.
- **Body:** Standardized at 16px for primary reading, with 14px reserved for secondary metadata and table rows.
- **Labels:** Use `label-sm` with uppercase styling for table headers and small status indicators to differentiate them from interactive text.

## Layout & Spacing

This design system uses a **Fluid Grid** model with a 12-column structure for dashboard views. It relies on a consistent 4px baseline shift to ensure all elements align to a predictable rhythm.

**Breakpoints:**
- **Desktop (1280px+):** 12 columns, 24px margins.
- **Tablet (768px - 1279px):** 8 columns, 20px margins.
- **Mobile (Up to 767px):** 4 columns, 16px margins.

For TanStack Table layouts, horizontal padding within cells is kept to `sm` (8px) to maximize data density, while vertical padding is `md` (16px) to maintain touch targets and readability.

## Elevation & Depth

This system avoids traditional shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**. 

- **Surface Level 0:** The application background (Slate-50).
- **Surface Level 1:** Primary content containers and cards. These use a white background with a 1px border (Slate-200).
- **Surface Level 2:** Overlays, Modals, and Popovers. These use a white background with a very soft, diffused ambient shadow (0px 10px 15px -3px rgba(0,0,0,0.05)) to suggest separation from the workflow canvas.

Depth is primarily communicated through border-bottoms in lists and subtle background-color shifts on hover states rather than physical elevation.

## Shapes

The shape language is **Soft and Professional**. A consistent 0.25rem (4px) radius is applied to standard components like buttons, input fields, and small cards to maintain a precise, engineered feel. 

Large containers (main dashboard panels) may use `rounded-lg` (8px) to provide a slightly softer framing for the entire application, but inner functional elements remain sharp and efficient.

## Components

### Status Badges
High-contrast indicators using a light background tint and bold text color corresponding to the status color palette. Padding: `2px 8px`. Typography: `label-sm`.

### Buttons
- **Primary:** Solid Blue-600 background, White text.
- **Secondary:** White background, Slate-200 border, Slate-700 text.
- **Ghost:** Transparent background, Slate-600 text, Slate-100 background on hover.

### Form Inputs
Minimalist styling with a 1px Slate-200 border. On focus, the border transitions to Blue-500 with a 2px outer "halo" of Blue-50.

### TanStack Tables
- **Header:** `label-sm` with Slate-500 text and Slate-100 background.
- **Rows:** White background with a 1px Slate-100 border-bottom.
- **Hover State:** Slate-50 background for the entire row to indicate interactivity.

### Workflow Cards
Used for summary views. These feature a 1px border, `md` padding, and a colored left-accent bar (4px width) that matches the current workflow status.