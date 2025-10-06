import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

interface TwoFAModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TwoFAModal({ open, onOpenChange }: TwoFAModalProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = () => {
    const fullCode = code.join('');
    if (fullCode.length === 6) {
      console.log('2FA code submitted:', fullCode);
      onOpenChange(false);
      setCode(['', '', '', '', '', '']);
    }
  };

  useEffect(() => {
    if (open) {
      inputRefs.current[0]?.focus();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4" data-testid="two-fa-modal">
        <div className="text-center mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <i className="fas fa-shield-alt text-primary text-2xl"></i>
          </div>
          <h3 className="text-lg font-semibold">Enter 2FA Code</h3>
          <p className="text-sm text-muted-foreground">Please enter the 6-digit code from your authenticator app</p>
        </div>
        <div className="space-y-4">
          <div className="flex gap-2 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                className="w-12 h-12 bg-input border border-border rounded text-center text-lg font-mono"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                data-testid={`two-fa-input-${index}`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <Button 
              className="flex-1" 
              onClick={handleSubmit}
              disabled={code.join('').length !== 6}
              data-testid="button-verify-2fa"
            >
              Verify
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel-2fa"
            >
              Cancel
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Didn't receive a code? <a href="#" className="text-primary hover:underline">Resend</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
