import { useState } from 'react';
import CreatorSelector from '../creator-selector';

export default function CreatorSelectorExample() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="p-6 bg-background">
      <CreatorSelector selectedCreator={selected} onCreatorChange={setSelected} />
      <p className="mt-4 text-sm text-muted-foreground">
        Selected: {selected || "All Creators"}
      </p>
    </div>
  );
}
