import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: "01",
      title: "Create Your Campaign",
      description: "Define your target audience, set campaign objectives, and establish your budget with our intuitive campaign builder."
    },
    {
      number: "02", 
      title: "Launch & Monitor",
      description: "Deploy across multiple platforms simultaneously and track real-time performance with comprehensive analytics dashboard."
    },
    {
      number: "03",
      title: "Optimize & Scale",
      description: "Leverage AI-powered recommendations to maximize ROI and scale successful campaigns across new audiences and platforms."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.3
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
    <section className="py-20 bg-zinc-50">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            How It <span className="bg-gradient-primary bg-clip-text text-transparent">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Three simple steps to transform your advertising strategy and maximize your reach across all major platforms.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="relative"
            >
              <div className="bg-white rounded-2xl p-8 shadow-soft border border-border/50 h-full hover:shadow-glow transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    {step.number}
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-gradient-primary"></div>
                  <div className="w-0 h-0 border-l-4 border-l-primary border-y-2 border-y-transparent absolute right-0 top-1/2 transform -translate-y-1/2"></div>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;