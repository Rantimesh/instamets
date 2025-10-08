import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Sidebar from "@/components/sidebar";
import FollowersChart from "@/components/followers-chart";
import CreatorSelector from "@/components/creator-selector";
import ThemeToggle from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";
import { filterReelsByDate } from "@/lib/dateFilter";

interface ReelData {
  username: string;
  datePosted: string;
}

interface FollowerData {
  username: string;
  followers: number;
  reelsScraped: number;
  timestamp: string;
}

export default function Followers() {
  const [timeFilter, setTimeFilter] = useState("all");
  const [selectedCreator, setSelectedCreator] = useState<string | null>(null);

  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: ['/api/reels'],
  });

  const { data: followerData = [] } = useQuery<FollowerData[]>({
    queryKey: ['/api/followers/latest'],
  });

  const timeFilters = [
    { label: "7d", value: "7d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
    { label: "All", value: "all" },
  ];

  let filteredReels = filterReelsByDate(reels, timeFilter);
  
  if (selectedCreator) {
    filteredReels = filteredReels.filter(r => r.username === selectedCreator);
  }

  const creators = Array.from(new Set(reels.map(r => r.username).filter(Boolean)));
  const creatorCount = creators.length;
  const totalReels = filteredReels.length;
  
  const totalFollowers = followerData.reduce((sum, creator) => sum + creator.followers, 0);
  const selectedCreatorData = selectedCreator 
    ? followerData.find(c => c.username === selectedCreator)
    : null;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="page-title">Followers Analytics</h1>
              <p className="text-muted-foreground">
                {selectedCreator ? "Viewing individual creator followers" : "Viewing combined follower analytics"}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedCreator ? "Creator Followers" : "Total Followers"}
                    </p>
                    <p className="text-3xl font-bold" data-testid="total-followers">
                      {selectedCreatorData 
                        ? selectedCreatorData.followers.toLocaleString()
                        : totalFollowers.toLocaleString()
                      }
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCreator ? `@${selectedCreator}` : `Across ${creatorCount} creators`}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-chart-4/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-users text-chart-4 text-2xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reels</p>
                    <p className="text-3xl font-bold">{totalReels}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCreator ? `From @${selectedCreator}` : "From all creators"}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-chart-1/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-video text-chart-1 text-2xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Creator Breakdown</p>
                    <div className="text-sm font-medium mt-2 space-y-1">
                      {followerData.map(creator => (
                        <div key={creator.username} className="flex justify-between items-center">
                          <span>@{creator.username}</span>
                          <span className="text-muted-foreground">{creator.followers.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-chart-2/10 rounded-full flex items-center justify-center">
                    <i className="fas fa-user-friends text-chart-2 text-2xl"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <FollowersChart timeFilter={timeFilter} selectedCreator={selectedCreator} />
        </main>
      </div>
    </div>
  );
}
