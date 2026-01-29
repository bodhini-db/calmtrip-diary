import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-mint/30 via-background to-background p-6">
      <motion.div 
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-mint flex items-center justify-center">
          <MapPin className="w-12 h-12 text-forest" />
        </div>
        <h1 className="font-display font-bold text-3xl text-foreground mb-3">
          Lost on the Trail
        </h1>
        <p className="text-muted-foreground mb-8">
          Looks like this path doesn't exist. Let's get you back to familiar ground.
        </p>
        <Link to="/home">
          <Button variant="calm" size="lg">
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;
