import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ClipboardList, UserCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { BarChart } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };
  
  return (
    <header className="bg-card shadow-sm border-b-2 border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">EE</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Eastside Eats</h1>
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
                <span className="hidden sm:inline">Scan Snack</span>
              </Link>
            </Button>

             <Button
                asChild
                variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                size="default"
              >
                <Link to="/dashboard">
                <BarChart className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
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
            
            {user && (
              <Button
                variant="ghost"
                size="default"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
