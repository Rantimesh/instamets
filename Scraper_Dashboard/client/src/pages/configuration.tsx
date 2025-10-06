import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Sidebar from "@/components/sidebar";
import ThemeToggle from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";

interface ScraperStatus {
  status: 'idle' | 'queued' | 'running' | 'fetching_metrics' | 'ingesting' | 'completed' | 'failed';
  logs: string[];
  error?: string;
  reelsScraped?: number;
}

export default function Configuration() {
  const [formData, setFormData] = useState({
    targetUsername: "",
    scheduleFrequency: "24h",
    autoTag: false,
    emailNotifications: false,
  });

  const [instagramCredentials, setInstagramCredentials] = useState({
    instagramUsername: "",
    instagramPassword: "",
  });

  const { toast } = useToast();

  const { data: status, refetch } = useQuery<ScraperStatus>({
    queryKey: ['/api/scrape/status'],
    refetchInterval: (data) => {
      if (data?.status === 'running' || data?.status === 'fetching_metrics' || data?.status === 'queued') {
        return 2000;
      }
      return false;
    },
  });

  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => {
        if (data.targetUsername) {
          setFormData(data);
        }
      })
      .catch(console.error);

    fetch("/api/credentials")
      .then(res => res.json())
      .then(data => {
        if (data.instagramUsername) {
          setInstagramCredentials(data);
        }
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Configuration saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    }
  };

  const handleSaveCredentials = async () => {
    try {
      const response = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(instagramCredentials)
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Instagram credentials saved successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save credentials",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRunScraper = async () => {
    const usernameList = formData.targetUsername.split(',').map(u => u.trim()).filter(u => u.length > 0);
    
    if (usernameList.length === 0) {
      toast({
        title: "Error",
        description: "Please enter at least one username",
        variant: "destructive",
      });
      return;
    }

    if (usernameList.length > 10) {
      toast({
        title: "Error",
        description: "Maximum 10 usernames allowed",
        variant: "destructive",
      });
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
        toast({
          title: "Success",
          description: "Scraper started successfully",
        });
        setTimeout(() => refetch(), 500);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to start scraper",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start scraper",
        variant: "destructive",
      });
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold" data-testid="page-title">Configuration & Scraper Control</h1>
              <p className="text-muted-foreground">Configure settings and run the Instagram scraper</p>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scraper Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="targetUsername">Target Instagram Usernames (comma-separated)</Label>
                    <Input
                      id="targetUsername"
                      placeholder="username1, username2, username3 (up to 10)"
                      value={formData.targetUsername}
                      onChange={(e) => handleInputChange("targetUsername", e.target.value)}
                      data-testid="input-target-username"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter multiple usernames separated by commas (maximum 10 profiles)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduleFrequency">Schedule Frequency</Label>
                    <Select 
                      value={formData.scheduleFrequency} 
                      onValueChange={(value) => handleInputChange("scheduleFrequency", value)}
                    >
                      <SelectTrigger data-testid="select-schedule-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6h">Every 6 hours</SelectItem>
                        <SelectItem value="12h">Every 12 hours</SelectItem>
                        <SelectItem value="24h">Every 24 hours</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="autoTag"
                        checked={formData.autoTag}
                        onCheckedChange={(checked) => handleInputChange("autoTag", checked)}
                        data-testid="switch-auto-tag"
                      />
                      <Label htmlFor="autoTag">Auto-tag new video types</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="emailNotifications"
                        checked={formData.emailNotifications}
                        onCheckedChange={(checked) => handleInputChange("emailNotifications", checked)}
                        data-testid="switch-email-notifications"
                      />
                      <Label htmlFor="emailNotifications">Email notifications</Label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      type="submit"
                      data-testid="button-save-config"
                      variant="outline"
                    >
                      Save Configuration
                    </Button>
                    <Button 
                      type="button"
                      onClick={handleRunScraper}
                      disabled={!!isRunning}
                      className="flex-1"
                    >
                      {isRunning ? "Scraper Running..." : "Run Scraper Now"}
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
                      <Label>Scraper Logs</Label>
                      <div className="mt-2 bg-muted rounded-lg p-3 max-h-48 overflow-y-auto">
                        {status.logs.slice(-10).map((log, idx) => (
                          <div key={idx} className="text-xs font-mono mb-1">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instagram Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instagramUsername">Instagram Login Username</Label>
                  <Input
                    id="instagramUsername"
                    placeholder="Your Instagram username"
                    value={instagramCredentials.instagramUsername}
                    onChange={(e) => setInstagramCredentials(prev => ({ ...prev, instagramUsername: e.target.value }))}
                    data-testid="input-instagram-username"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instagramPassword">Instagram Password</Label>
                  <Input
                    id="instagramPassword"
                    type="password"
                    placeholder="Your Instagram password"
                    value={instagramCredentials.instagramPassword}
                    onChange={(e) => setInstagramCredentials(prev => ({ ...prev, instagramPassword: e.target.value }))}
                    data-testid="input-instagram-password"
                  />
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <i className="fas fa-info-circle mr-2"></i>
                    Your credentials are stored securely and only used for scraping. We recommend using environment variables for production.
                  </p>
                </div>

                <Button 
                  variant="outline" 
                  onClick={handleSaveCredentials}
                  data-testid="button-save-credentials"
                >
                  <i className="fas fa-save mr-2"></i>
                  Save Instagram Credentials
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
