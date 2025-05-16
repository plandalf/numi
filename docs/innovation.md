# CREATE: The Six Core Innovations that Power Checkout Excellence

The platform is built on six core innovations that form the CREATE framework. These principles work together to create a checkout and billing platform that is not only powerful and flexible, but also simple to use, fully customizable, and open to everyone. Our approach is about making billing and checkout work for you, not the other way around.

## The CREATE Framework
Our platform embodies six fundamental capabilities that redefine what's possible in checkout and billing:

**C**ustomizable: UI blocks, styles, and visual elements  
**R**eactive: Logic, functions, and conditional workflows  
**E**xtensible: APIs, integrations, and modular architecture  
**A**utomated: Workflow engine, delivery, and fulfillment  
**T**ransportable: Moves seamlessly across platforms, fits anywhere  
**E**lastic: Adapts to any pricing model, flexes with business needs  

## Mission Statement
We empower businesses with the most flexible, programmable, and presentable checkout and billing platform ever created. By combining open-source principles with the CREATE framework, we adapt to your business. We deliver automation, customization, and value at every step of your revenue journey.

---

# C: Customizable UI, Templates, Blocks, Styles

### What
Our UI is made from simple, composable blocks. These blocks only receive props and emit events, never making assumptions about their environment. Each block describes its own needs and capabilities using hooks, and blocks are stacked vertically within sections. Field blocks can store values, and all blocks are user-extensible.

### Why it's innovative
When blocks are "dumb," they avoid hidden dependencies and side effects. This makes them easier to reason about, test, and maintain. You can reuse them in any context, rearrange them, or compose them in new ways without breaking things. This approach lets you iterate quickly and customize deeply, without fear of breaking your UI.

### How it stands out
We let you create your own blocks, rewire and restyle components, and enjoy true block-based customization. Most systems have rigid, "smart" components that are hard to change. Styling is often limited or requires custom CSS. With us, you get unlimited design flexibility and a brand-perfect presentation, every time.

### Comparison
Other systems don't allow for blocks, or blocks are limited in arbitrary ways. Components are "smart" and hard to rewire. Checkouts are usually set in their ways, cannot decide which parts go where, and styling is limited. Pages can usually have only one or two styles.

## Customizable Deep Dive: Why "Dumb" Blocks, UI Expression, and Open Styles Matter

Blocks in our platform are intentionally simple. They do not know about their environment, parent, or global state. They only receive props and emit events. This design choice is critical because it reduces complexity, increases flexibility, and enables true modularity. By isolating logic and state, blocks become portable and interchangeable, allowing for a more dynamic and adaptable UI. Blocks that know about their environment introduce coupling, which makes future changes harder and riskier. Simple blocks keep the system agile and easy to evolve.

Each block can declare which styles and appearance properties it supports, such as color, border, padding, or font. The editor UI automatically presents controls for all declared style and appearance props, so users can visually adjust block appearance without manual configuration. Developers and users can extend or override which props a block exposes, making the system both powerful and approachable. Because blocks declare their own needs, the editor remains consistent and intuitive, regardless of block type.

All style properties are standard CSS, and users can freely edit them for any block. By default, blocks use values from the active theme, ensuring brand consistency and rapid design changes across the entire UI. Users can override any style at the block level, or rely on theme defaults for a cohesive look. Styles are never hidden or locked away—everything is open and editable, supporting both designers and developers.

---

# R: Reactive Logic, Paths, Functions

### What
Layouts in our platform are fully customizable using YAML or JSON. You can create multi-page flows and dynamic routing based on field values. This means your checkout can adapt to any business logic, not just what comes out of the box.

### Why it's innovative
We let you set up visibility filters on blocks using JavaScript scripts or conditional logic rules. You can write scripts within every element. For example, a boolean property can be set to true or false, or you can switch to function mode and have its value computed and auto-updated. A block's "isVisible" property can be set to true, false, or a function like () => checkout.item('primary').is('pro').

Paths are page logic flows that you define based on field values. You can create multi-page flows where the next page or step is determined by user input or computed logic. Paths can branch, skip, or loop based on any field or computed value, supporting complex onboarding, checkout, or survey flows.

Some blocks are fields, and they hold user input and participate in form state. Field blocks can declare validation rules, such as required, pattern, min/max, or custom functions. We enforce these rules both in the UI and before submission. Field values are reactive and can be referenced in logic scripts, paths, or other block properties.

Any literal value—text, number, boolean, style, and more—can be swapped for a function, allowing for dynamic computation and real-time updates. This enables advanced use cases like dynamic pricing, personalized content, or adaptive UI, all without custom coding outside the platform.

### How it stands out
Other systems offer limited or no programmability in checkout flows. We empower businesses to implement any logic, not just what's built-in.

### Comparison
Most platforms only allow basic event hooks or require developer intervention for advanced logic. We let you build and adapt flows visually and programmatically, with no code required for most use cases.

---

# E: Extensible Modular APIs, SDKs, and Workflows

### What
Our platform is built for total extensibility and integration. You can plug it in at every layer—backend, frontend, and workflow.

The backend admin API gives you access to every resource: products, prices, offers, orders, workflows, and more. You can automate operations, integrate with your existing stack, or build custom admin tools with full confidence.

Our SDK lets you embed, customize, or completely replace any part of the checkout UI and logic. Build unique customer experiences, integrate with your app, or extend the UI with your own components and flows.

All business logic, fulfillment, and automation flows are pluggable. Add new workflow steps, override defaults, or connect to external services. Our workflow engine is open and programmable.

### Why it's innovative
You can integrate any payment gateway or provider. Add, remove, or swap payment integrations as your business evolves. Create, extend, or override UI blocks to match your brand and requirements. There are no forced templates or locked-down components. Inject custom logic at any point—validation, pricing, fulfillment, notifications, and more.

### How it stands out
We are open by design. Unlike other platforms that restrict customization or hide core logic, we expose every layer for extension and integration. Our modular architecture lets you pick and choose the parts you need, and replace or extend anything that doesn't fit your workflow. Whether you're building a custom dashboard, integrating with third-party tools, or creating a unique checkout flow, we give you the power and flexibility to do it your way. Our platform is not just customizable—it's built to be yours, at every level.

### Comparison
Most platforms restrict customization to a handful of settings or require workarounds for true integration. We are open by default—developers and operators have the power to make the platform their own.

---

# A: Automated Delivery and Workflows

### What
We let you handle the entire provisioning process—what customers receive after purchase—directly within the platform. This includes fulfillment, delivery, notifications, and any post-purchase automation. You do not need external tools or manual steps. Everything is managed in one place, reducing errors and streamlining your operations.

### Why it's innovative
Our workflow engine is inspired by Zapier, but goes much further. You can visually compose automation flows, but you are not limited to simple event reactions. Insert custom logic, branching, loops, and data transformations to make your automation as simple or as complex as you need. The default checkout and order creation workflows are just starting points. You can override, extend, or completely replace them with your own custom flows, tailored to your business needs.

### How it stands out
Most checkout systems only allow basic event hooks or webhooks. Our workflow engine is deeply integrated and fully programmable, supporting advanced fulfillment, custom notifications, and business logic. All provisioning and workflow logic lives within the platform, providing a single source of truth and a seamless experience for both developers and operators.

### Comparison
Other platforms require manual processing or offer only basic automation. We bring all provisioning logic in-house, streamlining operations and reducing errors.

---

# T: Transportable Effortless Embedding and Universal Integration

### What
Our platform is designed to be dropped into any website, app, or platform with minimal setup. Whether you're running a modern React SPA, a legacy PHP site, or a headless CMS, we fit right in. Our platform-agnostic approach means you don't have to change your tech stack or workflows. We adapt to your environment, not the other way around. You can get up and running in minutes, not weeks. Our SDKs, APIs, and embeddable components make integration fast and painless for both developers and operators.

### Why it's innovative
You can inject custom scripts, UI logic, and workflows that work seamlessly wherever our platform is deployed. Extend or override any part of the experience to match your needs. We work with any frontend or backend, and can be embedded as a widget, full page, or integrated into your existing flows.

### How it stands out
Unlike other platforms that require heavy integration or force you into their ecosystem, we are lightweight, modular, and open. As your stack evolves, we evolve with you. There is no need for re-platforming or costly migrations. We are the checkout and billing engine that goes wherever your business goes.

### Comparison
Other platforms require heavy integration or lock you into their ecosystem. We are lightweight, modular, and open, so you can integrate and evolve without friction.

---

# E: Elastic Pricing, Products, Slots

### What
We support every major pricing model out of the box. Whether you need one-time payments, recurring subscriptions, tiered pricing, packages, bundles, or usage-based billing, you can mix and match models within a single offer or product. This gives you the freedom to create advanced monetization strategies that fit your business.

Our slot-based architecture lets you present, compare, and switch between different prices and models seamlessly within the same checkout flow. There are no arbitrary restrictions. You define exactly what you need for your business, without being forced into rigid product or addon structures.

### Why it's innovative
We can fully sync with Stripe, importing and managing all your Stripe products, prices, and billing logic. Everything you can do with Stripe Billing—recurring plans, metered billing, coupons, trials, proration, and more—can be managed directly in our platform, without writing code or relying on developers. You can manage Stripe and non-Stripe pricing side-by-side, compare models, and switch providers without friction. Changes made in Stripe are reflected in our platform, and vice versa, so your catalog is always up to date.

### How it stands out
Most platforms require developer intervention for advanced pricing or Stripe sync. We put this power in the hands of operators and product teams. You are never locked into a single provider or model. We adapt to your business, not the other way around. All pricing, syncing, and management happens in one place, with a consistent UI and workflow.

### Comparison
Other systems force rigid product/addon structures and lack true plan flexibility. Our pricing is transparent, flexible, and easy to manage.

---

# Bonus: Public (Open Source)

### What
Our platform is fully open source, instantly deployable, and supports custom events and front-end-only deployments.

### Why it's innovative
Community-driven development. Transparent, auditable, and customizable by anyone.

### How it stands out
Competing platforms are closed, expensive, and slow to adapt. We are affordable, open, and built for the AI age.

---

# Summary: Why We Win

The CREATE framework—Customizable, Reactive, Extensible, Automated, Transportable, Elastic—combines to create a checkout platform that is:

- **Indefinitely customizable:** Adapt to any business model or brand.
- **Developer-friendly:** Built for rapid iteration and extension.
- **Automation-first:** Eliminate manual work and speed up revenue.
- **Open and affordable:** No vendor lock-in, transparent pricing, and community-driven innovation.

---

# Notes
- Can we version price references in snapshots?
