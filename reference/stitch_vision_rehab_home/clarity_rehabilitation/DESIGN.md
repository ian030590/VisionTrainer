---
name: Clarity Rehabilitation
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#424752'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#727783'
  outline-variant: '#c2c6d4'
  surface-tint: '#005db6'
  primary: '#00478d'
  on-primary: '#ffffff'
  primary-container: '#005eb8'
  on-primary-container: '#c8daff'
  inverse-primary: '#a9c7ff'
  secondary: '#4a654e'
  on-secondary: '#ffffff'
  secondary-container: '#c9e8cb'
  on-secondary-container: '#4e6952'
  tertiary: '#454848'
  on-tertiary: '#ffffff'
  tertiary-container: '#5d6060'
  on-tertiary-container: '#d8dbda'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468c'
  secondary-fixed: '#cceace'
  secondary-fixed-dim: '#b0ceb2'
  on-secondary-fixed: '#07200f'
  on-secondary-fixed-variant: '#334d38'
  tertiary-fixed: '#e1e3e2'
  tertiary-fixed-dim: '#c4c7c6'
  on-tertiary-fixed: '#191c1c'
  on-tertiary-fixed-variant: '#444747'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 48px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style

The design system centers on a "Human-Centric Clinical" aesthetic. It balances the precision of medical technology with the empathy required for visual rehabilitation. The target audience includes patients undergoing recovery, clinicians monitoring progress, and elderly users who require high legibility and low cognitive load.

The style is **Modern Minimalism** with a focus on **Tactile Accessibility**. It utilizes heavy whitespace to reduce visual noise, ensuring that the interface never overwhelms a user with impaired vision. The emotional response should be one of quiet confidence, safety, and clarity. While the general interface is soft and approachable, the core functional areas (assessment modules) transition into a high-utility, high-contrast mode to ensure clinical accuracy.

## Colors

The palette is anchored by **Medical Blue**, a professional and trustworthy hue that signals clinical excellence. This is softened by **Soft Sage**, used for supportive elements and success states to evoke a calming, organic feel. 

For general navigation and content:
- **Primary**: Medical Blue (#005EB8) for actions and brand presence.
- **Secondary**: Soft Sage (#8BA88E) for progress indicators and secondary buttons.
- **Background**: Warm Gray (#F2F4F3) to reduce screen glare compared to pure white.

**Constraint-Specific Palette:**
Assessment modules must override the brand palette. During testing phases, the UI must shift to a strict **High-Contrast Black and White** (#000000 and #FFFFFF) for all visual targets and stimuli to ensure zero chromatic aberration or interference during rehabilitation exercises.

## Typography

This design system uses **Inter** for its exceptional legibility and tall x-height, which is critical for users with low vision. 

**Key Rules:**
- **Size Floors**: Body text never drops below 18px to ensure readability.
- **Contrast**: Text color must always maintain a minimum 7:1 contrast ratio against backgrounds.
- **Weight**: Headlines use Semi-Bold (600) rather than Black to prevent "smudging" for users with astigmatism or light sensitivity.
- **Spacing**: Increased line-height (1.5x) is applied to all body text to prevent line-skipping during reading.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy on desktop to keep interaction points predictable. A 12-column grid is used with generous 24px gutters to create clear separation between content blocks.

**Adaptability:**
- **Mobile**: Switches to a single-column stack with 20px side margins. Interactive elements (buttons) expand to full-width to provide a larger tap target.
- **Desktop**: Content is centered within a 1280px container. 
- **White Space**: We utilize a "breathable" approach. Every major section is separated by at least 48px (stack-lg) to allow the eye to rest and find the next focal point easily.

## Elevation & Depth

To maintain a clean and medical feel, this design system avoids heavy, muddy shadows. 

- **Tonal Layering**: We use surface-on-surface depth. The main background is Warm Gray, while active cards and containers are Pure White.
- **Soft Ambient Shadows**: Where depth is required (e.g., a floating action card), we use a very diffused, low-opacity Medical Blue tint: `0px 4px 20px rgba(0, 94, 184, 0.08)`.
- **Active State**: Elevated elements should not "pop" aggressively. Instead, a subtle 2px stroke in Soft Sage is preferred over high-shadow lifts to indicate focus.

## Shapes

The shape language is consistently **Rounded**. This removes the "sharpness" often associated with clinical software, making the platform feel like a supportive tool rather than a cold diagnostic instrument.

- **Standard Elements**: Buttons and Input fields use a 0.5rem (8px) radius.
- **Containers**: Large cards and content areas use a 1rem (16px) radius to frame information softly.
- **Buttons**: Primary actions use the `rounded-lg` (1rem) setting to make them feel more "clickable" and tactile.

## Components

- **Buttons**: Must have a minimum height of 56px to ensure a large hit area. The primary button uses Medical Blue with White text. Secondary buttons use a Soft Sage outline.
- **Input Fields**: Borders are 2px thick for high visibility. Focus states must use a 3px Medical Blue outer glow to clearly indicate which field is active.
- **Cards**: Cards should never contain more than two distinct pieces of information to prevent visual clutter.
- **Progress Bars**: Used extensively for rehabilitation tracking. These utilize Soft Sage to indicate growth and health.
- **Assessment Targets**: Within the assessment module, targets must be sharp-edged geometric shapes (circles or squares) in pure White on a pure Black background, bypassing the standard "Rounded" shape rules of the general UI.
- **Instructional Chips**: Small, high-contrast labels used to categorize exercises, utilizing the Medical Blue background with bold white text.