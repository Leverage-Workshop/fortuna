import Link from "next/link";
import { PageTitle } from "@/components/ui/text";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-6">
      <PageTitle eyebrow="404">Not found</PageTitle>
      <p className="text-ink-muted">There is no run or page at this address.</p>
      <Link href="/" className="self-start underline decoration-mint-deep underline-offset-[3px] hover:text-mint hover:decoration-mint">
        Back to runs
      </Link>
    </div>
  );
}
