import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface Credentials {
  instagramUsername: string;
  instagramPassword: string;
}

export default function Sidebar() {
  const [location] = useLocation();

  const { data: credentials } = useQuery<Credentials>({
    queryKey: ['/api/credentials'],
  });

  const navItems = [
    { path: "/", label: "Dashboard", icon: "fas fa-chart-line" },
    { path: "/configuration", label: "Configuration", icon: "fas fa-cog" },
    { path: "/reels", label: "Reel Analytics", icon: "fas fa-video" },
    { path: "/followers", label: "Followers", icon: "fas fa-users" },
    { path: "/tagging", label: "Video Tagging", icon: "fas fa-tags" },
    { path: "/history", label: "Run History", icon: "fas fa-history" },
  ];

  const isConnected = credentials?.instagramUsername && credentials.instagramUsername.length > 0;
  const displayUsername = isConnected ? `@${credentials.instagramUsername}` : "Not connected";
  const statusText = isConnected ? "Connected" : "Click to configure";

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col" data-testid="sidebar">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fab fa-instagram text-primary-foreground text-lg"></i>
          </div>
          <div>
            <h1 className="text-lg font-semibold" data-testid="app-title">IG Analytics</h1>
            <p className="text-xs text-muted-foreground">Scraper Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
              location === item.path
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <i className={`${item.icon} w-4`}></i>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <Link href="/configuration">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition-colors cursor-pointer">
            <div className={`w-8 h-8 ${isConnected ? 'bg-secondary' : 'bg-muted'} rounded-full flex items-center justify-center`}>
              <i className={`fas fa-user ${isConnected ? 'text-secondary-foreground' : 'text-muted-foreground'} text-sm`}></i>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="user-profile">{displayUsername}</p>
              <p className={`text-xs ${isConnected ? 'text-green-500' : 'text-muted-foreground'}`}>{statusText}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
