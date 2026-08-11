import ComingSoonState from "@/components/ComingSoonState";
import { Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileImage, FileVideo, FileText, Archive, Facebook, Instagram, Youtube, Linkedin } from "lucide-react";

const formats = [
  { label: "PNG", icon: FileImage, desc: "Lossless raster" },
  { label: "JPG", icon: FileImage, desc: "Compressed photo" },
  { label: "PDF", icon: FileText, desc: "Print-ready" },
  { label: "SVG", icon: FileImage, desc: "Vector" },
  { label: "MP4", icon: FileVideo, desc: "Video" },
  { label: "GIF", icon: FileVideo, desc: "Animated" },
  { label: "ZIP", icon: Archive, desc: "Bundle" },
];

const presets = [
  { label: "Facebook", icon: Facebook },
  { label: "Instagram", icon: Instagram },
  { label: "TikTok", icon: FileVideo },
  { label: "LinkedIn", icon: Linkedin },
  { label: "YouTube", icon: Youtube },
];

const ExportCenter = () => {
  return (
    <div className="page-container space-y-6 py-4 md:py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Export Center</h1>
        <p className="text-muted-foreground">One place to render every creative into the format your channels expect.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formats</CardTitle>
          <CardDescription>Render creatives across static, motion and archive formats.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {formats.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.label} className="rounded-2xl border border-border bg-card p-4 transition hover:border-primary/50">
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <p className="font-semibold">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Presets</CardTitle>
          <CardDescription>Correct aspect ratios and safe zones for each platform.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.label} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{p.label}</p>
                  <p className="truncate text-xs text-muted-foreground">Ready presets</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Queue</CardTitle>
              <CardDescription>Render jobs currently processing.</CardDescription>
            </div>
            <Badge variant="secondary">0 running</Badge>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            No exports queued. Start one from any creative.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Downloads</CardTitle>
              <CardDescription>Last completed export history.</CardDescription>
            </div>
            <Button variant="outline" size="sm"><Download className="mr-2 h-3.5 w-3.5" />All</Button>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Your export history will appear here.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ExportCenterComingSoon = () => (
  <ComingSoonState icon={Download} title="Export Center" description="Download and schedule your ad creatives in any format for any platform." />
);

export default ExportCenterComingSoon;
