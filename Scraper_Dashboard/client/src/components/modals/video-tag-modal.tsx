import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface VideoTagModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reel?: any;
  onTagSaved?: () => void;
}

export default function VideoTagModal({ open, onOpenChange, reel, onTagSaved }: VideoTagModalProps) {
  const [videoType, setVideoType] = useState("");
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (!videoType) {
      alert("Please select a video type");
      return;
    }

    console.log('Tag saved:', { videoType, notes });
    onTagSaved?.();
    onOpenChange(false);
    setVideoType("");
    setNotes("");
  };

  const videoTypes = [
    "Educational",
    "Entertainment", 
    "Behind the Scenes",
    "Product Demo",
    "Lifestyle",
    "Tutorial",
    "Q&A",
    "Other"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full mx-4" data-testid="video-tag-modal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tag Video Type</h3>
          <button 
            className="text-muted-foreground hover:text-foreground transition-colors" 
            onClick={() => onOpenChange(false)}
            data-testid="button-close-tag-modal"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Video Preview</label>
            <div className="w-full h-32 bg-muted rounded border border-border flex items-center justify-center">
              <i className="fas fa-video text-2xl text-muted-foreground"></i>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Select Video Type</label>
            <Select value={videoType} onValueChange={setVideoType}>
              <SelectTrigger className="w-full" data-testid="select-video-type">
                <SelectValue placeholder="Choose video type..." />
              </SelectTrigger>
              <SelectContent>
                {videoTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, '-')}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Notes (optional)</label>
            <Textarea 
              className="w-full h-20 resize-none" 
              placeholder="Add any additional notes about this video..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              data-testid="textarea-notes"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              className="flex-1"
              onClick={handleSave}
              data-testid="button-save-tag"
            >
              Save Tag
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-tag"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
