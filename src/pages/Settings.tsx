import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Database
} from "lucide-react";
const Settings = () => {
  const [profile, setProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    company: "AdVista Pro",
    bio: "Digital marketing professional with 5+ years of experience in advertising and campaign optimization.",
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
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
                      <p className="text-sm text-muted-foreground">Get notified about campaign performance and status changes</p>
                    </div>
                    <Switch
                      checked={notifications.emailCampaigns}
                      onCheckedChange={(value) => handleNotificationChange("emailCampaigns", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Billing & Payments</p>
                      <p className="text-sm text-muted-foreground">Receive billing statements and payment confirmations</p>
                    </div>
                    <Switch
                      checked={notifications.emailBilling}
                      onCheckedChange={(value) => handleNotificationChange("emailBilling", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Feature Updates</p>
                      <p className="text-sm text-muted-foreground">Stay informed about new features and improvements</p>
                    </div>
                    <Switch
                      checked={notifications.emailFeatures}
                      onCheckedChange={(value) => handleNotificationChange("emailFeatures", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Tips & Tutorials</p>
                      <p className="text-sm text-muted-foreground">Educational content to improve your advertising</p>
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
                      <p className="text-sm text-muted-foreground">Real-time alerts for important campaign events</p>
                    </div>
                    <Switch
                      checked={notifications.pushCampaigns}
                      onCheckedChange={(value) => handleNotificationChange("pushCampaigns", value)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Billing Reminders</p>
                      <p className="text-sm text-muted-foreground">Credit low alerts and payment reminders</p>
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
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
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
