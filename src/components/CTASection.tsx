import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Sparkles } from "lucide-react";

const CTASection = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleGetStarted = () => {
    if (user && !loading) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-primary-900 to-primary-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-grid-pattern bg-[length:60px_60px]" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-medium">Join 50,000+ marketers</span>
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              Advertising Strategy?
            </span>
          </motion.h2>

          <motion.p 
            className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Start creating high-converting ads with AI today. No credit card required, 
            14-day free trial, and cancel anytime.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Button 
              size="xl" 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold group min-w-64"
              onClick={handleGetStarted}
              disabled={loading}
            >
              {loading ? "Loading..." : user ? "Go to Dashboard" : "Get Started For Free"}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="border-white/30 text-white hover:bg-white/10 min-w-64"
              onClick={() => navigate("/auth")}
              disabled={loading}
            >
              {user ? "Dashboard" : "Schedule Demo"}
            </Button>
          </motion.div>

          <motion.div 
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto text-white/80"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">14-Day</div>
              <div className="text-sm">Free Trial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">No</div>
              <div className="text-sm">Setup Fees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">Cancel</div>
              <div className="text-sm">Anytime</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;