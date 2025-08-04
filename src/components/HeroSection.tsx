import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary-900 to-primary-800">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:60px_60px]" />
      </div>
      
      <motion.div 
        className="relative z-20 container mx-auto px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left">
            <motion.div 
              variants={itemVariants}
              className="inline-flex items-center px-4 py-2 bg-gradient-glass backdrop-blur-sm rounded-full border border-white/20 mb-6"
            >
              <span className="text-sm font-medium text-white">🤖 AI-Powered</span>
            </motion.div>
            
            <motion.h1 
              variants={itemVariants}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight"
            >
              Transform Your 
              <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                {" "}Advertising
              </span>
              <br />
              with AI-Powered Insights
            </motion.h1>
            
            <motion.p 
              variants={itemVariants}
              className="text-xl text-white/80 mb-8 max-w-lg leading-relaxed"
            >
              Create compelling ads for your brand, music, movies, and videos. Deploy across all major platforms with intelligent targeting and real-time optimization.
            </motion.p>
            
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Button 
                size="xl" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate("/auth")}
              >
                Login
              </Button>
            </motion.div>

            {/* Platform Icons */}
            <motion.div variants={itemVariants} className="flex items-center gap-6">
              <span className="text-white/60 text-sm">Advertise on:</span>
              <div className="flex items-center gap-4">
                <Facebook className="w-6 h-6 text-white/70 hover:text-white transition-colors" />
                <Instagram className="w-6 h-6 text-white/70 hover:text-white transition-colors" />
                <Twitter className="w-6 h-6 text-white/70 hover:text-white transition-colors" />
                <Youtube className="w-6 h-6 text-white/70 hover:text-white transition-colors" />
                <span className="text-white/60 text-sm">+8 more</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <motion.div 
            variants={itemVariants}
            className="relative"
          >
            <div className="relative bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 shadow-2xl">
              <div className="absolute -top-4 -right-4 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-semibold">
                AI-Powered
              </div>
              
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="h-4 bg-gray-200 rounded mb-3"></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-20 bg-blue-100 rounded"></div>
                  <div className="h-20 bg-green-100 rounded"></div>
                  <div className="h-20 bg-purple-100 rounded"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-white">
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-400">$2.4K</div>
                  <div className="text-sm opacity-80">Revenue</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">15.2%</div>
                  <div className="text-sm opacity-80">ROI</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;