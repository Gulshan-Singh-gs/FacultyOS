export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/svg+xml";
export const alt = "FacultyOS — Automate Student Requests & Protect Your Time";

export default function Image() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <radialGradient id="grad1" cx="25%" cy="25%" r="50%">
        <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
        <stop offset="100%" stop-color="#0B1020" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="grad2" cx="75%" cy="75%" r="50%">
        <stop offset="0%" stop-color="#22d3ee" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#0B1020" stop-opacity="0" />
      </radialGradient>
    </defs>
    
    <rect width="1200" height="630" fill="#0B1020" />
    <rect width="1200" height="630" fill="url(#grad1)" />
    <rect width="1200" height="630" fill="url(#grad2)" />
    
    <!-- Brand Icon -->
    <g transform="translate(80, 80)">
      <rect width="64" height="64" rx="16" fill="#18181B" stroke="#27272A" stroke-width="1.5" />
      <rect x="16" y="16" width="9" height="32" rx="2" fill="#F4F4F5" />
      <rect x="29" y="16" width="9" height="9" rx="2" fill="#8B5CF6" />
      <rect x="41" y="16" width="9" height="9" rx="2" fill="#A78BFA" />
      <rect x="29" y="28" width="9" height="9" rx="2" fill="#8B5CF6" />
      <circle cx="33.5" cy="43.5" r="3.5" fill="#34D399" />
      
      <text x="80" y="32" fill="#F9FAFB" font-family="system-ui, -apple-system, sans-serif" font-size="32" font-weight="800">FacultyOS</text>
      <text x="80" y="54" fill="#9CA3AF" font-family="system-ui, -apple-system, sans-serif" font-size="18">Operations Platform for University Professors</text>
    </g>
    
    <!-- Headline -->
    <g transform="translate(80, 240)">
      <text x="0" y="60" fill="#FFFFFF" font-family="system-ui, -apple-system, sans-serif" font-size="58" font-weight="900" letter-spacing="-0.03em">Stop answering the same email 400 times.</text>
      <text x="0" y="130" fill="#CBD5E1" font-family="system-ui, -apple-system, sans-serif" font-size="24">Deterministic syllabus rules that triage student extensions, regrades, and meetings instantly.</text>
    </g>
    
    <!-- Badges -->
    <g transform="translate(80, 480)">
      <!-- Badge 1 -->
      <rect x="0" y="0" width="280" height="46" rx="12" fill="rgba(99, 102, 241, 0.15)" stroke="rgba(99, 102, 241, 0.4)" />
      <text x="24" y="28" fill="#A5B4FC" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">Deterministic Policy Engine</text>
      
      <!-- Badge 2 -->
      <rect x="300" y="0" width="200" height="46" rx="12" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.4)" />
      <text x="324" y="28" fill="#6EE7B7" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">Zero Medical Data</text>
      
      <!-- Badge 3 -->
      <rect x="520" y="0" width="240" height="46" rx="12" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255, 255, 255, 0.15)" />
      <text x="544" y="28" fill="#F1F5F9" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">1 Course Free Forever</text>
    </g>
  </svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
