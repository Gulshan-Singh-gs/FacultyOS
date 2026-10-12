# FacultyOS: Enterprise Production-Readiness Checklist

FacultyOS is not just a web application that needs a custom domain. It is a multi-tenant academic workflow platform that handles student requests, faculty decisions, policy enforcement, audit trails, institutional identity, and potentially sensitive education records.

The production target should be a Cloudflare-native, edge-first architecture with institutional identity integration, tenant isolation, durable persistence, auditable policy decisions, and documented security controls.

One important distinction: no fixed list of third-party subscriptions automatically makes FacultyOS enterprise-ready or FERPA-compliant. The university's contractual requirements, data flows, security controls, operational procedures, and actual implementation must all be validated.

## 1. Recommended domain architecture

`facultyos.com`

Public

Marketing, documentation, public pricing, legal notices, trust center, and product information.

`app.facultyos.com`

Application

Faculty dashboard, inbox, policies, request management, and authenticated workflows.

`api.facultyos.com`

API

Versioned APIs, institutional ERP integrations, webhooks, and authenticated service-to-service calls.

`{university}.facultyos.com`

Tenant portal

Optional university-branded entry points, tenant-specific configuration, and institutional login routing.

`admin.facultyos.com`

Restricted

Platform administration, tenant provisioning, support operations, and security configuration.

Additional useful domains include `status.facultyos.com`, `docs.facultyos.com`, `trust.facultyos.com`, and `support.facultyos.com`.

Recommended domain strategy: register the primary domain and configure DNS through Cloudflare. Use the same application deployment behind multiple hostnames where practical, with hostname-aware routing and server-side tenant resolution. Separate Worker services where isolation, operational ownership, or access boundaries justify the added complexity.

A critical caveat: a wildcard DNS record and wildcard TLS certificate make tenant hostnames possible, but neither one enforces tenant isolation. FacultyOS must validate the hostname against a registered tenant, bind that tenant to the authenticated session, and enforce tenant-scoped authorization on every data access.

## 2. Domain registration, DNS, TLS, and routing

The route inventory in your screenshot already shows a Paddle webhook endpoint, authentication routes, attachment handling, course portals, request-token pages, and a pricing page. These should be incorporated into the production design rather than rebuilt unnecessarily.

Cloudflare Workers supports custom domains that automatically provision DNS records and certificates. Production should use a custom domain rather than rely on the default `workers.dev` hostname.

![](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub

+1

| Category               | Required site/service                                    | Purpose for FacultyOS                                                      | Configuration prerequisites                                                                                                                                            |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain                 | Domain registrar such as Cloudflare Registrar or Porkbun | Own the product's canonical domain and control renewal.                    | Register `facultyos.com` or an available alternative; enable auto-renewal, account MFA, and registrar lock where supported.                                            |
| DNS                    | Cloudflare DNS                                           | Resolve application and service hostnames.                                 | Activate the zone, configure authoritative nameservers, and manage DNS changes through reviewed deployment configuration.                                              |
| Public marketing       | `facultyos.com` and `www.facultyos.com`                  | Public product pages, pricing, documentation links, and trust information. | Deploy the marketing site; select a canonical hostname; redirect the other hostname to it.                                                                             |
| Faculty application    | `app.facultyos.com`                                      | Authenticated faculty dashboard and request workflows.                     | Attach the hostname to the application Worker or front it with an appropriately configured Worker route.                                                               |
| API                    | `api.facultyos.com`                                      | Stable endpoint for browser clients, ERP connectors, and integrations.     | Configure API routing, authentication, authorization, CORS allowlists, and API versioning.                                                                             |
| Tenant routing         | `{tenant}.facultyos.com`                                 | Branded portals and tenant-specific entry points.                          | Configure wildcard DNS and an appropriate wildcard Worker route, or use Cloudflare for SaaS/custom hostnames when needed. Resolve hostnames against a tenant registry. |
| Administrative console | `admin.facultyos.com`                                    | Restricted platform operations and tenant provisioning.                    | Enforce strong MFA, role-based access, privileged audit logging, and additional access restrictions.                                                                   |
| Wildcard previews      | `*.preview.facultyos.com`                                | Isolated deployment previews and tenant demonstrations.                    | Configure preview DNS, certificates, environment separation, access restrictions, and automatic expiry or cleanup.                                                     |
| TLS certificates       | Cloudflare SSL/TLS                                       | Encrypt browser, API, and webhook traffic.                                 | Use valid edge certificates, HTTPS-only access, automatic renewal monitoring, and appropriate origin encryption for any external origins.                              |
| Wildcard certificates  | `*.facultyos.com` or `*.preview.facultyos.com`           | Cover eligible first-level subdomains.                                     | Confirm certificate hostname coverage. A wildcard for `*.facultyos.com` does not cover `x.y.facultyos.com`. Configure deeper levels separately where required.         |
| HTTPS enforcement      | Cloudflare Redirect Rules / Always Use HTTPS             | Prevent plaintext access and canonicalize URLs.                            | Enable HTTPS redirects, eliminate mixed content, and test login and webhook flows after redirection.                                                                   |
| DNS security           | DNSSEC and registrar security                            | Reduce DNS tampering and domain takeover risk.                             | Enable DNSSEC when supported, verify the DS record at the registrar, and protect account recovery methods.                                                             |
| Email DNS              | MX, SPF, DKIM, DMARC records                             | Deliver university notifications and prevent email spoofing.               | Publish the exact records issued by the chosen email provider and validate them before production sending.                                                             |

Cloudflare's wildcard DNS and TLS behavior needs deliberate configuration, particularly with nested subdomains and preview URLs. Custom Domains for Workers and wildcard DNS records are separate mechanisms.

![](https://www.google.com/s2/favicons?domain=https://github.com\&sz=32)

GitHub

+3

### DNS records to plan

These are logical examples, not literal DNS values to copy into the dashboard.

| Record                             | Example                          | Action                                                                                                                           |
| ---------------------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| A / AAAA or apex-compatible record | `facultyos.com`                  | Configure according to the chosen hosting and DNS architecture.                                                                  |
| CNAME or Worker Custom Domain      | `app.facultyos.com`              | Attach the hostname to the application Worker.                                                                                   |
| CNAME or Worker Custom Domain      | `api.facultyos.com`              | Attach the API Worker.                                                                                                           |
| Wildcard DNS                       | `*.facultyos.com`                | Use only where the selected routing model requires it; reserve and test conflicting hostnames.                                   |
| TXT                                | Domain verification tokens       | Verify ownership with identity, email, monitoring, and search services.                                                          |
| MX                                 | Mail provider's specified hosts  | Receive mail if FacultyOS operates mailboxes on the domain. Not needed for outbound-only email.                                  |
| TXT                                | SPF, DKIM, DMARC                 | Authenticate outbound mail and establish spoofing policy.                                                                        |
| CAA (optional)                     | Approved certificate authorities | Restrict which certificate authorities can issue certificates for the domain, after checking Cloudflare's issuance requirements. |

Important design decision: for university tenants, start with `app.facultyos.com/c/{courseToken}` or a similar path-based model if separate tenant hostnames are not a hard requirement. The screenshot already includes `/c/[courseToken]`. Introduce tenant subdomains when institutional branding or routing requires them, rather than making a hostname the sole security boundary.

## 3. Authentication, authorization, and institutional SSO

University enterprise customers commonly need to integrate their existing identity provider. FacultyOS should support institutional identity federation rather than require every professor to create an unrelated consumer account.

| Category                  | Required site/service                      | Purpose for FacultyOS                                                                | Configuration prerequisites                                                                                                                                  |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Identity platform         | Auth0                                      | Central identity federation and support for institutional SSO.                       | Configure the production tenant, application clients, callback URLs, logout URLs, MFA policies, and organization-to-tenant mappings.                         |
| Institutional SSO         | Microsoft Entra ID                         | Support universities using Microsoft identity and enterprise application management. | Register an enterprise application; configure OIDC or SAML, claim mappings, allowed tenants, and test accounts.                                              |
| Institutional SSO         | Okta                                       | Support universities using Okta as their identity provider.                          | Register the integration, exchange metadata, configure attributes and groups, and test login and logout.                                                     |
| Federation protocols      | OIDC and SAML 2.0                          | Connect FacultyOS to different university identity providers.                        | Validate signatures, issuer, audience, redirect URIs, state/nonce, token expiry, and certificate/key rotation.                                               |
| Tenant provisioning       | SCIM 2.0, where supported by customer IdPs | Automate user provisioning and deprovisioning.                                       | Map institution, department, faculty, and administrator roles. Enforce account deactivation and least privilege.                                             |
| Application authorization | FacultyOS authorization layer              | Prevent students, faculty, and administrators from accessing unauthorized records.   | Enforce tenant-scoped access checks on every API, request, attachment, policy, and audit event. Never rely solely on UI visibility or email-domain matching. |
| Service access            | Cloudflare Access                          | Restrict internal admin tools and deployment previews.                               | Define identity policies, MFA, device or network requirements where appropriate, and emergency-access procedures.                                            |
| Session security          | FacultyOS application + identity provider  | Protect authenticated sessions.                                                      | Use secure, HttpOnly, appropriately scoped cookies; CSRF protection where applicable; session rotation and revocation; short-lived access credentials.       |

Architecture recommendation: use an identity abstraction in FacultyOS so each university can configure its own identity provider without creating a separate application codebase. Auth0 is one option, not a mandatory purchase; direct OIDC/SAML integration can be appropriate if the team can securely maintain federation, key rotation, provisioning, and support.

The student-facing public course/request flow should also have explicit abuse controls. A course token must not automatically grant access to a student's records or expose another student's submissions.

## 4. Database, durable storage, and auditability

Cloudflare Workers are execution environments, not a replacement for persistent data storage. FacultyOS must durably persist submissions, policy versions, decisions, audit events, and tenant configuration.

| Category                        | Required site/service                                                               | Purpose for FacultyOS                                                                                               | Configuration prerequisites                                                                                                                                   |
| ------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary database                | Cloudflare D1                                                                       | Store tenants, users, courses, policies, requests, decision outcomes, and relational references.                    | Create production databases, define schemas and migrations, enable appropriate backup/restore procedures, and test tenant isolation and transaction behavior. |
| Object storage                  | Cloudflare R2                                                                       | Store uploaded supporting documents and generated reports.                                                          | Create private buckets, use short-lived authorized access, define lifecycle/retention rules, and prevent public object access.                                |
| Alternative relational database | Neon or Supabase                                                                    | Use managed PostgreSQL if relational capabilities, reporting, or integrations justify it.                           | Configure connection pooling or supported serverless connections, access controls, encryption, backups, migrations, and network restrictions where available. |
| Alternative database            | PlanetScale                                                                         | Consider a managed relational database option if its current database engine and feature set match the application. | Validate SQL compatibility, transaction requirements, driver support, and operational constraints before committing.                                          |
| Fast ephemeral state            | Cloudflare KV                                                                       | Cache low-risk configuration or support suitable lookup patterns.                                                   | Define cache invalidation and consistency behavior. Do not use KV as the authoritative source for high-integrity policy decisions or audit records.           |
| Durable audit records           | D1 or a suitable transactional database, with independent archival where required   | Preserve who submitted, changed, approved, denied, or overrode a request and under which policy version.            | Record actor, tenant, timestamp, event type, policy version, outcome, and correlation ID. Restrict mutation and define retention/export procedures.           |
| Encryption keys                 | Cloudflare-managed encryption plus application-level key management where warranted | Protect stored data and sensitive integration credentials.                                                          | Document key ownership, access, rotation, recovery, and separation of duties.                                                                                 |
| Backup and recovery             | Database backups, R2 retention/versioning where supported, and independent exports  | Recover from accidental deletion, corruption, or operational incidents.                                             | Define RPO/RTO targets, test restoration, protect backup access, and validate that retention and deletion requirements are met.                               |

### The policy engine requires stronger guarantees than ordinary CRUD

For every automated decision, persist:

* The immutable or versioned policy identifier and exact version used.

* The normalized request inputs and the rules evaluated.

* The decision (`approved`, `denied`, `needs review`, or another defined state).

* The reason codes shown to the student and faculty.

* The actor or service identity, timestamp, and correlation ID.

* Any later override, appeal, or policy correction as a separate event.

A critical distinction: a deterministic policy engine is not necessarily an auditable one. Reproducibility requires versioned rules, stable input normalization, defined precedence, and an explicit record of the actual decision path.

Do not assume D1, R2, or any alternative provider automatically satisfies a university's retention, recovery, data residency, or contractual security requirements. Validate those against the actual deployment and contract.

## 5. Async processing, scheduled jobs, and ERP integrations

Do not make a student request depend on a long-running synchronous Worker execution to send emails, generate PDFs, or complete ERP synchronization.

| Category                    | Required site/service                                     | Purpose for FacultyOS                                                                                           | Configuration prerequisites                                                                                                    |
| --------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Message queue               | Cloudflare Queues                                         | Buffer notifications, report generation, and integration tasks.                                                 | Create queues and consumers; configure retries, dead-letter handling, message retention, and idempotent processing.            |
| Scheduled tasks             | Cloudflare Workers Cron Triggers                          | Reconcile overdue requests, retry failed integrations, generate scheduled reports, and process retention tasks. | Configure cron schedules, execution monitoring, duplicate-run protection, and tenant-aware job logic.                          |
| Durable workflows           | Cloudflare Workflows                                      | Coordinate multi-step operations that must survive retries or execution interruptions.                          | Model workflow states, retries, compensation steps, timeouts, and safe recovery after partial failure.                         |
| Optional streaming platform | Upstash Kafka                                             | Support event streaming or higher-volume integrations when a queue is insufficient.                             | Configure credentials, consumer groups, retention, replay, and data minimization. Not needed for a typical initial deployment. |
| ERP integration             | Ellucian                                                  | Integrate with universities using supported Ellucian products.                                                  | Confirm the institution's exact product and API access, scopes, sandbox credentials, data mappings, and rate limits.           |
| ERP integration             | Workday                                                   | Integrate with universities using Workday Student or other relevant Workday services.                           | Confirm licensed modules, approved API access, integration permissions, and supported synchronization workflows.               |
| ERP integration             | Oracle Student Cloud                                      | Potential integration for institutions using Oracle student systems.                                            | Confirm the actual product, tenant environment, API capabilities, authentication, and institution-approved access.             |
| Integration gateway         | `integrations.facultyos.com` or a dedicated API namespace | Isolate ERP connectors and institutional webhooks from browser-facing endpoints.                                | Validate signatures or OAuth credentials, apply replay protection, scope access by tenant, and audit every synchronization.    |

Policy safety requirement: a queue retry must never produce a second approval, duplicate a penalty, or send contradictory notifications. Give each operation an idempotency key, store the decision durably before dispatching side effects, and define whether each event is safe to retry.

For automated decisions, the queue should transport a decision already produced by the policy engine; it should not silently change the policy or recompute the outcome under an untracked version.

## 6. Transactional email and notification services

Choose one primary transactional email provider first. Configure a verified sending domain and test delivery to university-managed email systems before launch.

| Category             | Required site/service       | Purpose for FacultyOS                                                              | Configuration prerequisites                                                                                                             |
| -------------------- | --------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Transactional email  | Postmark                    | Deliver submission receipts, decision notifications, and faculty alerts.           | Verify the sending domain, create server credentials, configure bounce handling, and test delivery.                                     |
| Alternative email    | Resend                      | Alternative API-driven transactional email delivery.                               | Verify domain ownership, configure DKIM/SPF as instructed, and set up API credentials and webhook verification.                         |
| Alternative email    | Twilio SendGrid             | Transactional notifications and delivery event processing.                         | Complete sender authentication, API access, suppression management, and delivery/bounce webhook configuration.                          |
| Sending subdomain    | `notify.facultyos.com`      | Separate transactional mail reputation from marketing email and other domain uses. | Verify the subdomain with the provider and publish the provider-issued DNS records.                                                     |
| SPF                  | DNS TXT record              | Authorize permitted sending infrastructure.                                        | Publish a single valid SPF policy for the relevant domain; consolidate authorized senders rather than creating conflicting SPF records. |
| DKIM                 | Provider-issued DNS records | Cryptographically authenticate outbound email.                                     | Publish the required keys, verify signing, and establish a key rotation procedure.                                                      |
| DMARC                | `_dmarc.facultyos.com`      | Define handling of messages failing SPF/DKIM alignment and receive reports.        | Start with monitoring, inspect legitimate senders, then progressively enforce an appropriate policy.                                    |
| Delivery monitoring  | Provider webhook endpoints  | Detect bounces, spam complaints, and delivery failures.                            | Verify webhook authenticity, process events idempotently, and suppress invalid or opted-out destinations where applicable.              |
| In-app notifications | FacultyOS database and UI   | Show request status without exposing unnecessary academic information in email.    | Keep email content minimal; link to an authenticated portal for sensitive details.                                                      |

For FERPA-sensitive workflows, do not place grades, detailed regrade disputes, disability-related documentation, or extensive student submissions in notification emails by default. Send a minimal notice and direct the recipient to an authenticated portal.

## 7. Payments, subscriptions, and billing

Your existing `/api/webhooks/paddle` route and `/pricing` page indicate that Paddle is already represented in the application's route design. That does not establish that the merchant account, webhook subscription, live credentials, or billing reconciliation are fully configured.

| Category            | Required site/service                  | Purpose for FacultyOS                                                                              | Configuration prerequisites                                                                                                                                     |
| ------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment and billing | Paddle                                 | Merchant-of-record option for subscriptions if its current terms and business model fit FacultyOS. | Activate the production account, configure products and plans, verify the webhook destination, validate signatures, and separate sandbox from live credentials. |
| Alternative billing | Stripe Billing                         | Subscription, invoice, and customer billing management.                                            | Configure products, subscription prices, tax settings as applicable, customer portal, webhook signing, and failed-payment handling.                             |
| Billing portal      | Paddle or Stripe customer portal       | Let authorized billing contacts manage subscriptions and invoices.                                 | Scope access to the tenant's authorized billing administrators; never expose one institution's billing details to another.                                      |
| Entitlements        | FacultyOS billing database             | Enforce plan limits, seats, departments, and subscription status.                                  | Update entitlements through verified webhook events; handle duplicate, delayed, and out-of-order events.                                                        |
| Procurement         | Institution-specific vendor onboarding | Support university purchase orders, invoicing, vendor registration, and contractual approval.      | Determine whether the institution requires purchase orders, annual invoicing, a vendor security questionnaire, or a procurement portal.                         |

Billing is conditional. If FacultyOS is currently a free pilot or a university-funded deployment, payment infrastructure is not a prerequisite to operating the application securely. Enterprise procurement may be more important than online checkout.

## 8. Observability, monitoring, and incident detection

| Category                   | Required site/service                        | Purpose for FacultyOS                                                                        | Configuration prerequisites                                                                                                                    |
| -------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Platform metrics           | Cloudflare Workers Analytics and Logs        | Measure request volume, error rates, CPU time, and deployment health.                        | Enable appropriate observability, establish retention, and define dashboards per production environment.                                       |
| Error tracking             | Sentry                                       | Capture application exceptions and identify regressions.                                     | Install the appropriate Workers integration, configure releases and source maps, and redact student data, tokens, and request bodies.          |
| Log analytics              | Axiom                                        | Search structured application logs and investigate incidents.                                | Configure ingestion, tenant-safe log fields, access permissions, retention, and alerts.                                                        |
| Enterprise APM             | Datadog or New Relic                         | Correlate application behavior with infrastructure and integration failures where supported. | Verify the current Workers integration and data export path, configure service dashboards, and confirm contractual data-handling requirements. |
| External uptime monitoring | Better Stack or an equivalent service        | Test public availability from outside the Cloudflare account.                                | Monitor marketing, login, health, and API endpoints; use synthetic accounts and non-sensitive test data.                                       |
| Alert delivery             | Email or a restricted Slack incident channel | Notify the engineering and operations team of failures.                                      | Configure severity thresholds, on-call ownership, escalation procedures, and alert deduplication.                                              |

### Production dashboards and alerts

| Dashboard or alert  | What to monitor                                                                                | Suggested trigger                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Availability        | Public application, login, and API health                                                      | Repeated failures across independent probes.                                          |
| Policy engine       | Decision latency, errors, unexpected outcomes, and rule-version distribution                   | Latency exceeding the service objective or any unexplained policy evaluation failure. |
| Decision integrity  | Duplicate decisions, conflicting outcomes, or missing audit events                             | Any confirmed integrity violation should page the responsible team.                   |
| Queue processing    | Queue depth, oldest message age, retries, and dead-letter count                                | Sustained backlog or any exhausted critical notification task.                        |
| Email delivery      | Rejection rate, bounce rate, and webhook processing failures                                   | Provider thresholds breached or a sustained notification delivery outage.             |
| ERP synchronization | Authentication failures, rate-limit responses, stale syncs, and mapping errors                 | Institution data exceeding its agreed freshness objective.                            |
| Database            | Query latency, errors, capacity, and backup/restore health                                     | Breached latency/error objectives or failed recovery checks.                          |
| Security            | Repeated login failures, suspicious token use, cross-tenant access attempts, and admin changes | Repeated suspicious activity or any confirmed unauthorized data access.               |

Avoid logging raw student requests, attachment contents, session cookies, access tokens, or unnecessary identifiers. Prefer correlation IDs, tenant IDs where appropriately protected, outcome codes, and redacted error metadata.

## 9. SEO, legal pages, compliance, and customer trust

### SEO and public web presence

| Category                  | Required site/service               | Purpose for FacultyOS                                                             | Configuration prerequisites                                                                                                                     |
| ------------------------- | ----------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Search indexing           | Google Search Console               | Verify domain ownership and monitor indexing of the public product website.       | Verify the domain using DNS TXT; submit the public sitemap and monitor indexing issues.                                                         |
| Search indexing           | Bing Webmaster Tools                | Monitor discovery and indexing by Bing.                                           | Verify the domain and submit the marketing sitemap.                                                                                             |
| Public sitemap            | `https://facultyos.com/sitemap.xml` | Expose approved marketing, documentation, pricing, and public legal URLs.         | Generate from the public route allowlist; exclude login, dashboards, tokenized requests, and private records.                                   |
| Public crawler rules      | `https://facultyos.com/robots.txt`  | Guide crawlers toward public content and away from non-public application routes. | Allow intended public pages and disallow private route patterns where useful. Never treat robots rules as access control.                       |
| Portal indexing controls  | `app.facultyos.com`                 | Prevent authenticated application pages from appearing in search results.         | Send `X-Robots-Tag: noindex, nofollow` or appropriate page-level directives, avoid exposing sensitive content, and restrict access server-side. |
| Preview indexing controls | `*.preview.facultyos.com`           | Avoid indexing staging and preview deployments.                                   | Require access controls; add `noindex` headers as defense in depth.                                                                             |
| Canonical metadata        | Public marketing pages              | Avoid duplicate indexing across apex and `www`.                                   | Set canonical URLs and redirect alternate hostnames consistently.                                                                               |

The screenshot includes `/robots.txt`, `/sitemap.xml`, `/pricing`, `/privacy`, `/security`, and `/terms`. Those routes are a useful starting point. Confirm that the actual content is published and correct, not merely that the routes exist.

### Legal, privacy, and security trust center

| Category                  | Required site/service                                                  | Purpose for FacultyOS                                                                                      | Configuration prerequisites                                                                                                                          |
| ------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Privacy policy            | `facultyos.com/privacy`                                                | Explain what data is collected, why, who receives it, and how long it is retained.                         | Document actual collection, purposes, subprocessors, retention, rights, and contact details.                                                         |
| Terms of service          | `facultyos.com/terms`                                                  | Establish product usage terms and responsibilities.                                                        | Define permitted use, customer obligations, availability commitments where offered, and contract precedence.                                         |
| FERPA documentation       | `trust.facultyos.com/ferpa` or `facultyos.com/security`                | Explain the controls and contractual model relevant to U.S. education records.                             | Document access controls, institution oversight, disclosures, retention, deletion, and incident procedures. Avoid claiming government certification. |
| Data Processing Agreement | `trust.facultyos.com/dpa` or contract portal                           | Define processing instructions, confidentiality, subprocessors, security, and deletion/return obligations. | Prepare a legally reviewed DPA; include relevant state privacy terms and international transfer provisions where applicable.                         |
| Subprocessor register     | `trust.facultyos.com/subprocessors`                                    | Disclose third parties that may process institutional data.                                                | List actual vendors, processing purposes, data categories, locations where relevant, and change-notification procedures.                             |
| Security overview         | `trust.facultyos.com/security`                                         | Answer university security questionnaires and describe the control environment.                            | Document encryption, access management, vulnerability handling, backups, incident response, and security contacts.                                   |
| Accessibility             | Public accessibility statement and product accessibility documentation | Support institutional accessibility reviews.                                                               | Test the UI against the applicable accessibility standard and document remediation processes.                                                        |
| Vendor risk management    | University procurement or vendor-security portal                       | Enable institutional due diligence.                                                                        | Prepare an architecture diagram, data-flow diagram, retention schedule, subprocessors, security policies, and evidence of control testing.           |

FERPA is a U.S. education privacy law, not a certification that a software vendor can obtain simply by purchasing a hosting plan. The U.S. Department of Education's cloud-computing guidance discusses how educational agencies and institutions must consider privacy and security when using cloud services.

![](https://www.google.com/s2/favicons?domain=https://studentprivacy.ed.gov\&sz=32)

Protecting Student Privacy

For FacultyOS, the university's contractual arrangement and actual control over education records are central. Have qualified counsel review the intended role of FacultyOS, the university's instructions, permitted uses and disclosures, and deletion/retention requirements.

### Status and incident communications

| Category                | Required site/service                           | Purpose for FacultyOS                                                | Configuration prerequisites                                                                                           |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Public status page      | Atlassian Statuspage or Instatus                | Communicate outages, degraded integrations, and planned maintenance. | Create components for the app, API, notifications, and integrations; establish incident ownership and update cadence. |
| Incident contact        | `security@facultyos.com`                        | Provide a dedicated channel for security reports.                    | Configure monitored mail delivery, restricted access, escalation, and documented response ownership.                  |
| Enterprise support      | `support@facultyos.com` or a ticketing platform | Manage institutional requests and service issues.                    | Define support hours, severity levels, response targets, and secure handling of student information.                  |
| Customer communications | Opt-in service email list                       | Notify institutional contacts about major incidents and maintenance. | Keep the recipient list controlled, verify authorized contacts, and define which incident details can be disclosed.   |

A public status page should not reveal student names, university-specific security incidents, detailed attack indicators, or internal remediation information that would create additional risk.

## 10. Edge security, WAF, rate limiting, and secret management

This is a critical part of FacultyOS because its public course links and request-submission endpoints could be abused to enumerate requests, upload malicious attachments, or trigger automated policy decisions.

| Category                      | Required site/service                               | Purpose for FacultyOS                                                                       | Configuration prerequisites                                                                                                                                          |
| ----------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Edge security                 | Cloudflare WAF                                      | Filter malicious HTTP requests before they reach the application Worker.                    | Configure managed rules, review false positives, and protect login, upload, API, and webhook endpoints.                                                              |
| Rate limiting                 | Cloudflare WAF Rate Limiting                        | Limit login abuse, token guessing, bulk submissions, and API flooding.                      | Apply endpoint-specific limits; combine IP-based controls with authenticated-user and tenant quotas. Test legitimate university NAT traffic before enforcing limits. |
| Bot protection                | Cloudflare Bot Management, where justified          | Reduce automated abuse of public course and request endpoints.                              | Configure appropriate bot controls and challenge behavior without blocking legitimate institutional integrations.                                                    |
| DDoS protection               | Cloudflare network and application-layer protection | Reduce the impact of traffic floods and automated abuse.                                    | Review available protections and plan-specific controls; establish monitoring and incident escalation.                                                               |
| API access control            | FacultyOS API gateway / Worker middleware           | Prevent cross-tenant access and unauthorized API calls.                                     | Validate the caller, tenant, resource, action, and role on every sensitive request.                                                                                  |
| Upload security               | R2 private buckets + application validation         | Prevent malicious or unauthorized attachments from being accessed or processed.             | Enforce size limits, file-type validation, malware scanning where appropriate, private storage, and short-lived authorized downloads.                                |
| Secret management             | Cloudflare Workers Secrets                          | Store per-Worker credentials and API keys securely.                                         | Use encrypted secret bindings, separate production and development credentials, and rotate exposed credentials.                                                      |
| Centralized secret management | Cloudflare Secrets Store                            | Centrally manage reusable secrets across Workers.                                           | Configure narrowly scoped access and deployment permissions. Verify current availability and limitations before relying on it as a critical dependency.              |
| Alternative secret management | Doppler or HashiCorp Vault                          | Centralized secrets workflows where multiple environments or systems require them.          | Configure access policies, CI/CD integration, audit logging, and secret rotation. Optional if Cloudflare's native secret facilities meet the requirements.           |
| Deployment credentials        | GitHub Actions + Cloudflare API token               | Automate controlled deployments without embedding administrator credentials in source code. | Use least-privilege tokens, protected production environments, secret storage, reviewed releases, and rollback procedures.                                           |
| Dependency security           | GitHub Dependabot and code scanning or equivalent   | Detect vulnerable dependencies and security defects.                                        | Enable dependency alerts, secret scanning, appropriate static analysis, and a vulnerability remediation workflow.                                                    |
| Security testing              | OWASP ZAP or an equivalent approved test suite      | Validate application security before university onboarding.                                 | Test authentication, authorization, file uploads, injection, session handling, CSRF, and tenant isolation in a staging environment.                                  |

Cloudflare documents configurable rate-limiting rules and their matching behavior. Treat edge limits as one layer of defense, not a replacement for application-level authorization and quotas.

![](https://www.google.com/s2/favicons?domain=https://developers.cloudflare.com\&sz=32)

Cloudflare Web Application Firewall (WAF) docs

+1

Cloudflare Secrets Store provides centralized account-level secrets for supported services, including Workers. It is documented as an open-beta feature, so verify its current availability, limits, and suitability before making it a critical dependency. Per-Worker secrets remain an alternative.

![](https://www.google.com/s2/favicons?domain=https://developers.cloudflare.com\&sz=32)

Cloudflare Secrets Store docs

+2

### Suggested initial WAF policy

| Endpoint                             | Primary protection                                                                                                            |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/*`                        | Login rate limits, credential-abuse detection, secure session handling.                                                       |
| `/api/public/c/*/requests`           | Per-course and per-IP submission quotas, request validation, spam protection.                                                 |
| `/api/attachments/*`                 | Authentication or verified submission authorization, strict upload limits, file validation.                                   |
| `/api/webhooks/paddle`               | Signature verification, replay/idempotency protection, appropriate provider-specific exceptions.                              |
| `/api/*`                             | Authentication as appropriate, strict input validation, tenant-scoped authorization, API quotas.                              |
| `/admin/*` and `admin.facultyos.com` | Strong MFA, restrictive access policies, privileged audit trails.                                                             |
| `/r/*` and `/requests/*`             | Unpredictable tokens, expiry or revocation as appropriate, no enumeration, authorization before displaying sensitive content. |

Do not apply one blanket rule that challenges or blocks every API request: it can break SSO callbacks, payment webhooks, and ERP integrations. Validate these flows explicitly.

## 11. Enterprise compliance and operational requirements

The external services above are only part of the work. The following controls must exist in FacultyOS itself.

| Category                   | Required site/service                                        | Purpose for FacultyOS                                                           | Configuration prerequisites                                                                                                                   |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Tenant isolation           | FacultyOS application and database                           | Prevent one university from accessing another university's records.             | Define tenant boundaries in the data model and enforce them in every read, write, background job, attachment operation, and support workflow. |
| FERPA contractual controls | University agreement + reviewed DPA                          | Establish the permitted processing and handling of education records.           | Define the university's control over records, authorized uses, disclosure restrictions, subprocessors, and retention/deletion obligations.    |
| Audit trail                | Durable database and controlled log archive                  | Demonstrate what happened during policy evaluations and administrative actions. | Use append-oriented or otherwise tamper-resistant records, restrict modification, and test audit completeness.                                |
| Retention and deletion     | Application database, object storage, queues, logs, backups  | Meet contractual retention schedules and support lawful deletion.               | Define retention by data category and account for backup expiry, logs, exports, and queued messages.                                          |
| Incident response          | Internal runbooks + customer communication channels          | Respond to unauthorized access, data exposure, and outages.                     | Assign incident owners, define escalation, preserve evidence, and agree on contractual notification timelines.                                |
| Disaster recovery          | Database and object-storage recovery procedures              | Restore the service and data following an outage or corruption.                 | Define recovery point and recovery time objectives; conduct documented restore tests.                                                         |
| Security assurance         | Independent security assessment and university vendor review | Provide evidence beyond marketing claims.                                       | Conduct risk assessment, penetration testing, remediation tracking, and repeatable release-security checks.                                   |
| Accessibility              | Product testing and remediation process                      | Meet institutional accessibility requirements.                                  | Test keyboard navigation, screen-reader flows, form errors, contrast, and applicable WCAG requirements.                                       |

For U.S. university customers, the Department of Education explains that the FERPA school-official exception has conditions, including the institution's direct control over a contractor's use and maintenance of education records. FacultyOS should have its intended contractual role reviewed rather than claiming compliance solely because data is encrypted.

![](https://www.google.com/s2/favicons?domain=https://studentprivacy.ed.gov\&sz=32)

Protecting Student Privacy

+1

## 12. Prioritized implementation plan

Not every service in this checklist must be purchased immediately. Separate essential controls from optional enterprise enhancements.

## Phase 1 — Required before handling real student data

Use this checklist to track your production blockers.

Register the production domain and configure Cloudflare custom domains, HTTPS, and DNS.

Deploy separate production and staging environments with controlled release and rollback.

Implement institutional-ready authentication, authorization, and verified tenant isolation.

Choose and configure durable database and private attachment storage.

Version policies and persist complete decision/audit records.

Configure secret management, API protection, upload validation, and rate limits.

Set up transactional email authentication and reliable notification processing.

Publish accurate privacy, terms, security, retention, and incident-contact information.

Test backups, restoration, tenant isolation, access revocation, and incident response.

0 of 9 completed

## Phase 2 — Required for the first institutional rollout

Complete at least one institutional SSO integration and test account lifecycle management.

Configure monitored queues, retries, dead-letter handling, and idempotent jobs.

Connect error tracking, uptime monitoring, security alerts, and incident communications.

Complete a security review and provide the university with architecture and data-flow documentation.

Agree on the DPA, subprocessor disclosures, retention, and incident notification requirements.

Test ERP integration in a sandbox if it is part of the signed deployment scope.

0 of 6 completed

## Phase 3 — Scale and enterprise expansion

Add tenant-specific subdomains and optional university vanity domains.

Automate provisioning through SCIM where supported and required.

Implement enterprise billing and procurement workflows if commercially applicable.

Establish formal uptime commitments, service reviews, and an enterprise status page.

Add independent audit evidence and certifications if required by target institutions.

Evaluate advanced observability, centralized secrets, and dedicated integration infrastructure.

0 of 6 completed

## 13. Recommended initial stack for FacultyOS

For an initial Cloudflare Workers deployment, this is a reasonable starting architecture—not a claim that these services are already configured.

| Layer                             | Initial choice                                                     | Additional services only when needed                                         |
| --------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| Domain, DNS, TLS, edge protection | Cloudflare                                                         | Advanced enterprise controls based on risk and plan requirements             |
| Application/API                   | Cloudflare Workers                                                 | Separate Workers for security or operational boundaries                      |
| Database                          | Cloudflare D1, after validating workload and recovery requirements | Neon or another managed PostgreSQL service if relational needs justify it    |
| Attachments                       | Private Cloudflare R2 bucket                                       | External object storage if contractual or residency requirements demand it   |
| Background processing             | Cloudflare Queues + dead-letter queue                              | Workflows for long-running multi-step operations                             |
| Identity                          | Auth0 or direct institutional OIDC/SAML integration                | Additional provider-specific connectors for university customers             |
| Email                             | Postmark or Resend                                                 | Another provider if institutional delivery requirements demand it            |
| Payments                          | Existing Paddle integration, if confirmed operational              | Stripe Billing or invoicing workflows when required                          |
| Monitoring                        | Cloudflare observability + Sentry                                  | Axiom or Datadog where operational requirements justify the added service    |
| Secrets                           | Workers secrets                                                    | Secrets Store or an external vault if centralized governance is needed       |
| Compliance and trust              | Public privacy/security pages, DPA, subprocessor register          | Formal independent assurance and certifications where customers require them |

D1 has documented point-in-time recovery, while R2 supports private-by-default buckets and controlled access patterns. Validate the specific backup windows, object lifecycle configuration, and restoration procedures against your recovery targets.

![](https://www.google.com/s2/favicons?domain=https://developers.cloudflare.com\&sz=32)

Cloudflare D1 docs

+2

## Final recommendation

Prioritize security boundaries, durable and reproducible policy decisions, tenant isolation, institutional identity, recovery, and contractual privacy controls before investing in extra domains, paid monitoring platforms, or multiple overlapping databases.

For the current route structure, the immediate review should focus on `/api/public/c/[courseToken]/requests`, `/api/attachments/[attachmentId]`, `/api/webhooks/paddle`, `/api/auth/[...all]`, `/r/[requestToken]`, and `/requests/[requestId]`. These endpoints represent important trust boundaries; test authorization, token leakage, replay, cross-tenant access, and failure recovery for each before production onboarding.

The goal is not to subscribe to every service listed above. It is to establish a verifiable control for every production risk, choose the smallest reliable service stack that implements those controls, and provide evidence that the controls work.
