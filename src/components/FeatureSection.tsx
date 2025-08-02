import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const FeatureSection = () => {
  const features = [
    {
      title: "AI-Powered Content",
      description: "Generate compelling ad copy, visuals, and video content automatically using advanced AI algorithms.",
      icon: "🤖"
    },
    {
      title: "Multi-Platform Reach",
      description: "Deploy your ads across Facebook, Instagram, TikTok, YouTube, Google Ads, and more from one dashboard.",
      icon: "🌐"
    },
    {
      title: "Smart Targeting",
      description: "AI-driven audience analysis and targeting to reach the right people at the right time.",
      icon: "🎯"
    },
    {
      title: "Real-Time Analytics",
      description: "Track performance with detailed analytics, A/B testing, and optimization recommendations.",
      icon: "📊"
    },
    {
      title: "Brand Templates",
      description: "Create consistent brand experiences with customizable templates for all your content types.",
      icon: "🎨"
    },
    {
      title: "Campaign Automation",
      description: "Set up automated campaigns that optimize themselves based on performance data.",
      icon: "⚡"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Powerful Features for Modern Advertising
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to create, manage, and optimize your advertising campaigns 
            across all major platforms with the power of artificial intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-soft transition-all duration-300 hover:-translate-y-2 border-0 bg-gradient-card"
            >
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;