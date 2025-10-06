import PerformanceChart from '../performance-chart';

export default function PerformanceChartExample() {
  return (
    <div className="p-6 bg-background">
      <PerformanceChart timeFilter="7d" />
    </div>
  );
}
