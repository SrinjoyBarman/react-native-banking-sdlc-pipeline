# Architecture Diagrams — FIN-42 Login Screen

**Gate:** SDLC_G1.5_DIAGRAM  
**Feature:** Dummy Login Screen (OTP-based authentication)  
**Module:** `src/auth/`  
**Generated:** 2026-07-17  
**Status:** PASSED

---

## 1. Component Hierarchy Diagram

Shows the full component tree, co-located hook, and module ownership for the LoginScreen feature.

```mermaid
graph TD
    subgraph "App Entry"
        A["App.tsx\n(root navigator host)"]
    end

    subgraph "auth module — Navigation"
        B["AuthNavigator.tsx\n(@react-navigation/native-stack)"]
    end

    subgraph "auth module — Screen"
        C["LoginScreen.tsx\n(pure rendering shell)\nReact.FC&lt;LoginScreenProps&gt;"]
        H["useLoginScreen.ts\n(all screen logic)"]
    end

    subgraph "LoginScreen — UI Atoms"
        D1["RoleSelectorRow\n(Customer / Staff toggle)"]
        D2["MobileNumberInput\nkeyboardType=numeric, maxLength=10"]
        D3["GetOtpButton\ndisabled when mobile &lt; 10 digits"]
        D4["OtpInput\nconditional: otpRequested === true"]
        D5["AuthenticateButton\ndisabled when OTP empty"]
        D6["InlineErrorMessage\nrendered when authError !== null"]
        D7["HeroImage + LogoBadge\n(react-native-svg)"]
        D8["Footer / PrivacyPolicyLink"]
    end

    subgraph "core module — Analytics"
        E["analytics.ts\n(screen + action events)"]
        E1["SCREEN_EVENTS.LOGIN\nACTION_EVENTS.OTP_ATTEMPTED\nACTION_EVENTS.LOGIN_ATTEMPTED"]
    end

    subgraph "auth module — State Layer"
        F["authSlice.ts\n(Redux slice)\notpStatus / authStatus\notpRequested / error"]
        F1["authSelectors.ts\nselectOtpStatus\nselectAuthStatus\nselectOtpRequested\nselectAuthError"]
    end

    subgraph "auth module — Async Layer"
        G["authSaga.ts\nwatchRequestOtp → takeLatest\nwatchAuthenticate → takeLatest"]
    end

    subgraph "auth module — Service Layer"
        S["authService.ts\nrequestOtp()\nauthenticate()"]
        S1["__mocks__/authService.ts\njest.fn() handles"]
    end

    subgraph "core module — HTTP"
        API["ApiService (mock)\ngetApiService()"]
    end

    subgraph "store module — Root"
        STORE["store.ts\nrootReducer: { auth: authReducer }\nrootSaga: fork(authSaga)"]
    end

    A --> B
    B --> C
    C --> H
    C --> D1
    C --> D2
    C --> D3
    C --> D4
    C --> D5
    C --> D6
    C --> D7
    C --> D8
    H --> E
    E --> E1
    H --> F1
    F1 --> F
    H -.->|dispatches actions| F
    F --> STORE
    G --> STORE
    G --> S
    S --> API
    S1 -.->|test replacement| S

    style A fill:#e3f2fd,stroke:#1565c0
    style B fill:#e3f2fd,stroke:#1565c0
    style C fill:#f3e5f5,stroke:#7b1fa2
    style H fill:#f3e5f5,stroke:#7b1fa2
    style F fill:#e8f5e9,stroke:#2e7d32
    style G fill:#fff3e0,stroke:#e65100
    style S fill:#fce4ec,stroke:#c62828
    style API fill:#fce4ec,stroke:#c62828
    style STORE fill:#e8f5e9,stroke:#2e7d32
```

---

## 2. Redux Data Flow Diagram

Shows how state flows from user interaction through the mandatory chain and back to the UI.

```mermaid
flowchart LR
    subgraph UI["UI Layer (LoginScreen + useLoginScreen)"]
        UF["useRef: mobileNumber\nuseRef: otp\nselectedRole: state"]
        DISP1["dispatch(requestOtpStart)\n{mobileNumber, role}"]
        DISP2["dispatch(authenticateStart)\n{mobileNumber, otp, role}"]
        SEL["Selectors\nselectOtpStatus\nselectAuthStatus\nselectOtpRequested\nselectAuthError"]
    end

    subgraph REDUX["Redux Store — auth slice"]
        SLICE["authSlice\n──────────────\notpStatus: idle|loading|success|error\nauthStatus: idle|loading|success|error\notpRequested: boolean\nerror: string | null"]
        subgraph ACTIONS["Actions"]
            A1["requestOtpStart\nrequestOtpSuccess\nrequestOtpFailure"]
            A2["authenticateStart\nauthenticateSuccess\nauthenticateFailure\nresetAuthState"]
        end
    end

    subgraph SAGA["Saga Layer"]
        W1["watchRequestOtp\ntakeLatest(REQUEST_OTP)"]
        W2["watchAuthenticate\ntakeLatest(AUTHENTICATE)"]
        WK1["requestOtpWorker"]
        WK2["authenticateWorker"]
    end

    subgraph SERVICE["Service Layer"]
        SVC1["authService.requestOtp()\nRequestOtpRequest → RequestOtpResponse"]
        SVC2["authService.authenticate()\nAuthenticateRequest → AuthenticateResponse"]
    end

    subgraph HTTP["HTTP Layer"]
        API["ApiService (mock)\ngetApiService()\nresolves mock data"]
    end

    UF --> DISP1
    UF --> DISP2
    DISP1 -->|"dispatched to store"| SLICE
    DISP2 -->|"dispatched to store"| SLICE
    SLICE --> A1
    SLICE --> A2
    A1 -->|"saga intercepts"| W1
    A2 -->|"saga intercepts"| W2
    W1 --> WK1
    W2 --> WK2
    WK1 -->|"call()"| SVC1
    WK2 -->|"call()"| SVC2
    SVC1 -->|"getApiService()"| API
    SVC2 -->|"getApiService()"| API
    API -->|"mock resolved Promise"| SVC1
    API -->|"mock resolved Promise"| SVC2
    SVC1 -->|"success: put(requestOtpSuccess)\nfailure: put(requestOtpFailure)"| SLICE
    SVC2 -->|"success: put(authenticateSuccess)\n+ put(resetAuthState)\nfailure: put(authenticateFailure)"| SLICE
    SLICE -->|"state update triggers re-render"| SEL
    SEL -->|"derived flags to hook"| UF

    style UI fill:#f3e5f5,stroke:#7b1fa2
    style REDUX fill:#e8f5e9,stroke:#2e7d32
    style SAGA fill:#fff3e0,stroke:#e65100
    style SERVICE fill:#fce4ec,stroke:#c62828
    style HTTP fill:#e3f2fd,stroke:#1565c0
```

**State transition table:**

| User Action        | Dispatched Action                        | `otpStatus` | `authStatus` | `otpRequested` |
| ------------------ | ---------------------------------------- | ----------- | ------------ | -------------- |
| Tap "GET OTP"      | `requestOtpStart`                        | `loading`   | `idle`       | `false`        |
| Saga: OTP success  | `requestOtpSuccess`                      | `success`   | `idle`       | **`true`**     |
| Saga: OTP failure  | `requestOtpFailure`                      | `error`     | `idle`       | `false`        |
| Tap "AUTHENTICATE" | `authenticateStart`                      | `success`   | `loading`    | `true`         |
| Saga: auth success | `authenticateSuccess` → `resetAuthState` | `idle`      | `idle`       | `false`        |
| Saga: auth failure | `authenticateFailure`                    | `success`   | `error`      | `true`         |

---

## 3. Sequence Diagram — OTP Login Flow

Full end-to-end sequence from user interaction to authenticated state.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant LS as LoginScreen.tsx
    participant Hook as useLoginScreen.ts
    participant Analytics as analytics.ts
    participant Store as Redux Store
    participant Saga as authSaga.ts
    participant Svc as authService.ts
    participant API as ApiService (mock)
    participant Nav as React Navigation

    Note over User, Nav: Phase 1 — Screen Mount

    User ->> LS: App renders LoginScreen
    LS ->> Hook: useLoginScreen()
    Hook ->> Analytics: analytics.screen(SCREEN_EVENTS.LOGIN)
    Hook ->> Store: useSelector(selectOtpStatus, selectOtpRequested, selectAuthError)
    Store -->> Hook: { otpStatus:'idle', otpRequested:false, authError:null }
    Hook -->> LS: { isGetOtpEnabled:false, otpRequested:false, ... }
    LS -->> User: Renders role selector + mobile input (OTP field hidden)

    Note over User, Nav: Phase 2 — Request OTP

    User ->> LS: Selects role (Customer/Staff)
    LS ->> Hook: handleRoleChange('customer')
    Hook ->> Hook: selectedRole = 'customer' [local state]

    User ->> LS: Types 10-digit mobile number
    LS ->> Hook: handleMobileChange('9876543210')
    Hook ->> Hook: mobileRef.current = '9876543210'\n[strips non-numeric, truncates to 10]
    Hook -->> LS: isGetOtpEnabled = true (re-render)
    LS -->> User: GET OTP button becomes active (blue)

    User ->> LS: Taps "GET OTP"
    LS ->> Hook: handleGetOtp()
    Hook ->> Analytics: analytics.track(ACTION_EVENTS.OTP_ATTEMPTED)
    Hook ->> Store: dispatch(requestOtpStart({ mobileNumber, role }))
    Store -->> Hook: otpStatus = 'loading'
    Hook -->> LS: isOtpLoading = true
    LS -->> User: GET OTP button shows spinner

    Store ->> Saga: watchRequestOtp — takeLatest(REQUEST_OTP)
    Saga ->> Svc: call(authService.requestOtp, { mobileNumber:'9876543210', role:'customer' })
    Svc ->> API: getApiService().post('/auth/otp', payload)
    API -->> Svc: mock resolved → { success:true, maskedMobile:'98*****210' }
    Svc -->> Saga: RequestOtpResponse

    Saga ->> Store: put(requestOtpSuccess())
    Store -->> Hook: otpStatus='success', otpRequested=true
    Hook -->> LS: isOtpLoading=false, otpRequested=true
    LS -->> User: OTP input field appears, GET OTP button re-enabled

    Note over User, Nav: Phase 3 — Authenticate with OTP

    User ->> LS: Enters 6-digit OTP
    LS ->> Hook: handleOtpChange('847291')
    Hook ->> Hook: otpRef.current = '847291' [never in Redux]
    Hook -->> LS: isAuthenticateEnabled = true
    LS -->> User: AUTHENTICATE button becomes active (blue)

    User ->> LS: Taps "AUTHENTICATE"
    LS ->> Hook: handleAuthenticate()
    Hook ->> Analytics: analytics.track(ACTION_EVENTS.LOGIN_ATTEMPTED)
    Hook ->> Store: dispatch(authenticateStart({ mobileNumber, otp, role }))
    Store -->> Hook: authStatus = 'loading'
    Hook -->> LS: isAuthLoading = true
    LS -->> User: AUTHENTICATE button shows spinner

    Store ->> Saga: watchAuthenticate — takeLatest(AUTHENTICATE)
    Saga ->> Svc: call(authService.authenticate, { mobileNumber, otp:'847291', role })
    Svc ->> API: getApiService().post('/auth/verify', payload)
    API -->> Svc: mock resolved → { success:true, token:'mock-jwt-token' }
    Svc -->> Saga: AuthenticateResponse

    Saga ->> Store: put(authenticateSuccess())
    Store -->> Hook: authStatus = 'success'

    Hook ->> Store: dispatch(resetAuthState())
    Note right of Hook: Clears sensitive in-flight state (REQ-014)\nClear mobileRef and otpRef
    Store -->> Hook: All statuses reset to 'idle', otpRequested=false

    Hook ->> Nav: navigation.navigate('Dashboard')
    Nav -->> User: Dashboard placeholder screen rendered

    Note over User, Nav: Phase 4 — Error Path (alternate)

    Note over Saga, API: If authService throws / mock returns failure:
    Saga ->> Store: put(authenticateFailure({ message: 'Authentication failed' }))
    Note right of Saga: Error message sanitised — no mobile/OTP in payload (REQ-014)
    Store -->> Hook: authStatus='error', authError='Authentication failed'
    Hook -->> LS: authError is truthy
    LS -->> User: Inline error message rendered in form card
```

---

## Gate Result

| Artifact                   | Path                                                                 | Status       |
| -------------------------- | -------------------------------------------------------------------- | ------------ |
| Module/Component Hierarchy | `pipeline-output/FIN-42/run-001/01-plan/architecture-diagrams.md` §1 | ✅ Generated |
| Redux Data Flow            | `pipeline-output/FIN-42/run-001/01-plan/architecture-diagrams.md` §2 | ✅ Generated |
| OTP Login Sequence         | `pipeline-output/FIN-42/run-001/01-plan/architecture-diagrams.md` §3 | ✅ Generated |

**Gate:** `SDLC_G1.5_DIAGRAM` — **PASSED**  
(Non-blocking — diagrams are informational only)

---

**Tokens (estimated):** ~8k in / ~3k out / ~11k total
