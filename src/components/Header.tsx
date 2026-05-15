import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Home, Scan, UserCircle, LogOut, BarChart3 } from "lucide-react";
import { isLunchTime, getLunchTimeMessage } from "@/lib/timeRestrictions";

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
            <img
              src="/eaglelogo.png"
              alt="Eastside Eats Eagle Logo"
              className="w-10 h-10 object-contain"
            />
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
            
            {isLunchTime() ? (
              <div title={getLunchTimeMessage()}>
                <Button
                  variant={location.pathname === "/sign-out" ? "default" : "ghost"}
                  size="default"
                  disabled
                >
                  <Scan className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan Snack</span>
                </Button>
              </div>
            ) : (
              <Button
                asChild
                variant={location.pathname === "/sign-out" ? "default" : "ghost"}
                size="default"
              >
                <Link to="/sign-out">
                  <Scan className="w-4 h-4" />
                  <span className="hidden sm:inline">Scan Snack</span>
                </Link>
              </Button>
            )}

             <Button
                asChild
                variant={location.pathname === "/dashboard" ? "default" : "ghost"}
                size="default"
              >
                <Link to="/dashboard">
                  <BarChart3 className="w-4 h-4" />
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
