import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Configuration from "@/pages/configuration";
import ScraperControl from "@/pages/scraper-control";
import ReelAnalytics from "@/pages/reel-analytics";
import Followers from "@/pages/followers";
import VideoTagging from "@/pages/video-tagging";
import RunHistory from "@/pages/run-history";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/configuration" component={Configuration} />
      <Route path="/scraper" component={ScraperControl} />
      <Route path="/reels" component={ReelAnalytics} />
      <Route path="/followers" component={Followers} />
      <Route path="/tagging" component={VideoTagging} />
      <Route path="/history" component={RunHistory} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
