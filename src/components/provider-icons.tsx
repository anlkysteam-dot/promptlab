import type { SVGProps } from "react";

const iconClass = "h-5 w-5 shrink-0";

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" aria-hidden {...props}>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-.9 2.4-1.9 3.1l3 2.3c1.8-1.6 2.8-4 2.8-6.8 0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M12 21c2.6 0 4.8-.9 6.4-2.4l-3-2.3c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2l-3.1 2.4C5.1 19.4 8.3 21 12 21z"
      />
      <path
        fill="#4A90E2"
        d="M6.4 13.1c-.2-.6-.3-1.2-.3-1.9s.1-1.3.3-1.9L3.3 6.9C2.5 8.4 2 10.2 2 12s.5 3.6 1.3 5.1l3.1-2.4z"
      />
      <path
        fill="#FBBC05"
        d="M12 6.4c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.8 3.9 14.6 3 12 3 8.3 3 5.1 4.6 3.3 6.9l3.1 2.4c.8-2.4 3-4.2 5.6-4.2z"
      />
    </svg>
  );
}

export function MicrosoftIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" aria-hidden {...props}>
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

export function AppleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.89-3.63-.89-1.746 0-2.34.91-3.67.91-1.93 0-3.35-1.83-4.35-3.68-2.37-4.08-1.14-9.46.534-13.6.785-1.732 2.183-3.432 3.868-3.432 1.762 0 2.309.89 3.69.89 1.25 0 2.04-.91 3.67-.91.878 0 2.008.33 2.71 1.23-2.35 1.29-2.66 4.72-2.66 6.96 0 1.7.63 3.11 1.35 4.6.58 1.08 1.98 1.77 3.15 2.29.24.73.37 1.49.39 2.27 0 .11-.02.23-.04.36z" />
    </svg>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}
