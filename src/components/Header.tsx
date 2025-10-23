import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ClipboardList, UserCircle } from "lucide-react";

const Header = () => {
  const location = useLocation();
  
  return (
    <header className="bg-card shadow-sm border-b-2 border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">SS</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">SmartSnack</h1>
          </Link>
          
          <nav className="flex gap-2">
            <Button
              asChild
              variant={location.pathname === "/" ? "default" : "ghost"}
              size="default"
            >
              <Link to="/">
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant={location.pathname === "/sign-out" ? "default" : "ghost"}
              size="default"
            >
              <Link to="/sign-out">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Link>
            </Button>
            
            <Button
              asChild
              variant={location.pathname === "/admin" ? "default" : "ghost"}
              size="default"
            >
              <Link to="/admin">
                <UserCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
