# Numi's Core Innovations: The 6 P's of Checkout Excellence

Numi is designed around six core innovations—each starting with "P"—that together create a checkout and billing platform unlike any other. These principles ensure Numi is not only powerful and flexible, but also simple to implement, fully customizable, and open to the community.

## Mission Statement
Numi exists to empower businesses with the most flexible, programmable, and presentable checkout and billing platform ever built. By combining open-source principles with a modular, "6 P's" architecture, Numi adapts to your business—not the other way around—delivering automation, customization, and value at every step of the revenue lifecycle.

---

# The 6 P's: Why Numi is the Best Checkout Service

## 1. Presentable: UI, Templates, Blocks, Styles

**What:**  
Numi's UI is built from composable, "dumb" blocks that only receive props and emit events. Each block describes its own needs and capabilities using hooks, and blocks are stacked vertically within sections. Field blocks can store values, and all blocks are user-extensible.

**Why it's innovative:**
- No need to rewrite editor UI for every block.
- Users can create their own blocks.
- Components are easy to rewire and restyle.
- Unlike competitors, Numi allows for true block-based customization without arbitrary limitations.

**How it stands out:**
- Most systems have rigid, "smart" components that are hard to customize.
- Styling is often limited or requires custom CSS.
- Numi enables unlimited design flexibility and brand-perfect presentation.

## Presentable Deep Dive: Why "Dumb" Blocks, UI Expression, and Open Styles Matter

### Why "Dumb" Blocks Are Essential

Blocks in Numi are intentionally "dumb"—they do not know about their environment, parent, or global state. They only receive props and emit events. This architectural choice is critical for several reasons:
- **Reduces Complexity:** When blocks are unaware of their context, they avoid hidden dependencies and side effects, making them easier to reason about, test, and maintain.
- **Increases Flexibility:** Dumb blocks can be reused in any context, rearranged, or composed in new ways without breaking. This enables rapid iteration and customization.
- **Enables True Modularity:** By isolating logic and state, blocks become portable and interchangeable, allowing for a more dynamic and adaptable UI.
- **Prevents Tight Coupling:** Blocks that know about their environment introduce coupling, which makes future changes harder and riskier. Dumb blocks keep the system agile and evolvable.

### UI: Expressive, Self-Describing Blocks

Each block in Numi can declare which styles and appearance properties it supports (e.g., color, border, padding, font). This self-description is leveraged by the editor:
- **Auto-Representation in Editor:** The editor UI automatically presents controls for all declared style and appearance props, so users can visually adjust block appearance without manual configuration.
- **Declarative Customization:** Developers and users can extend or override which props a block exposes, making the system both powerful and approachable.
- **Consistency and Predictability:** Because blocks declare their own needs, the editor remains consistent and intuitive, regardless of block type.

### Styles: Open, Editable, and Themed

- **CSS Styles as First-Class Citizens:** All style properties are standard CSS, and users can freely edit them for any block.
- **Theme Integration:** By default, blocks use values from the active theme, ensuring brand consistency and rapid design changes across the entire UI.
- **User Empowerment:** Users can override any style at the block level, or rely on theme defaults for a cohesive look.
- **No Vendor Lock-In:** Styles are not hidden or locked away—everything is open and editable, supporting both designers and developers.

---

## 2. Programmable: Logic, Paths, Functions

**What:**  
Layouts are fully customizable using YAML/JSON, supporting multi-page flows and dynamic routing based on field values.

**Why it's innovative:**
- Enables complex, conditional workflows directly in the UI.
- Checkout flows can adapt to any business logic.

**How it stands out:**
- Other systems offer limited or no programmability in checkout flows.
- Numi empowers businesses to implement any logic, not just what's built-in.

## Programmable Deep Dive: Logic, Paths, Dynamic Values, and Field State

### Logic: Dynamic Visibility and Scripting Everywhere

- **Visibility Filters:** Every block in Numi can have its visibility controlled by either a simple boolean or a dynamic JavaScript expression. Users can set up conditional logic rules or write scripts that determine if a block should be shown, based on any available data or state.
- **Scripting Within Elements:** Any property (not just visibility) can be set to a static value or switched to "function mode," where its value is computed by a script. These scripts are auto-evaluated and updated as dependencies change, enabling highly dynamic UIs.
- **Example:** A block's "isVisible" property can be set to `true`, `false`, or a function like `() => checkout.item('primary').is('pro')`.

### Paths: Definable Page Logic Flows

- **Page Logic Paths:** Numi allows you to define navigation and workflow paths based on field values or other state. This means you can create multi-page flows where the next page or step is determined by user input or computed logic.
- **Conditional Routing:** Paths can be set up to branch, skip, or loop based on any field or computed value, supporting complex onboarding, checkout, or survey flows.

### Field Blocks: Form State and Validation

- **Field Blocks:** Some blocks are designated as fields, meaning they hold user input and participate in form state.
- **Validation:** Field blocks can declare validation rules (required, pattern, min/max, custom functions), and Numi will enforce these rules both in the UI and before submission.
- **Reactive State:** Field values are reactive and can be referenced in logic scripts, paths, or other block properties.

### Dynamic Values: Functions Everywhere

- **Literal or Computed:** Any literal value in Numi (text, number, boolean, style, etc.) can be swapped for a function, allowing for dynamic computation and real-time updates.
- **Composable Logic:** This enables advanced use cases like dynamic pricing, personalized content, or adaptive UI without custom coding outside the platform.

---

## 3. Provisionable: Delivery, Workflows

**What:**  
Numi automates product delivery and fulfillment, tracking workflows based on events. Users can replace background functions (like CreateOrder) with their own logic.

**Why it's innovative:**
- End-to-end provisioning is handled automatically.
- Users can fully customize fulfillment logic.

**How it stands out:**
- Competing platforms require manual processing or offer only basic automation.
- Numi's workflow engine is deeply integrated and extensible.

## Provisionable Deep Dive: Programmable Delivery and Workflows

### Full-Stack Provisioning Within the Platform

- **Integrated Provisioning:** Numi enables users to manage the entire provisioning process—what customers receive after purchase—directly within the platform. This includes fulfillment, delivery, notifications, and any post-purchase automation.
- **No External Tools Required:** Unlike other systems that require manual steps or third-party integrations for fulfillment, Numi brings all provisioning logic in-house, streamlining operations and reducing errors.

### Zapier-Like, Fully Programmable Workflow Engine

- **Visual Workflow Editor:** Numi features a workflow editor inspired by Zapier, allowing users to visually compose automation flows. However, Numi's engine goes beyond simple event reactions.
- **Programmable Actions and Logic:** Workflows are not limited to "if this, then that" triggers. Users can insert custom logic, branching, loops, and data transformations, making the automation as simple or as complex as needed.
- **Replace or Extend Default Flows:** The default checkout and order creation workflows are just starting points. Users can override, extend, or completely replace them with their own custom flows, tailored to their business needs.

### Unmatched Flexibility Compared to Other Platforms

- **Beyond Event-Driven:** Most checkout systems only allow basic event hooks or webhooks. Numi's workflow engine is deeply integrated and fully programmable, supporting advanced fulfillment, custom notifications, and business logic.
- **Unified Experience:** All provisioning and workflow logic lives within Numi, providing a single source of truth and a seamless user experience for both developers and operators.

---

## 4. Packageable: Pricing, Products, Slots

**What:**  
Products are what the user buys; prices are price points for products. Numi supports importing prices from different payment providers and uses a "slot" system for flexible offer configuration.

**Why it's innovative:**
- Supports complex pricing models (one-time, recurring, package, tiered).
- Slot system allows for easy comparison, switching, and bundling.

**How it stands out:**
- Other systems force rigid product/addon structures and lack true plan flexibility.
- Numi's pricing is transparent, flexible, and easy to manage.

## Packageable Deep Dive: Universal Pricing Models and Stripe Sync

### Any Pricing Model, No Limits

- **Model Flexibility:** Numi supports every major pricing model out of the box: one-time, recurring (subscriptions), tiered, package/bundle, usage-based, and more. You can mix and match models within a single offer or product, enabling advanced monetization strategies.
- **Slot System:** Our slot-based architecture allows you to present, compare, and switch between different prices and models seamlessly within the same checkout flow.
- **No Arbitrary Restrictions:** Unlike other platforms that force rigid product/addon structures or limit plan types, Numi lets you define exactly what you need for your business.

### Full Stripe Sync: Stripe Billing, In-House, No Code

- **Stripe Integration:** Numi can fully sync with Stripe, importing and managing all your Stripe products, prices, and billing logic.
- **Feature Parity:** Everything you can do with Stripe Billing—recurring plans, metered billing, coupons, trials, proration, and more—can be managed directly in Numi, without writing code or relying on developers.
- **Unified Catalog:** Manage Stripe and non-Stripe pricing side-by-side, compare models, and switch providers without friction.
- **Automatic Updates:** Changes made in Stripe are reflected in Numi, and vice versa, ensuring your catalog is always up to date.

### Why This Is Unique

- **No-Code Power:** Most platforms require developer intervention for advanced pricing or Stripe sync. Numi puts this power in the hands of operators and product teams.
- **Total Flexibility:** You are never locked into a single provider or model—Numi adapts to your business, not the other way around.
- **Seamless Experience:** All pricing, syncing, and management happens in one place, with a consistent UI and workflow.

---

## 5. Pluggable: Workflows, Payments, Themes

**What:**  
Themes are global and reusable. Every block describes which styles it wants, and styles inherit from themes. Workflows and payment integrations are pluggable.

**Why it's innovative:**
- Named styles and visibility logic for blocks.
- Easy to extend with custom workflows and payment providers.

**How it stands out:**
- Most platforms lock down design and integrations.
- Numi is open, extensible, and future-proof.

## Pluggable Deep Dive: Modular APIs, SDKs, and Extensible Workflows

### Pluggable at Every Layer

Numi is architected for total extensibility and integration, making it fully pluggable across backend, frontend, and workflow layers:

- **Backend (Admin API):** Every resource—products, prices, offers, orders, workflows, and more—is accessible and modifiable via a robust admin API. Automate operations, integrate with your existing stack, or build custom admin tools with full confidence.
- **Frontend (SDK):** The Numi SDK empowers you to embed, customize, or completely replace any part of the checkout UI and logic. Build unique customer experiences, integrate with your app, or extend the UI with your own components and flows.
- **Workflows:** All business logic, fulfillment, and automation flows are pluggable. Add new workflow steps, override defaults, or connect to external services—Numi's workflow engine is open and programmable.

### Everything Is Swappable and Extendable

- **Payment Providers:** Integrate any payment gateway or provider. Add, remove, or swap payment integrations as your business evolves.
- **UI Blocks:** Create, extend, or override UI blocks to match your brand and requirements. No forced templates or locked-down components.
- **Business Logic:** Inject custom logic at any point—validation, pricing, fulfillment, notifications, and more.

### No Closed Systems, No Forced Defaults

- **Open by Design:** Unlike other platforms that restrict customization or hide core logic, Numi exposes every layer for extension and integration.
- **Modular Architecture:** Pick and choose the parts you need, and replace or extend anything that doesn't fit your workflow.
- **Empowering Developers and Operators:** Whether you're building a custom dashboard, integrating with third-party tools, or creating a unique checkout flow, Numi gives you the power and flexibility to do it your way.

Numi is not just customizable—it's built to be yours, at every level.

---

## 6. Portable: Plug-and-Play, Scripting

**What:**  
Numi supports running scripts within the UI, enabling custom logic and automation in a sandboxed environment.

**Why it's innovative:**
- Logic can be embedded directly in the UI.
- Enables advanced use cases without backend changes.

**How it stands out:**
- Other platforms don't allow UI-level scripting or require complex backend work.
- Numi empowers users to innovate at the UI layer.

## Portable Deep Dive: Effortless Embedding and Universal Integration

### Drop-In Simplicity, Anywhere

- **Plug-and-Play Integration:** Numi is designed to be dropped into any website, app, or platform with minimal setup. Whether you're running a modern React SPA, a legacy PHP site, or a headless CMS, Numi fits right in.
- **No Stack Lock-In:** Our platform-agnostic approach means you don't have to change your tech stack or workflows—Numi adapts to your environment, not the other way around.
- **Rapid Onboarding:** Get up and running in minutes, not weeks. Our SDKs, APIs, and embeddable components make integration fast and painless for both developers and operators.

### Seamless Customization and Extension

- **Custom Scripts and UI:** Inject custom scripts, UI logic, and workflows that work seamlessly wherever Numi is deployed. Extend or override any part of the experience to match your needs.
- **Universal Compatibility:** Numi works with any frontend or backend, and can be embedded as a widget, full page, or integrated into your existing flows.

### No Heavy Lifting, No Lock-In

- **Minimal Effort, Maximum Flexibility:** Unlike other platforms that require heavy integration or force you into their ecosystem, Numi is lightweight, modular, and open.
- **Future-Proof:** As your stack evolves, Numi evolves with you—no re-platforming or costly migrations required.

Numi is the checkout and billing engine that goes wherever your business goes.

---

## Bonus: Public (Open Source)

**What:**  
Numi is fully open source, instantly deployable, and supports custom events and front-end-only deployments.

**Why it's innovative:**
- Community-driven development.
- Transparent, auditable, and customizable by anyone.

**How it stands out:**
- Competing platforms are closed, expensive, and slow to adapt.
- Numi is affordable ($25/month), open, and built for the AI age.

---

# Summary: Why Numi Wins

Numi's 6 P's—Presentable, Programmable, Provisionable, Packageable, Pluggable, and Portable—combine to create a checkout platform that is:

- **Indefinitely customizable:** Adapt to any business model or brand.
- **Developer-friendly:** Built for rapid iteration and extension.
- **Automation-first:** Eliminate manual work and speed up revenue.
- **Open and affordable:** No vendor lock-in, transparent pricing, and community-driven innovation.

---

# Notes
- Can we version price references in snapshots?
