import { useState } from "react";

export const useToast = () => {
  const [toast, setToast] = useState<{title: string, description: string, variant: 'default' | 'destructive'} | null>(null);

  const showToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    setToast({ title, description, variant });
    setTimeout(() => setToast(null), 3000);
  };

  return { toast, showToast };
};