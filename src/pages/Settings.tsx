import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import AIPreferences from "@/components/settings/AIPreferences";
const Settings = () => {
  const [profile, setProfile] = useState({
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan@example.com",
    company: "Northstar Studio",
    bio: "Campaign operator focused on moving briefs, creative, and launch decisions through one clear workflow.",
    phone: "+1 (555) 123-4567"
  });

  const [notifications, setNotifications] = useState({
    emailCampaigns: true,
    emailBilling: true,
    emailFeatures: false,
    emailTips: true,
    pushCampaigns: true,
    pushBilling: false
  });

  const [connectedAccounts] = useState([
    { platform: "Facebook", connected: true, status: "Active" },
    { platform: "Instagram", connected: true, status: "Active" },
    { platform: "Google Ads", connected: false, status: "Not Connected" },
    { platform: "LinkedIn", connected: true, status: "Active" },
    { platform: "TikTok", connected: false, status: "Not Connected" }
  ]);

  const handleProfileChange = (field: string, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="page-container space-y-6 py-4 md:py-6">
      <div>
        <h1 className="text-3xl font-bold">Workspace Settings</h1>
        <p className="text-muted-foreground">Tune profile, alerts, security, and connected channels so the team operates from one calmer control surface.</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-secondary/55 p-2 sm:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="profile" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">General</TabsTrigger>
          <TabsTrigger value="workspace" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Workspace</TabsTrigger>
          <TabsTrigger value="ai" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">AI Preferences</TabsTrigger>
          <TabsTrigger value="notifications" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Security</TabsTrigger>
          <TabsTrigger value="appearance" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Appearance</TabsTrigger>
          <TabsTrigger value="integrations" className="min-w-0 whitespace-normal px-3 py-2 text-xs sm:text-sm">Connected</TabsTrigger>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PaletteIcon className="h-5 w-5 text-primary" />Appearance</CardTitle>
              <CardDescription>Theme, density and accent color.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Theme controls coming soon.</CardContent>
          </Card>
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
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => handleProfileChange("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => handleProfileChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleProfileChange("email", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => handleProfileChange("company", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => handleProfileChange("phone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => handleProfileChange("bio", e.target.value)}
                />
              </div>

              <Button className="bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-4 w-4" />
                Save Changes
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Campaign Updates</p>
                      <p className="text-sm text-muted-foreground">Know when campaign status, performance, or readiness changes need attention.</p>
                    </div>
                    <Switch
                      checked={notifications.emailCampaigns}
                      onCheckedChange={(value) => handleNotificationChange("emailCampaigns", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Billing & Payments</p>
                      <p className="text-sm text-muted-foreground">Receive invoices, checkout confirmations, and renewal reminders.</p>
                    </div>
                    <Switch
                      checked={notifications.emailBilling}
                      onCheckedChange={(value) => handleNotificationChange("emailBilling", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Feature Updates</p>
                      <p className="text-sm text-muted-foreground">Hear about meaningful workspace improvements, not every minor release.</p>
                    </div>
                    <Switch
                      checked={notifications.emailFeatures}
                      onCheckedChange={(value) => handleNotificationChange("emailFeatures", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tips & Tutorials</p>
                      <p className="text-sm text-muted-foreground">Get practical guidance for briefs, templates, and campaign operations.</p>
                    </div>
                    <Switch
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
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Campaign Alerts</p>
                      <p className="text-sm text-muted-foreground">Receive real-time nudges when launch-critical events need action.</p>
                    </div>
                    <Switch
                      checked={notifications.pushCampaigns}
                      onCheckedChange={(value) => handleNotificationChange("pushCampaigns", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Billing Reminders</p>
                      <p className="text-sm text-muted-foreground">Stay ahead of low credits, renewals, and payment follow-up.</p>
                    </div>
                    <Switch
                      checked={notifications.pushBilling}
                      onCheckedChange={(value) => handleNotificationChange("pushBilling", value)}
                    />
                  </div>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/90">
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
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                  <Button variant="outline">Update Password</Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-muted-foreground">Add a second layer of protection before anyone can access the workspace.</p>
                  </div>
                  <Button variant="outline">Setup 2FA</Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Active Sessions</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">Chrome on MacOS • Last active now</p>
                    </div>
                    <span className="text-sm text-green-600">Current</span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Mobile Session</p>
                      <p className="text-sm text-muted-foreground">Safari on iPhone • Last active 2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm">Revoke</Button>
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
              <div className="space-y-4">
                {connectedAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{account.platform}</p>
                      <p className="text-sm text-muted-foreground">{account.status}</p>
                    </div>
                    <Button 
                      variant={account.connected ? "outline" : "default"}
                    >
                      {account.connected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                ))}
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
                <div className="flex gap-2 mt-2">
                  <Input id="apiKey" value="av_api_xxxxxxxxxxxxxxxxxxxx" readOnly />
                  <Button variant="outline">Regenerate</Button>
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
              <Button variant="outline">Test Webhook</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
