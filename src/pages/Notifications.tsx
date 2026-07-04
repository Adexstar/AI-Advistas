import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, CheckCheck, Filter, Archive } from "lucide-react";

const categories = [
  { id: "all", label: "All" },
  { id: "campaigns", label: "Campaigns" },
  { id: "exports", label: "Exports" },
  { id: "integrations", label: "Integrations" },
  { id: "ai", label: "AI Recommendations" },
  { id: "automation", label: "Automation" },
  { id: "billing", label: "Billing" },
  { id: "system", label: "System" },
  { id: "support", label: "Support" },
];

const Notifications = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="page-container space-y-6 py-4 md:py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">Every important signal, in one calm inbox.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
          <Button variant="outline" size="sm"><Archive className="mr-2 h-4 w-4" />Archive</Button>
          <Button size="sm"><CheckCheck className="mr-2 h-4 w-4" />Mark all read</Button>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notifications..."
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex h-auto w-full flex-wrap gap-1 rounded-2xl bg-muted/40 p-1">
          {categories.map((c) => (
            <TabsTrigger key={c.id} value={c.id} className="rounded-xl px-3 py-1.5 text-xs">
              {c.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((c) => (
          <TabsContent key={c.id} value={c.id} className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{c.label}</CardTitle>
              </CardHeader>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No {c.label.toLowerCase()} notifications yet.
                <Badge variant="secondary" className="ml-2">Live feed coming soon</Badge>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Notifications;
