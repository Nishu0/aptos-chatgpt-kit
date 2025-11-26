"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function StakePage() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Stake APT</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Delegation pool integration coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
