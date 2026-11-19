import { Link } from "react-router-dom";

const Footer = () => {
  const footerSections = [
    {
      title: "Workspace",
      links: [
        { name: "Operating Lanes", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Workflow", href: "#workflow" },
        { name: "Template Library", href: "/templates" },
        { name: "Campaign Operations", href: "/campaigns" },
        { name: "Create Flow", href: "/create-ad" }
      ]
    },
    {
      title: "Launch Tools", 
      links: [
        { name: "Saved Templates", href: "/templates" },
        { name: "Quick Draft", href: "/create-ad" },
        { name: "Visual Customizer", href: "/templates" },
        { name: "Billing", href: "/billing" },
        { name: "Settings", href: "/settings" },
        { name: "Command Center", href: "/dashboard" }
      ]
    },
    {
      title: "Why AdVista",
      links: [
        { name: "Why Teams Switch", href: "#about" },
        { name: "Pricing", href: "#pricing" },
        { name: "Campaign Workflow", href: "#features" },
        { name: "Workflow", href: "#workflow" },
        { name: "Sign In", href: "/auth" },
        { name: "Get Started", href: "/auth" }
      ]
    }
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-br from-primary-900 via-primary-800 to-primary text-background">
      <div className="absolute inset-0 opacity-40">
        <div className="hero-grid absolute inset-0" />
        <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="page-container relative z-10 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-primary-800 text-sm font-bold shadow-lg">A</span>
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.04em] text-white">AdVista</h2>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">Campaign Command Workspace</p>
              </div>
            </div>
            <p className="mb-6 max-w-md leading-relaxed text-white/72">
              One calmer workspace for AI briefs, reusable creative systems, and day-to-day campaign decisions.
            </p>
            
            <p className="text-sm text-white/60">Social accounts are not connected from this site.</p>
          </div>

          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.href.startsWith("/") ? (
                      <Link to={link.href} className="text-white/72 transition-colors hover:text-primary">{link.name}</Link>
                    ) : (
                      <a href={link.href} className="text-white/72 transition-colors hover:text-primary">{link.name}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-sm text-white/55">
              © 2026 AdVista. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6 text-sm">
              <Link to="/legal/privacy" className="text-white/55 transition-colors hover:text-primary">Privacy Policy</Link>
              <Link to="/legal/terms" className="text-white/55 transition-colors hover:text-primary">Terms of Service</Link>
              <Link to="/legal/cookies" className="text-white/55 transition-colors hover:text-primary">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;