import React from "react";
import { LANDING_CONFIG } from "@/config/landing";

export function LandingJsonLd() {
  const schemaOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FacultyOS",
    url: "https://facultyos.com",
    logo: "https://facultyos.com/icon.png",
    description: "Privacy-first operations platform for university professors.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "support@facultyos.com",
      contactType: "customer support",
    },
  };

  const schemaWebSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FacultyOS",
    url: "https://facultyos.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://facultyos.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  const schemaSoftwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "FacultyOS",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Cloud, Web",
    offers: [
      {
        "@type": "Offer",
        name: "Individual Free Tier",
        price: "0",
        priceCurrency: "INR",
        description: "1 active course free forever with 5 deterministic syllabus policies.",
      },
      {
        "@type": "Offer",
        name: "Professor Pro",
        price: "299",
        priceCurrency: "INR",
        billingDuration: "P1M",
        description: "Up to 20 courses, 50 policies per course, career ledger, and dossier reports.",
      },
    ],
    featureList: [
      "Deterministic syllabus policy engine",
      "Calm student request triage inbox",
      "Work-life boundary and weekend deferral shield",
      "Regrade defense rubric citation verification",
      "Career and service ledger for tenure dossiers",
    ],
  };

  const schemaFaqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: LANDING_CONFIG.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const schemaHowTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How FacultyOS Automates Student Request Triage",
    description: "A three-step workflow converting syllabus policies into deterministic student request triage.",
    step: LANDING_CONFIG.howItWorks.map((step) => ({
      "@type": "HowToStep",
      position: step.step,
      name: step.title,
      text: step.description,
    })),
  };

  const schemaBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://facultyos.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Pricing",
        item: "https://facultyos.com/pricing",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrganization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebSite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaSoftwareApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFaqPage) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaHowTo) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumbs) }}
      />
    </>
  );
}
