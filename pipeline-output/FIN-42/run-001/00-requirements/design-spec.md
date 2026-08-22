# Design Spec — FIN-42: Login Screen (Screen 1)

_Extracted from Jira attachment screenshot (authoritative source — Figma API rate-limited)_

---

## Screen: LoginScreen

### Layout Structure (top → bottom)

1. **Hero Image** — full-width image occupying top ~45% of screen
   - Asset: `src/assets/images/hero-image.png`
   - Two businessmen shaking hands, blurred blue tones
   - No border radius, spans edge-to-edge

2. **Logo Badge** — overlapping hero/content boundary (left-aligned)
   - Asset: `src/assets/icons/gen_ai_bank_gradient.svg`
   - Pill shape with gradient background (left: #1565C0 → right: #B934A3)
   - White building icon + "GEN AI BANK" text in white uppercase
   - Positioned ~16px from left edge, floating over the transition between hero and content

3. **Welcome Heading**
   - Text: `"Welcome"`
   - Size: ~36sp, font-weight: bold (700)
   - Color: #1A1A1A (near black)
   - Margin-top: ~32px from logo badge

4. **Subtitle**
   - Text: `"Log in to continue to your banking application"`
   - Size: ~16sp, font-weight: normal (400)
   - Color: #757575 (secondary text)
   - Wraps to 2 lines

5. **Form Card** (white, rounded-corners, elevated shadow)
   - Background: #FFFFFF
   - Border-radius: 16px
   - Padding: 16px
   - Elevation/shadow: subtle card shadow
   - Margin: 16px horizontal

   ### Card Contents:

   **5a. User Type Selector Row** — 2 equal-width buttons side by side
   - **Customer Option**:
     - Icon: `AccountCircleFilled.svg` (person, blue #1976D2, 32x32)
     - Label: `"Customer"`
     - Selected state: border #1A73E8 (2px), background white
     - Unselected state: border #BDBDBD (1px), background white
   - **Bank Staff Option**:
     - Icon: `WorkFilled.svg` (briefcase, blue #1976D2, 32x32)
     - Label: `"Bank Staff"`
     - Same selected/unselected border logic
   - Row gap: 12px between options

   **5b. Mobile Number Field**
   - Floating label: `"* Mobile"` (required indicator asterisk)
   - Placeholder: `"Enter 10-digit mobile number"`
   - Left icon: `PhoneIphoneFilled.svg` (phone, 24x24, dark grey #757575)
   - Border style: outlined (border #BDBDBD, border-radius 8px, padding 12px)
   - Keyboard: numeric, max length: 10
   - Margin-top: 16px from selector row

   **5c. GET OTP Button**
   - Text: `"GET OTP"` (uppercase, letter-spacing)
   - Full width
   - Disabled state (gray): background #BDBDBD, text #FFFFFF
   - Active state (when 10-digit mobile entered): background #1A73E8, text #FFFFFF
   - Border-radius: 8px
   - Height: 48px
   - Margin-top: 16px

   **5d. AUTHENTICATE Button**
   - Text: `"AUTHENTICATE"` (uppercase, letter-spacing)
   - Full width
   - Disabled state (gray): background #BDBDBD, text #FFFFFF
   - Active state (when OTP entered): background #1A73E8, text #FFFFFF
   - Border-radius: 8px
   - Height: 48px
   - Margin-top: 8px

6. **Footer**
   - Text: `"© COPYRIGHT GEN AI BANK LTD. | "` + `"PRIVACY POLICY"` (link)
   - Font-size: 11sp, color: #757575
   - "PRIVACY POLICY" color: #1A73E8, underlined
   - Centered
   - Position: at bottom (either sticky bottom or below form card)

---

## Background Color

- Main content area background: #DCE8F7 (light blue tint)

## Font Notes

- All text uses system default (San Francisco on iOS, Roboto on Android)
- No custom fonts needed per design

## Interaction States

- **Customer selected (default)**: Customer button has blue border, Bank Staff has gray border
- **Mobile number empty**: Both buttons disabled (gray)
- **10-digit mobile entered**: GET OTP button activates (blue)
- **OTP field appears**: After tapping GET OTP, a 6-digit OTP field appears below (not visible in default state — shown in Screen 2)
- **OTP entered**: AUTHENTICATE button activates (blue)

## Assets Required (all exist in src/assets)

| Asset                    | Path                                      | Used For               |
| ------------------------ | ----------------------------------------- | ---------------------- |
| hero-image.png           | src/assets/images/hero-image.png          | Hero background image  |
| gen_ai_bank_gradient.svg | src/assets/icons/gen_ai_bank_gradient.svg | Logo badge             |
| AccountCircleFilled.svg  | src/assets/icons/AccountCircleFilled.svg  | Customer option icon   |
| WorkFilled.svg           | src/assets/icons/WorkFilled.svg           | Bank Staff option icon |
| PhoneIphoneFilled.svg    | src/assets/icons/PhoneIphoneFilled.svg    | Mobile field icon      |

_Note: react-native-svg must be installed to render SVG assets._
