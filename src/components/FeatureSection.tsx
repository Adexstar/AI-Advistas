import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { TrendingUp, Target, BarChart3, Users, LayoutGrid, Star } from "lucide-react";

const FeatureSection = () => {
  const features = [
    {
      title: "AI-Powered Ad Creation",
      description: "Smart content recommendations with platform-specific formatting and real-time content optimization powered by advanced AI algorithms.",
      icon: TrendingUp,
      color: "text-blue-500"
    },
    {
      title: "Multi-Platform Campaigns",
      description: "Unified dashboard for all platforms with cross-platform performance tracking and intelligent budget allocation optimization.",
      icon: Target,
      color: "text-green-500"
    },
    {
      title: "Advanced Analytics",
      description: "Real-time performance metrics with audience response analysis and comprehensive ROI tracking and reporting.",
      icon: BarChart3,
      color: "text-purple-500"
    },
    {
      title: "Audience Targeting",
      description: "Demographic segmentation with behavioral targeting options and interest-based audience matching for maximum reach.",
      icon: Users,
      color: "text-orange-500"
    },
    {
      title: "Landing Page Builder",
      description: "Drag-and-drop page builder with conversion-optimized templates and built-in A/B testing capabilities.",
      icon: LayoutGrid,
      color: "text-pink-500"
    },
    {
      title: "Flexible Pricing",
      description: "Tiered subscription plans with pay-per-use credit packs and transparent pricing with no hidden fees.",
      icon: Star,
      color: "text-yellow-500"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100
      }
    }
  };

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Powerful Features for Modern Advertising
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to create, manage, and optimize your advertising campaigns 
            across all major platforms with the power of artificial intelligence.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div key={index} variants={itemVariants}>
                <Card className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-2 border-border/50 bg-white/80 backdrop-blur-sm h-full">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-white to-gray-50 border border-border/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`w-6 h-6 ${feature.color}`} />
                    </div>
                    <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default FeatureSection;