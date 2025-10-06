import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface CreatorSelectorProps {
  selectedCreator: string | null;
  onCreatorChange: (creator: string | null) => void;
}

interface ReelData {
  username: string;
}

export default function CreatorSelector({ selectedCreator, onCreatorChange }: CreatorSelectorProps) {
  const { data: reels = [] } = useQuery<ReelData[]>({
    queryKey: ['/api/reels'],
  });

  const uniqueCreators = Array.from(new Set(reels.map(r => r.username).filter(Boolean)));
  
  const creators = [
    { username: "All Creators", value: "all" },
    ...uniqueCreators.map(username => ({ 
      username: `@${username}`, 
      value: username 
    }))
  ];

  return (
    <Select 
      value={selectedCreator || "all"} 
      onValueChange={(value) => onCreatorChange(value === "all" ? null : value)}
    >
      <SelectTrigger className="w-56" data-testid="select-creator">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {creators.map((creator) => (
          <SelectItem key={creator.value} value={creator.value}>
            <div className="flex items-center gap-2">
              <i className="fas fa-user-circle"></i>
              <span>{creator.username}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
