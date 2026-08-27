import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useState } from "react";
const A = lazy(() => import("@/components/JournalSuccessAnimation"));
export const Route = createFileRoute("/anim-test")({
  component: () => {
    const [s, setS] = useState(false);
    return (
      <div>
        <button data-testid="go" onClick={() => setS(true)}>go</button>
        {s ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70">
            <Suspense fallback={null}><A /></Suspense>
          </div>
        ) : null}
      </div>
    );
  },
});
