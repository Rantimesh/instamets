import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PerformanceChart from "@/components/performance-chart";
import ReelsTable from "@/components/reels-table";
import CreatorSelector from "@/components/creator-selector";
import Sidebar from "@/components/sidebar";
import ThemeToggle from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { filterReelsByDate } from "@/lib/dateFilter";

interface ReelData {
  username: string;
  views: number;
  likes: number;
  comments: number;
  datePosted: string;
  hashtags?: string;
  manual_tags?: string;
}

export default function ReelAnalytics() {
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);
  const [selectedVideoType, setSelectedVideoType] = useState<string>("all");

  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: ['/api/reels'],
  });

  // Extract unique video types from manual_tags
  const videoTypes = Array.from(
    new Set(
      reels
        .map(r => r.manual_tags)
        .filter((tag): tag is string => Boolean(tag))
        .flatMap((tag: string) => tag.split(',').map(t => t.trim()))
        .filter(Boolean)
    )
  ).sort();

  let filteredReels = filterReelsByDate(reels, timeFilter);
  
  if (selectedCreator) {
    filteredReels = filteredReels.filter(r => r.username === selectedCreator);
  }

  if (selectedVideoType && selectedVideoType !== "all") {
    filteredReels = filteredReels.filter(r => 
      r.manual_tags?.split(',').map(t => t.trim()).includes(selectedVideoType)
    );
  }

  const totalReels = filteredReels.length;
  const totalViews = filteredReels.reduce((sum, r) => sum + r.views, 0);
  const avgViews = totalReels > 0 ? Math.round(totalViews / totalReels) : 0;
  const totalLikes = filteredReels.reduce((sum, r) => sum + (r.likes > 0 ? r.likes : 0), 0);
  const totalComments = filteredReels.reduce((sum, r) => sum + r.comments, 0);
  const avgEngagement = totalViews > 0 
    ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1)
    : '0.0';
  const topReel = filteredReels.sort((a, b) => b.views - a.views)[0];
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Extract top hashtags from filtered reels
  const hashtagCounts = new Map<string, number>();
  filteredReels.forEach(reel => {
    if (reel.hashtags) {
      const tags = reel.hashtags.split(',').map(t => t.trim()).filter(Boolean);
      tags.forEach(tag => {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      });
    }
  });
  
  const topHashtags = Array.from(hashtagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  const stats = [
    { label: "Total Reels", value: totalReels.toString(), change: selectedVideoType !== "all" ? `Type: ${selectedVideoType}` : "All tracked reels", icon: "📹" },
    { label: "Avg Views", value: formatNumber(avgViews), change: "Per reel average", icon: "👁️" },
    { label: "Avg Engagement", value: `${avgEngagement}%`, change: "Likes + Comments / Views", icon: "💬" },
    { label: "Top Performer", value: formatNumber(topReel?.views || 0), change: topReel?.username ? `@${topReel.username}` : "No data", icon: "🏆" },
    { label: "Total Reach", value: formatNumber(totalViews), change: "All views combined", icon: "📊" },
  ];

  const timeFilters = ["7d", "14d", "30d", "90d", "180d", "YTD", "All"];

  const handleDownload = () => {
    const params = new URLSearchParams();
    if (selectedCreator) {
      params.append('creator', selectedCreator);
    }
    
    window.open(`/api/analytics/download?${params.toString()}`, '_blank');
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Reel Analytics</h1>
              <p className="text-muted-foreground">
                {selectedCreator ? "Viewing individual creator analytics" : "Detailed performance metrics for all creators"}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <CreatorSelector 
                selectedCreator={selectedCreator} 
                onCreatorChange={setSelectedCreator}
              />
              <Select value={selectedVideoType} onValueChange={setSelectedVideoType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Video Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {videoTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex bg-muted rounded-lg p-1">
                {timeFilters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      timeFilter === filter
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <i className="fas fa-download mr-2"></i>
                Download CSV
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.change}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Reels</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReelsTable timeFilter={timeFilter} selectedCreator={selectedCreator} />
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <PerformanceChart timeFilter={timeFilter} selectedCreator={selectedCreator} />
              
              {topHashtags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Top Hashtags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {topHashtags.map(({ tag, count }) => (
                        <div key={tag} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">#{tag}</span>
                          <span className="text-sm font-medium">{count} reels</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <ReelsTable timeFilter={timeFilter} selectedCreator={selectedCreator} />
        </main>
      </div>
    </div>
  );
}
