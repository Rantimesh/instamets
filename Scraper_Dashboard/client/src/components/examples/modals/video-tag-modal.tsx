import { useState } from 'react';
import VideoTagModal from '../../modals/video-tag-modal';
import { Button } from '@/components/ui/button';

export default function VideoTagModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)}>Open Video Tag Modal</Button>
      <VideoTagModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
