import { Facebook, Instagram, Twitter, Linkedin, Youtube } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "Product",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Workflow", href: "#workflow" },
        { name: "Template Library", href: "/templates" },
        { name: "Campaign Operations", href: "/campaigns" },
        { name: "Create Flow", href: "/create" }
      ]
    },
    {
      title: "Resources", 
      links: [
        { name: "Saved Templates", href: "/templates" },
        { name: "Quick Draft", href: "/create" },
        { name: "Visual Customizer", href: "/templates" },
        { name: "Billing", href: "/billing" },
        { name: "Settings", href: "/settings" },
        { name: "Dashboard", href: "/dashboard" }
      ]
    },
    {
      title: "Company",
      links: [
        { name: "Why AdVista", href: "#about" },
        { name: "Pricing", href: "#pricing" },
        { name: "Product Surface", href: "#features" },
        { name: "Workflow", href: "#workflow" },
        { name: "Sign In", href: "/auth" },
        { name: "Get Started", href: "/auth" }
      ]
    }
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", name: "Facebook" },
    { icon: Instagram, href: "#", name: "Instagram" },
    { icon: Twitter, href: "#", name: "Twitter" },
    { icon: Linkedin, href: "#", name: "LinkedIn" },
    { icon: Youtube, href: "#", name: "YouTube" }
  ];

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-br from-primary-900 via-primary-800 to-primary text-background">
      <div className="absolute inset-0 opacity-40">
        <div className="hero-grid absolute inset-0" />
        <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="page-container relative z-10 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 backdrop-blur-xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-primary-800 text-sm font-bold shadow-lg">A</span>
              <div>
                <h2 className="text-2xl font-bold tracking-[-0.04em] text-white">AdVista</h2>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/60">Creative Ops Workspace</p>
              </div>
            </div>
            <p className="mb-6 max-w-md leading-relaxed text-white/72">
              One calmer workspace for AI draft generation, template customization, and day-to-day campaign operations.
            </p>
            
            <div className="flex items-center gap-4">
              {socialLinks.map((social, index) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/18"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href}
                      className="text-white/72 transition-colors hover:text-accent"
                    >
                      {link.name}
                    </a>
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
              <a href="#" className="text-white/55 transition-colors hover:text-accent">
                Privacy Policy
              </a>
              <a href="#" className="text-white/55 transition-colors hover:text-accent">
                Terms of Service
              </a>
              <a href="#" className="text-white/55 transition-colors hover:text-accent">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;