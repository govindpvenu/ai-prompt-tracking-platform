import { Spinner } from "@/components/kibo-ui/spinner";

export default function Loading() {
  return (
    <main className="flex flex-1 min-h-screen items-center justify-center flex-col gap-4 p-4 pt-0">
      <Spinner variant="bars" className="size-6 text-primary" size={32} />
    </main>
  );
}
