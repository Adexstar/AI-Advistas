import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const pages = {
  privacy: {
    title: "Privacy Policy",
    body: [
      "AdVista stores the account you create, the campaigns and creatives you save, and the settings you choose. That data lives in the Supabase project configured for this app.",
      "Sign-in uses your email and password. Password reset emails are sent by Supabase Auth when you request them.",
      "AI and stock-media calls leave this app only when a provider key is configured on the server. If a key is missing, the feature stops and tells you which key is required. The app does not invent a result in its place.",
      "Billing, when enabled, sends the checkout to Flutterwave. Card details are handled by that provider, not stored in the campaign workspace.",
    ],
  },
  terms: {
    title: "Terms of Service",
    body: [
      "AdVista is a campaign workspace for drafts, templates, brand kits, and the records you save to your account.",
      "You are responsible for the copy, media, and claims you publish. Connecting an ad platform and sending a live ad requires that platform's credentials. Those publishing adapters are not a substitute for the platform's own terms.",
      "Plan limits are enforced by the workspace when the quota function is available. A missing payment key keeps checkout unavailable rather than marking a plan as paid.",
      "These terms describe the product as it runs in this repository. Features marked Coming Soon are not part of the service yet.",
    ],
  },
  cookies: {
    title: "Cookie Policy",
    body: [
      "The app keeps your sign-in session in browser storage provided by Supabase Auth. That storage is required to stay signed in.",
      "Theme choice and a few interface preferences, such as a Coming Soon notify flag, are stored in local storage on this device.",
      "The app does not run a third-party advertising cookie on its own pages.",
    ],
  },
} as const;

const Legal = () => {
  const { doc } = useParams();
  const page = pages[(doc as keyof typeof pages) ?? "privacy"] ?? pages.privacy;

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container max-w-3xl py-10">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/">Back to home</Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{page.title}</h1>
        <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
          {page.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link className="text-primary hover:underline" to="/legal/privacy">Privacy</Link>
          <Link className="text-primary hover:underline" to="/legal/terms">Terms</Link>
          <Link className="text-primary hover:underline" to="/legal/cookies">Cookies</Link>
        </div>
      </div>
    </div>
  );
};

export default Legal;
