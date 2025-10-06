import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/sidebar";
import ThemeToggle from "@/components/theme-toggle";
import { useQuery } from "@tanstack/react-query";

interface ReelData {
  username: string;
}

interface HistoryEntry {
  username: string;
  followers: number;
  reelsScraped: number;
  timestamp: string;
}

export default function RunHistory() {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: ['/api/reels'],
  });

  const { data: historyData = [] } = useQuery<HistoryEntry[]>({
    queryKey: ['/api/followers'],
  });

  const { data: status } = useQuery({
    queryKey: ['/api/scrape/status'],
  });

  const totalReels = reels.length;
  const creators = Array.from(new Set(reels.map(r => r.username).filter(Boolean)));

  // Group history by timestamp
  const historyByTimestamp = historyData.reduce((acc, entry) => {
    if (!acc[entry.timestamp]) {
      acc[entry.timestamp] = [];
    }
    acc[entry.timestamp].push(entry);
    return acc;
  }, {} as Record<string, HistoryEntry[]>);

  const runs = Object.entries(historyByTimestamp)
    .map(([timestamp, entries]) => ({
      timestamp,
      entries,
      totalReels: entries.reduce((sum, e) => sum + e.reelsScraped, 0),
      totalFollowers: entries.reduce((sum, e) => sum + e.followers, 0),
      creators: entries.length,
    }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const stats = [
    { label: "Total Runs", value: runs.length.toString() },
    { label: "Total Reels Scraped", value: totalReels.toString() },
    { label: "Creators Tracked", value: creators.length.toString() },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Partial</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Run History</h1>
              <p className="text-muted-foreground">View past scraper executions and logs</p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="text-2xl font-bold mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            {runs.length > 0 ? (
              runs.map((run, index) => (
                <Card key={run.timestamp}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <i className="fas fa-play text-primary"></i>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            Scrape Run #{runs.length - index}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {run.timestamp}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-green-500">Completed</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedRun(expandedRun === run.timestamp ? null : run.timestamp)}
                        >
                          <i className={`fas fa-chevron-${expandedRun === run.timestamp ? 'up' : 'down'}`}></i>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Creators</p>
                        <p className="text-lg font-semibold">{run.creators}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Reels Scraped</p>
                        <p className="text-lg font-semibold">{run.totalReels}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Followers</p>
                        <p className="text-lg font-semibold">{run.totalFollowers.toLocaleString()}</p>
                      </div>
                    </div>

                    {expandedRun === run.timestamp && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="font-semibold mb-3">Creator Details</h4>
                        <div className="space-y-2">
                          {run.entries.map((entry) => (
                            <div key={entry.username} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                  <i className="fas fa-user text-primary"></i>
                                </div>
                                <div>
                                  <p className="font-medium">@{entry.username}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {entry.followers.toLocaleString()} followers
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">{entry.reelsScraped} reels</p>
                                <p className="text-xs text-muted-foreground">scraped</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center py-12">
                    <i className="fas fa-history text-6xl text-muted-foreground/20 mb-4"></i>
                    <p className="text-lg text-muted-foreground mb-2">
                      No run history found
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Run the scraper to start building your history
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
