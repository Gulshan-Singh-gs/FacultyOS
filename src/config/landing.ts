export interface NavItem {
  label: string;
  href: string;
}

export interface PainPoint {
  id: string;
  iconName: "Inbox" | "Clock" | "Scale" | "FileText";
  title: string;
  description: string;
  statCallout?: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  subtitle: string;
  description: string;
}

export interface FeatureItem {
  id: string;
  iconName: "Zap" | "Inbox" | "Clock" | "Scale" | "GraduationCap" | "FileCheck2";
  title: string;
  description: string;
  badge?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  priceMonthly: string;
  priceSemester?: string;
  billingNote: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  isPopular?: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface FooterColumn {
  title: string;
  links: { label: string; href: string; isExternal?: boolean }[];
}

export const LANDING_CONFIG = {
  meta: {
    title: "FacultyOS — Automate Student Requests & Protect Your Time",
    description:
      "FacultyOS turns course syllabi into deterministic policy engines that triage extensions, regrades, and meetings instantly. Start free for 1 course forever.",
    canonicalUrl: "https://facultyos.com",
  },
  announcement: {
    enabled: true,
    text: "Private beta cohort open — 1 course free forever.",
    ctaLabel: "Get Started",
    ctaHref: "/signup",
  },
  hero: {
    badge: "Zero medical data • Deterministic policy engine • Cloudflare edge",
    headline: "Stop answering the same email 400 times.",
    subhead:
      "FacultyOS turns your syllabus into a deterministic policy engine that triages student extensions, regrades, and meetings instantly — with full audit trails and your weekends intact.",
    primaryCta: {
      label: "Start free — 1 course forever",
      href: "/signup",
    },
    secondaryCta: {
      label: "Try the live policy demo",
      href: "#simulator",
    },
    trustLine:
      "No credit card required • FERPA-aligned data minimization • Works alongside your university ERP",
  },
  pilotQuotes: [] as Array<{ author: string; role: string; institution: string; quote: string }>,
  painPoints: [
    {
      id: "pain-inbox",
      iconName: "Inbox",
      title: "Repetitive Email Overload",
      description:
        "400+ repetitive emails per term requesting exceptions already detailed on page 2 of your syllabus, consuming prime research and teaching hours.",
    },
    {
      id: "pain-weekends",
      iconName: "Clock",
      title: "Midnight & Weekend Intrusions",
      description:
        "Panic requests submitted at 2 AM on a Saturday expecting instant replies, blurring boundaries and turning your weekends into unpaid administrative time.",
    },
    {
      id: "pain-regrades",
      iconName: "Scale",
      title: "Unsubstantiated Grade Grubbing",
      description:
        "Subjective grade appeals without rubric citations that force faculty and teaching assistants into exhausting back-and-forth arguments.",
    },
    {
      id: "pain-ledger",
      iconName: "FileText",
      title: "Unseen, Uncounted Service Work",
      description:
        "Countless hours spent advising students, mediating conflicts, and reviewing exceptions disappear without record at annual tenure and service reviews.",
    },
  ] as PainPoint[],
  howItWorks: [
    {
      step: 1,
      title: "Share your secure course link",
      subtitle: "Zero student accounts required",
      description:
        "Publish your unique portal URL on your syllabus or LMS. Students submit structured requests through an accessible, mobile-first intake flow.",
    },
    {
      step: 2,
      title: "Deterministic engine evaluates rules",
      subtitle: "100% mathematical consistency",
      description:
        "Your syllabus policies evaluate conditions in milliseconds. Standard cases auto-approve with cited rules; edge cases route with draft explanations.",
    },
    {
      step: 3,
      title: "Review genuine edge cases",
      subtitle: "Weekends & boundaries protected",
      description:
        "Routine tasks resolve quietly. You review only genuine exceptions in a calm triage queue, with complete audit logs and explainable decision records.",
    },
  ] as WorkflowStep[],
  features: [
    {
      id: "feat-engine",
      iconName: "Zap",
      title: "Deterministic Policy Engine",
      description:
        "Mathematical rule evaluation with zero AI black-box hallucinations. Rules execute transparently with immutable snapshots and audit logs.",
      badge: "Core Architecture",
    },
    {
      id: "feat-inbox",
      iconName: "Inbox",
      title: "Calm Triage Queue",
      description:
        "A unified inbox across all your courses. Filter by urgency, review student rubric citations, and decide with one-click actions.",
      badge: "NeuGlass UI",
    },
    {
      id: "feat-boundaries",
      iconName: "Clock",
      title: "Boundary & Weekend Shield",
      description:
        "Automatically defers non-emergency weekend and late-night requests to official office hours. Students see polite, SLA-compliant notice.",
      badge: "Work-Life Defense",
    },
    {
      id: "feat-regrades",
      iconName: "Scale",
      title: "Regrade Defense Workflow",
      description:
        "Requires students to identify specific rubric items, quote their submitted text, and explain the discrepancy before submitting an appeal.",
      badge: "Fairness Assured",
    },
    {
      id: "feat-ledger",
      iconName: "GraduationCap",
      title: "Career & Service Ledger",
      description:
        "Automatically captures service hours, mentoring load, and administrative tasks. Export dossier-ready summaries for annual appraisals.",
      badge: "Tenure Support",
    },
    {
      id: "feat-reports",
      iconName: "FileCheck2",
      title: "Audit & Accreditation Reports",
      description:
        "Generate clean, FERPA-aligned CSV and PDF audit exports with complete event logs, turnaround SLAs, and policy compliance records.",
      badge: "Institutional Audit",
    },
  ] as FeatureItem[],
  erpCompanion: {
    headline: "A companion for your university ERP, not a replacement.",
    description:
      "FacultyOS sits between your inbox and institutional systems like Canvas, Blackboard, or Banner. It handles the chaotic conversational triage, then exports clean CSV data whenever your registrar requires it.",
  },
  pricing: {
    tiers: [
      {
        id: "tier-free",
        name: "Individual",
        priceMonthly: "₹0",
        billingNote: "Free forever for 1 course",
        description: "Perfect for professors testing policy automation in an active course.",
        features: [
          "1 active course",
          "5 deterministic policies",
          "Structured student intake portal",
          "Boundary & weekend shield",
          "Basic audit log exports",
          "Community documentation",
        ],
        ctaLabel: "Start Free",
        ctaHref: "/signup",
        isPopular: false,
      },
      {
        id: "tier-pro",
        name: "Professor Pro",
        priceMonthly: "₹299/mo",
        priceSemester: "₹1,499 / semester",
        billingNote: "Billed monthly or save with Semester Pass",
        description: "For active faculty managing full course loads, TAs, and committee commitments.",
        features: [
          "Up to 20 active courses",
          "50 deterministic policies per course",
          "TA delegation & role routing",
          "Career ledger service tracking",
          "One-click tenure dossier reports",
          "Priority Cloudflare edge queues",
          "7-day money-back guarantee",
        ],
        ctaLabel: "Upgrade to Pro",
        ctaHref: "/signup?plan=pro",
        isPopular: true,
      },
      {
        id: "tier-dept",
        name: "Department",
        priceMonthly: "₹24,999/yr",
        billingNote: "Annual institutional invoice",
        description: "For academic departments, deans, and institutions standardizing policy fairness.",
        features: [
          "Up to 200 active courses across department",
          "Unlimited deterministic policies",
          "Unified syllabus policy templates",
          "Department-wide SLA & workload analytics",
          "Accreditation & audit export suite",
          "Dedicated institutional onboarding",
        ],
        ctaLabel: "Contact Department Sales",
        ctaHref: "mailto:sales@facultyos.com?subject=Department%20Inquiry",
        isPopular: false,
      },
    ] as PricingTier[],
    riskReversal: "Transparent pricing • 7-day money-back guarantee on paid plans • Zero hidden fees",
  },
  faqs: [
    {
      id: "faq-what-is",
      question: "What is FacultyOS?",
      answer:
        "FacultyOS is a privacy-first operations platform for university professors. It converts syllabus policies into deterministic rules that automatically triage student requests such as extensions, regrades, and meetings, while tracking teaching, service, and research evidence for annual reviews.",
    },
    {
      id: "faq-medical",
      question: "Does FacultyOS collect medical or mental-health information?",
      answer:
        "No. FacultyOS strictly blocks medical and disability data collection to protect student privacy and university compliance. All health-related inquiries immediately display a calm redirect banner pointing directly to official campus health and student support services.",
    },
    {
      id: "faq-erp",
      question: "Does FacultyOS replace our university ERP?",
      answer:
        "No. FacultyOS is an intelligent front-door companion to platforms like Canvas, Blackboard, or Banner. It filters repetitive inbound communications before they hit your inbox, then allows one-click export of clean records whenever your department needs them.",
    },
    {
      id: "faq-ai-decisions",
      question: "Does AI make decisions about my students?",
      answer:
        "No. Decisions are made entirely by deterministic rules that you define from your syllabus. Artificial intelligence never auto-sends messages or approves requests; it only drafts optional suggestion notes for the professor to review.",
    },
    {
      id: "faq-data-protection",
      question: "How does FacultyOS protect student data?",
      answer:
        "FacultyOS adheres to strict FERPA data minimization principles. Student access is granted through ephemeral hashed tokens without requiring accounts, identity emails are cryptographically hashed, and data is stored on localized Cloudflare edge infrastructure.",
    },
    {
      id: "faq-cost",
      question: "How much does FacultyOS cost?",
      answer:
        "FacultyOS is free forever for one course with up to five policies. Professor Pro costs ₹299 per month or ₹1,499 per semester for up to 20 courses, and Department plans start at ₹24,999 annually.",
    },
    {
      id: "faq-setup-time",
      question: "How long does setup take?",
      answer:
        "Under ten minutes. You can create a course, choose from pre-built syllabus templates such as 48-hour extension rules, and copy your secure student portal link immediately without IT intervention or software installations.",
    },
    {
      id: "faq-student-accounts",
      question: "Do students need accounts?",
      answer:
        "No. Students access their course intake portal through secure, tokenized links distributed via your syllabus or course site. They receive an email verification token for submission tracking without ever needing password credentials.",
    },
  ] as FAQItem[],
  footerColumns: [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Policy Simulator", href: "#simulator" },
        { label: "Pricing", href: "/pricing" },
        { label: "Changelog", href: "/changelog" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "/login" },
        { label: "Syllabus Policy Guide", href: "#simulator" },
        { label: "LLM Machine Summary", href: "/llms.txt" },
        { label: "Full LLM Knowledgebase", href: "/llms-full.txt" },
      ],
    },
    {
      title: "Legal & Trust",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Security & FERPA", href: "/security" },
      ],
    },
    {
      title: "Contact",
      links: [
        { label: "Faculty Support", href: "mailto:support@facultyos.com" },
        { label: "Institutional Inquiries", href: "mailto:sales@facultyos.com" },
      ],
    },
  ] as FooterColumn[],
};
