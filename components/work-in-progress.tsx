export default function WorkInProgress() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-8">
      <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-10 w-10 text-muted-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Work in Progress
          </h1>
          <p className="text-muted-foreground max-w-md">
            This feature is currently under development. Check back soon for
            updates!
          </p>
        </div>
      </div>
    </div>
  );
}
