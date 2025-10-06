import { useState } from 'react';
import TwoFAModal from '../../modals/two-fa-modal';
import { Button } from '@/components/ui/button';

export default function TwoFAModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6 bg-background">
      <Button onClick={() => setOpen(true)}>Open 2FA Modal</Button>
      <TwoFAModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
