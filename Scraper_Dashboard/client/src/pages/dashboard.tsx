import { useState } from "react";
import Sidebar from "@/components/sidebar";
import StatCard from "@/components/stat-card";
import FollowersChart from "@/components/followers-chart";
import PerformanceChart from "@/components/performance-chart";
import ReelsTable from "@/components/reels-table";
import ScraperStatus from "@/components/scraper-status";
import CreatorSelector from "@/components/creator-selector";
import ThemeToggle from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { filterReelsByDate } from "@/lib/dateFilter";

interface ReelData {
  username: string;
  likes: number;
  comments: number;
  views: number;
  datePosted: string;
}

interface FollowerData {
  username: string;
  followers: number;
  reelsScraped: number;
  timestamp: string;
}

export default function Dashboard() {
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: ['/api/reels'],
  });

  const { data: followerData = [] } = useQuery<FollowerData[]>({
    queryKey: ['/api/followers/latest'],
  });

  const { data: allFollowerHistory = [] } = useQuery<FollowerData[]>({
    queryKey: ['/api/followers'],
  });

  const { data: scraperStatus } = useQuery({
    queryKey: ['/api/scrape/status'],
    refetchInterval: 3000,
  });

  const timeFilters = [
    { label: "7d", value: "7d" },
    { label: "14d", value: "14d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "180d", value: "180d" },
    { label: "YTD", value: "ytd" },
    { label: "All", value: "all" },
  ];

  let filteredReels = filterReelsByDate(reels, timeFilter);
  
  if (selectedCreator) {
    filteredReels = filteredReels.filter(r => r.username === selectedCreator);
  }

  const totalReels = filteredReels.length;
  const totalLikes = filteredReels.reduce((sum, r) => sum + (r.likes > 0 ? r.likes : 0), 0);
  const totalComments = filteredReels.reduce((sum, r) => sum + r.comments, 0);
  const totalViews = filteredReels.reduce((sum, r) => sum + r.views, 0);
  const avgEngagement = totalViews > 0 
    ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1)
    : '0.0';

  const totalFollowers = followerData.reduce((sum, creator) => sum + creator.followers, 0);
  const selectedCreatorData = selectedCreator 
    ? followerData.find(c => c.username === selectedCreator)
    : null;
  
  const displayFollowers = selectedCreatorData 
    ? selectedCreatorData.followers.toLocaleString()
    : totalFollowers.toLocaleString();

  // Calculate follower changes
  const calculateFollowerChange = () => {
    if (allFollowerHistory.length < 2) return { change: "No history", changeType: "neutral" as const };
    
    const sorted = [...allFollowerHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const latest = sorted[0];
    const previous = sorted[1];
    
    if (selectedCreator) {
      const latestCreator = sorted.find(s => s.username === selectedCreator);
      const prevCreator = sorted.slice(1).find(s => s.username === selectedCreator);
      
      if (!latestCreator || !prevCreator) return { change: "New creator", changeType: "neutral" as const };
      
      const diff = latestCreator.followers - prevCreator.followers;
      const changeType = diff > 0 ? "positive" as const : diff < 0 ? "negative" as const : "neutral" as const;
      return { change: `${diff > 0 ? '+' : ''}${diff} from last run`, changeType };
    }
    
    const latestTotal = sorted
      .filter(s => s.timestamp === latest.timestamp)
      .reduce((sum, s) => sum + s.followers, 0);
    const prevTotal = sorted
      .filter(s => s.timestamp === previous.timestamp)
      .reduce((sum, s) => sum + s.followers, 0);
    
    const diff = latestTotal - prevTotal;
    const changeType = diff > 0 ? "positive" as const : diff < 0 ? "negative" as const : "neutral" as const;
    return { change: `${diff > 0 ? '+' : ''}${diff} from last run`, changeType };
  };

  // Calculate last run time
  const getLastRunTime = () => {
    if (allFollowerHistory.length === 0) return "Never";
    
    const sorted = [...allFollowerHistory].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    const lastRun = new Date(sorted[0].timestamp);
    const now = new Date();
    const diffMs = now.getTime() - lastRun.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `${days}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else if (diffMins > 0) {
      return `${diffMins}m ago`;
    } else {
      return "Just now";
    }
  };

  const followerChange = calculateFollowerChange();
  const lastRunTime = getLastRunTime();
  const runStatus = scraperStatus?.status === 'running' ? 'Running...' : 'Completed';
  const runStatusType = scraperStatus?.status === 'running' ? 'neutral' as const : 'positive' as const;

  const mockStats = {
    followers: { current: displayFollowers, change: followerChange.change, changeType: followerChange.changeType },
    totalReels: { current: totalReels.toString(), change: `${filteredReels.length} in selected period`, changeType: "neutral" as const },
    avgEngagement: { current: `${avgEngagement}%`, change: "Likes + Comments / Views", changeType: "neutral" as const },
    lastRun: { current: lastRunTime, change: runStatus, changeType: runStatusType },
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="page-title">Dashboard</h1>
              <p className="text-muted-foreground">
                {selectedCreator ? "Viewing individual creator analytics" : "Viewing overview of all creators"}
              </p>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <CreatorSelector 
                selectedCreator={selectedCreator} 
                onCreatorChange={setSelectedCreator}
              />
              <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                {timeFilters.map((filter) => (
                  <button
                    key={filter.value}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      timeFilter === filter.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => setTimeFilter(filter.value)}
                    data-testid={`filter-${filter.value}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Followers"
              value={mockStats.followers.current}
              change={mockStats.followers.change}
              changeType={mockStats.followers.changeType}
              icon="fas fa-users"
              color="bg-chart-4/10"
            />
            <StatCard
              title="Total Reels"
              value={mockStats.totalReels.current}
              change={mockStats.totalReels.change}
              changeType={mockStats.totalReels.changeType}
              icon="fas fa-video"
              color="bg-chart-1/10"
            />
            <StatCard
              title="Avg Engagement"
              value={mockStats.avgEngagement.current}
              change={mockStats.avgEngagement.change}
              changeType={mockStats.avgEngagement.changeType}
              icon="fas fa-heart"
              color="bg-chart-2/10"
            />
            <StatCard
              title="Last Run"
              value={mockStats.lastRun.current}
              change={mockStats.lastRun.change}
              changeType={mockStats.lastRun.changeType}
              icon="fas fa-clock"
              color="bg-chart-3/10"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FollowersChart timeFilter={timeFilter} selectedCreator={selectedCreator} />
            <PerformanceChart timeFilter={timeFilter} selectedCreator={selectedCreator} />
          </div>

          <ReelsTable timeFilter={timeFilter} selectedCreator={selectedCreator} />

          <ScraperStatus />
        </main>
      </div>
    </div>
  );
}
