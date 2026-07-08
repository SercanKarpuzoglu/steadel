import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export function ComingSoon({
  title,
  milestone,
}: {
  title: string;
  milestone: string;
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <Card>
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>
          This area ships with milestone {milestone} of the build plan.
        </CardDescription>
      </Card>
    </div>
  );
}
