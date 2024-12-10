import { RefreshCcw } from "lucide-react";

import Button from "./ui/Button";

type QueryErrorFallbackProps = {
  refetch?: () => void;
};

export function QueryErrorFallback({ refetch }: QueryErrorFallbackProps) {
  return (
    <div>
      <p>Something went wrong</p>
      {refetch && (
        <Button variant="link" onClick={refetch}>
          <RefreshCcw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
}
