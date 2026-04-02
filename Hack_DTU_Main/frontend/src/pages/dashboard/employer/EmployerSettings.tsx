
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { deleteUserAccount, fetchProtectedData, updateProfile } from "@/lib/auth-api";
import { Loader2, AlertTriangle, Building2, User, CreditCard, Bell } from "lucide-react";

export const EmployerSettings = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const data = await fetchProtectedData('/auth/me', token);
        setUser(data);
        setFormData({ name: data.name || '' });
      } catch (error) {
        console.error(error);
        toast.error("Failed to load profile settings");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await updateProfile(token, { name: formData.name });
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("CRITICAL WARNING: This will permanently delete your account, company profile, and all active job postings. This action cannot be undone. Are you absolutely sure?")) return;

    // Double confirmation
    const verification = prompt("Type 'DELETE' to confirm account deletion:");
    if (verification !== 'DELETE') return;

    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await deleteUserAccount(token);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        toast.success("Account deleted. Goodbye.");
        navigate('/');
      }
    } catch (error) {
      toast.error("Failed to delete account. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your company profile and account settings.</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="account" className="gap-2">
            <User className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Alerts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and login credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="work-email">Email Address</Label>
                <Input id="work-email" value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email address cannot be changed directly. Contact support.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
              <CardDescription className="text-red-600/80">
                Irreversible actions for your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteAccount}>Delete Account</Button>
              <p className="text-xs text-red-500 mt-2">
                Deletes your user account, company profile, and all job listings.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
              <CardDescription>Manage your company's public profile, logo, and details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-lg text-center space-y-4 border border-dashed">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">Visit Company Profile Editor</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    We have a dedicated page for managing your comprehensive company profile, including logo, description, and industry details.
                  </p>
                </div>
                <Button onClick={() => navigate('/dashboard/employer/profile')}>
                  Go to Company Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>View and manage your current plan.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Free Tier</h4>
                  <p className="text-sm text-muted-foreground">Standard access</p>
                </div>
                <Button variant="outline" disabled>Manage Plan</Button>
              </div>
              <p className="text-sm text-muted-foreground">Billing features coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage your email preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="new-applications" className="flex flex-col space-y-1">
                  <span>New Applications</span>
                  <span className="font-normal text-xs text-muted-foreground">Get notified when a candidate applies to a job.</span>
                </Label>
                <Switch id="new-applications" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="candidate-messages" className="flex flex-col space-y-1">
                  <span>Candidate Messages</span>
                  <span className="font-normal text-xs text-muted-foreground">Receive emails when candidates reply to messages.</span>
                </Label>
                <Switch id="candidate-messages" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};
