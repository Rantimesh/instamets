import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Sidebar from "@/components/sidebar";
import ThemeToggle from "@/components/theme-toggle";

interface ScraperStatus {
  status: 'idle' | 'queued' | 'running' | 'fetching_metrics' | 'ingesting' | 'completed' | 'failed';
  logs: string[];
  error?: string;
  reelsScraped?: number;
}

export default function ScraperControl() {
  const [usernames, setUsernames] = useState<string>("she_is_ada_,_olasubomi_,5thkind_");

  const { data: status, refetch } = useQuery<ScraperStatus>({
    queryKey: ['/api/scrape/status'],
    refetchInterval: (data) => {
      if (data?.status === 'running' || data?.status === 'fetching_metrics' || data?.status === 'queued') {
        return 2000;
      }
      return false;
    },
  });

  const handleRunScraper = async () => {
    const usernameList = usernames.split(',').map(u => u.trim()).filter(u => u.length > 0);
    
    if (usernameList.length === 0) {
      alert("Please enter at least one username");
      return;
    }

    if (usernameList.length > 10) {
      alert("Maximum 10 usernames allowed");
      return;
    }

    try {
      const response = await fetch("/api/scrape/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: usernameList })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTimeout(() => refetch(), 500);
      } else {
        alert(data.error || "Failed to start scraper");
      }
    } catch (error) {
      console.error("Error starting scraper:", error);
      alert("Failed to start scraper");
    }
  };

  const getStatusBadge = () => {
    if (!status || status.status === 'idle') return <Badge variant="secondary">Idle</Badge>;
    if (status.status === 'queued') return <Badge className="bg-yellow-500">Queued</Badge>;
    if (status.status === 'running') return <Badge className="bg-blue-500">Running</Badge>;
    if (status.status === 'fetching_metrics') return <Badge className="bg-purple-500">Fetching Metrics</Badge>;
    if (status.status === 'ingesting') return <Badge className="bg-indigo-500">Ingesting Data</Badge>;
    if (status.status === 'completed') return <Badge className="bg-green-500">Completed</Badge>;
    if (status.status === 'failed') return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">{status.status}</Badge>;
  };

  const getProgressValue = () => {
    if (!status) return 0;
    if (status.status === 'idle') return 0;
    if (status.status === 'queued') return 10;
    if (status.status === 'running') return 40;
    if (status.status === 'fetching_metrics') return 70;
    if (status.status === 'ingesting') return 90;
    if (status.status === 'completed') return 100;
    if (status.status === 'failed') return 0;
    return 0;
  };

  const isRunning = status && (status.status === 'running' || status.status === 'fetching_metrics' || status.status === 'queued' || status.status === 'ingesting');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Scraper Control</h1>
              <p className="text-muted-foreground">Manually trigger Instagram data scraping</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Target Creators</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="usernames">Instagram Usernames (comma-separated, max 10)</Label>
              <Input
                id="usernames"
                value={usernames}
                onChange={(e) => setUsernames(e.target.value)}
                placeholder="username1, username2, username3"
                disabled={!!isRunning}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter usernames separated by commas (e.g., she_is_ada_,_olasubomi_,5thkind_)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scraper Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleRunScraper} 
                disabled={!!isRunning}
                className="flex-1"
              >
                {isRunning ? "Scraper Running..." : "Run Scraper"}
              </Button>
            </div>
            
            {status && status.status !== 'idle' && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="text-muted-foreground capitalize">
                    {status.status.replace('_', ' ')} {status.status === 'completed' ? '(100%)' : ''}
                  </span>
                </div>
                <Progress value={getProgressValue()} />
              </div>
            )}

            {status?.error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">{status.error}</p>
              </div>
            )}

            {status?.logs && status.logs.length > 0 && (
              <div className="mt-4">
                <Label>Logs</Label>
                <div className="mt-2 bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
                  {status.logs.slice(-10).map((log, idx) => (
                    <div key={idx} className="text-xs font-mono mb-1">{log}</div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className="text-sm font-medium">Scraper Status</span>
                </div>
                <span className="text-sm capitalize">{status?.status || 'idle'}</span>
              </div>
              
              {status?.reelsScraped !== undefined && status.reelsScraped > 0 && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Reels Scraped</span>
                  <span className="text-sm font-bold">{status.reelsScraped}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
        </main>
      </div>
    </div>
  );
}
