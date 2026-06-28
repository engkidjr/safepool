import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useLocation,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { LayoutDashboard, LineChart, Target, Sun, Moon } from "lucide-react";
import { feedback } from "../lib/feedback";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { useFirebaseSync } from "../hooks/useFirebaseSync";
import { useApp } from "../lib/store";

// ── Dark mode hook ──────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("safepool_dark_mode");
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("safepool_dark_mode", String(dark));
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);
  return { dark, toggle };
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes",
        },
        { title: "SafePool — Student Financial Engine" },
        {
          name: "description",
          content:
            "A frictionless local-first money tracker for students. Tap, save, and watch your pool grow.",
        },
        {
          property: "og:title",
          content: "SafePool — Student Financial Engine",
        },
        {
          property: "og:description",
          content:
            "A frictionless local-first money tracker for students. Track spending, save for goals, sync across devices.",
        },
        {
          property: "og:image",
          content: "https://safepool-8857f.web.app/og-image.png",
        },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "SafePool" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          name: "twitter:image",
          content: "https://safepool-8857f.web.app/og-image.png",
        },
        {
          name: "twitter:title",
          content: "SafePool — Student Financial Engine",
        },
        {
          name: "twitter:description",
          content:
            "Track your spend, save for goals, sync across devices.",
        },
        { name: "theme-color", content: "#10b981" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        {
          name: "apple-mobile-web-app-status-bar-style",
          content: "black-translucent",
        },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        {
          rel: "icon",
          href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230B0D10'/><text y='72' x='18' font-size='60'>💰</text></svg>",
          type: "image/svg+xml",
        },
        { rel: "preconnect", href: "https://api.fontshare.com" },
        {
          rel: "stylesheet",
          href: "https://api.fontshare.com/v2/css?f[]=clash-display@500,600,700&display=swap",
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap",
        },
      ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        {/* JSON-LD WebApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "SafePool",
              description:
                "A frictionless local-first money tracker for students.",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
        {/* Inline dark-mode initialiser — runs before CSS, prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('safepool_dark_mode');var d=s!==null?s==='true':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const theme = useApp((s) => s.theme);
  const setTheme = useApp((s) => s.setTheme);

  // Run the global Firebase synchronization hook
  useFirebaseSync();

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Skip-to-content accessibility link */}
      <a href="#maincontent" className="skip-link">
        Skip to main content
      </a>

      <div className="pb-24 md:pb-0 min-h-screen relative overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.25, 1, 0.5, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/80 backdrop-blur-xl border-t border-border/40 px-4 py-2.5 flex items-center justify-around"
        aria-label="Footer navigation"
      >
        <Link
          to="/"
          onClick={() => feedback.tap()}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all relative ${
            location.pathname === "/"
              ? "text-emerald font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LayoutDashboard className="size-5" aria-hidden="true" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
          {location.pathname === "/" && (
            <motion.div
              layoutId="mobile-nav-bubble"
              className="absolute -inset-1 bg-emerald/10 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </Link>
        <Link
          to="/activity"
          onClick={() => feedback.tap()}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all relative ${
            location.pathname === "/activity"
              ? "text-emerald font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <LineChart className="size-5" aria-hidden="true" />
          <span className="text-[10px] tracking-tight">Activity</span>
          {location.pathname === "/activity" && (
            <motion.div
              layoutId="mobile-nav-bubble"
              className="absolute -inset-1 bg-emerald/10 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </Link>
        <Link
          to="/goal"
          onClick={() => feedback.tap()}
          className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all relative ${
            location.pathname === "/goal"
              ? "text-emerald font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Target className="size-5" aria-hidden="true" />
          <span className="text-[10px] tracking-tight">Set Goal</span>
          {location.pathname === "/goal" && (
            <motion.div
              layoutId="mobile-nav-bubble"
              className="absolute -inset-1 bg-emerald/10 rounded-xl -z-10"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}
        </Link>
      </nav>

      {/* Sonner Toast Container */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "var(--surface-2)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            fontSize: "13px",
            fontFamily: "var(--font-sans)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
