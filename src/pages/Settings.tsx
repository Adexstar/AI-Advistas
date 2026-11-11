import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageBackButton } from "@/components/navigation/PageBackButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Bell,
  Shield,
  Link,
  Save,
  Mail,
  Smartphone,
  Key,
  Database,
  Sparkles,
  Palette as PaletteIcon,
  Briefcase,
  Wrench,
  Brain,
} from "lucide-react";
import AIPreferences from "@/components/settings/AIPreferences";
import AIBrainSettings from "@/components/settings/AIBrainSettings";
import { useAuth } from "@/hooks/useAuth";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useToast } from "@/hooks/use-toast";
import { Moon, Sun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlatformConnectionService, type PlatformConnection } from "@/services/publishing/PlatformConnectionService";

const NOTIFICATION_KEY = "advista:notification-prefs";
const SETTINGS_PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "google", label: "Google Ads" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "tiktok", label: "TikTok" },
];

const defaultNotifications = {
  emailCampaigns: true,
  emailBilling: true,
  emailFeatures: false,
  emailTips: true,
  pushCampaigns: true,
  pushBilling: false,
};

const AppearanceSettings = () => {
  const { theme, setTheme } = useAppTheme();
  const dark = theme === "dark";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PaletteIcon className="h-5 w-5 text-primary" />Appearance</CardTitle>
        <CardDescription>Choose the theme used across the whole app on this device.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Dark mode</p>
              <p className="text-sm text-muted-foreground">{dark ? "The app is using the dark theme." : "The app is using the light theme."}</p>
            </div>
          </div>
          <Switch
            checked={dark}
            onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
            aria-label="Dark mode"
          />
        </div>
      </CardContent>
    </Card>
  );
};

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIFICATION_KEY);
      return saved ? { ...defaultNotifications, ...JSON.parse(saved) } : defaultNotifications;
    } catch {
      return defaultNotifications;
    }
  });

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, email")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const connectionsQuery = useQuery({
    queryKey: ["platform-connections", user?.id],
    enabled: !!user?.id,
    queryFn: () => PlatformConnectionService.list(),
  });

  useEffect(() => {
    const stored = profileQuery.data?.display_name;
    const fallback = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";
    setDisplayName(stored || fallback);
  }, [profileQuery.data, user]);

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const name = displayName.trim();
    const payload = { user_id: user.id, display_name: name, email: user.email };
    const { error } = profileQuery.data
      ? await supabase.from("profiles").update({ display_name: name, email: user.email }).eq("user_id", user.id)
      : await supabase.from("profiles").insert(payload);
    setSavingProfile(false);
    if (error) {
      toast({ title: "Profile was not saved", description: error.message, variant: "destructive" });
      return;
    }
    await supabase.auth.updateUser({ data: { display_name: name } });
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
    toast({ title: "Display name saved", description: "Company, phone, and bio are not stored on the account." });
  };

  const saveNotifications = () => {
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
    toast({ title: "Notification preferences saved on this device" });
  };

  const updatePassword = async () => {
    if (passwords.next.length < 6) {
      toast({ title: "Password is too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (passwords.next !== passwords.confirm) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.next });
    setUpdatingPassword(false);
    if (error) {
      toast({ title: "Password was not updated", description: error.message, variant: "destructive" });
      return;
    }
    setPasswords({ next: "", confirm: "" });
    toast({ title: "Password updated" });
  };

  const activeConnection = (platformId: string): PlatformConnection | undefined =>
    (connectionsQuery.data ?? []).find((row) => row.platform === platformId && row.is_active);

  const disconnectPlatform = async (row: PlatformConnection) => {
    try {
      await PlatformConnectionService.disconnect(row.id);
      qc.invalidateQueries({ queryKey: ["platform-connections", user?.id] });
      toast({ title: `${row.platform} disconnected` });
    } catch (error: any) {
      toast({ title: "Could not disconnect", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="page-container space-y-6 py-4 md:py-6">
      <div className="flex min-w-0 items-start gap-3">
        <PageBackButton fallback="/dashboard" label="Back" />
        <div className="min-w-0">
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground">Tune profile, alerts, security, and connected channels so the team operates from one calmer control surface.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-secondary/55 p-2 sm:grid-cols-4 xl:grid-cols-9">
          <TabsTrigger value="profile" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">General</TabsTrigger>
          <TabsTrigger value="workspace" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Workspace</TabsTrigger>
          <TabsTrigger value="ai" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">AI Preferences</TabsTrigger>
          <TabsTrigger value="notifications" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Security</TabsTrigger>
          <TabsTrigger value="appearance" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Appearance</TabsTrigger>
          <TabsTrigger value="integrations" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Connected</TabsTrigger>
          <TabsTrigger value="ai-brain" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">AI Brain</TabsTrigger>
          <TabsTrigger value="advanced" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="workspace">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" />Workspace</CardTitle>
              <CardDescription>Workspace name, defaults, timezone and locale settings.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Workspace configuration coming soon.</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <div className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Tune how AdVista AI behaves across your workspace.
          </div>
          <AIPreferences />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="ai-brain">
          <div className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-primary" /> The invisible engine powering AI features across AdVista.
          </div>
          <AIBrainSettings />
        </TabsContent>

        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" />Advanced</CardTitle>
              <CardDescription>Data export, workspace deletion and developer tools.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Advanced controls coming soon.</CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Workspace Profile
              </CardTitle>
              <CardDescription>
                Set the identity and contact details that travel with your campaigns, approvals, and billing flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" value={user?.email ?? ""} readOnly />
                <p className="text-xs text-muted-foreground">Email changes go through the sign-in provider and are not edited here.</p>
              </div>

              <p className="text-sm text-muted-foreground">Company, phone, and bio are not columns on the account profile, so this form does not collect them.</p>

              <Button className="bg-primary hover:bg-primary/90" onClick={saveProfile} disabled={!user || savingProfile}>
                <Save className="mr-2 h-4 w-4" />
                {savingProfile ? "Saving..." : "Save display name"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control which updates should reach the team and which ones should stay inside the workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Campaign Updates</p>
                      <p className="text-sm text-muted-foreground">Know when campaign status, performance, or readiness changes need attention.</p>
                    </div>
                    <Switch
                      className="shrink-0"
                      checked={notifications.emailCampaigns}
                      onCheckedChange={(value) => handleNotificationChange("emailCampaigns", value)}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Billing & Payments</p>
                      <p className="text-sm text-muted-foreground">Receive invoices, checkout confirmations, and renewal reminders.</p>
                    </div>
                    <Switch
                      className="shrink-0"
                      checked={notifications.emailBilling}
                      onCheckedChange={(value) => handleNotificationChange("emailBilling", value)}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Feature Updates</p>
                      <p className="text-sm text-muted-foreground">Hear about meaningful workspace improvements, not every minor release.</p>
                    </div>
                    <Switch
                      className="shrink-0"
                      checked={notifications.emailFeatures}
                      onCheckedChange={(value) => handleNotificationChange("emailFeatures", value)}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Tips & Tutorials</p>
                      <p className="text-sm text-muted-foreground">Get practical guidance for briefs, templates, and campaign operations.</p>
                    </div>
                    <Switch
                      className="shrink-0"
                      checked={notifications.emailTips}
                      onCheckedChange={(value) => handleNotificationChange("emailTips", value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Push Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Campaign Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive real-time nudges when launch-critical events need action.</p>
                    </div>
                    <Switch
                      className="shrink-0"
                      checked={notifications.pushCampaigns}
                      onCheckedChange={(value) => handleNotificationChange("pushCampaigns", value)}
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium">Billing Reminders</p>
                      <p className="text-sm text-muted-foreground">Stay ahead of low credits, renewals, and payment follow-up.</p>
                    </div>
                    <Switch
                      className="shrink-0"
                      checked={notifications.pushBilling}
                      onCheckedChange={(value) => handleNotificationChange("pushBilling", value)}
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/90" onClick={saveNotifications}>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Protect the workspace, control access, and keep launch activity tied to trusted sessions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Change Password
                </h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" value={passwords.next} onChange={(e) => setPasswords((prev) => ({ ...prev, next: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" value={passwords.confirm} onChange={(e) => setPasswords((prev) => ({ ...prev, confirm: e.target.value }))} />
                  </div>
                  <Button variant="outline" onClick={updatePassword} disabled={updatingPassword || !user}>
                    {updatingPassword ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">Add a second layer of protection before anyone can access the workspace.</p>
                  </div>
                  <Button variant="outline" onClick={() => toast({ title: "Two-factor authentication is not available", description: "This workspace has no authenticator setup, so nothing was enabled." })}>Setup 2FA</Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">This browser</p>
                      <p className="text-sm text-muted-foreground">Signed in with the current Supabase session. Other devices are not listed because session inventory is not connected.</p>
                    </div>
                    <span className="text-sm text-green-600">Current</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-primary" />
                Platform Integrations
              </CardTitle>
              <CardDescription>
                Connect the channels that receive your campaigns so the workspace stays in sync with where you launch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectionsQuery.isError && (
                <p className="mb-4 text-sm text-destructive">Could not load platform connections. Nothing below is marked active.</p>
              )}
              <div className="space-y-4">
                {SETTINGS_PLATFORMS.map((platform) => {
                  const connection = activeConnection(platform.id);
                  return (
                    <div key={platform.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium">{platform.label}</p>
                        <p className="break-words text-sm text-muted-foreground">
                          {connection
                            ? `Connected${connection.account_name ? ` as ${connection.account_name}` : ""}`
                            : "Not connected. There is no OAuth setup, so this button does not create a connection."}
                        </p>
                      </div>
                      {connection ? (
                        <Button variant="outline" className="w-full sm:w-auto" onClick={() => disconnectPlatform(connection)}>Disconnect</Button>
                      ) : (
                        <Button className="w-full sm:w-auto" variant="outline" onClick={() => toast({
                          title: `${platform.label} stays disconnected`,
                          description: "AdVista does not have an OAuth flow for this platform yet.",
                        })}>Connect</Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                API & Webhooks
              </CardTitle>
              <CardDescription>
                Extend the workspace into your own systems when you need automations beyond the default flow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input id="apiKey" value="" placeholder="No API key has been issued" readOnly />
                  <Button variant="outline" onClick={() => toast({ title: "API keys are not issued here", description: "Regenerate does not create a key." })}>Regenerate</Button>
                </div>
              </div>
              <div>
                <Label htmlFor="webhookUrl">Webhook URL</Label>
                <Input 
                  id="webhookUrl" 
                  placeholder="https://your-app.com/webhook" 
                  className="mt-2"
                />
              </div>
              <Button variant="outline" onClick={() => toast({ title: "Webhook delivery is not connected", description: "The URL is not sent anywhere from this screen." })}>Test Webhook</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
