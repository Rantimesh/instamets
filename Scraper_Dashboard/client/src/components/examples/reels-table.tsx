import ReelsTable from '../reels-table';

export default function ReelsTableExample() {
  return (
    <div className="p-6 bg-background">
      <ReelsTable timeFilter="7d" />
    </div>
  );
}
