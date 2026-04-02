import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, User, deleteUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { User as UserIcon, Bell, Shield, AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const SeekerSettings = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Dialog States
  const [showGoogleAlert, setShowGoogleAlert] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState({
    notifications: {
      jobAlerts: true,
      applicationUpdates: true,
      marketing: false
    },
    privacy: {
      publicProfile: true,
      showEmail: false
    }
  });

  // Fetch Profile
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Backend Profile only after we have a user
        const loadProfile = async () => {
          const token = localStorage.getItem('authToken');
          if (token) {
            try {
              const { getJobSeekerProfile } = await import('@/lib/auth-api');
              const data = await getJobSeekerProfile(token);
              setProfile(data);
              if (data.preferences) {
                setPreferences(data.preferences);
              }
            } catch (err) {
              console.error("Failed to load profile", err);
            }
          }
        };
        loadProfile();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveAccount = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const { saveJobSeekerProfile } = await import('@/lib/auth-api');
      const updatedProfile = { ...profile };
      await saveJobSeekerProfile(token, updatedProfile);
      toast.success("Account details updated successfully!");
    } catch (error) {
      toast.error("Failed to update account details");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (profile) {
      setProfile({
        ...profile,
        personalInfo: { ...profile.personalInfo, phone: e.target.value }
      });
    }
  };

  const handleChangePassword = async () => {
    if (!user) {
      toast.error("Authentication session missing. Please reload.");
      return;
    }

    // Check Auth Provider
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    if (isGoogle) {
      setShowGoogleAlert(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password should be at least 6 characters");
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        toast.error("Incorrect current password");
      } else {
        toast.error("Failed to update password. Please try logging in again.");
      }
    }
  };

  const togglePreference = (section: 'notifications' | 'privacy', key: string) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: !prev[section as keyof typeof prev][key as keyof typeof prev[typeof section]]
      }
    }));
  };

  const handleSavePreferences = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token && profile) {
        const { saveJobSeekerProfile } = await import('@/lib/auth-api');
        const updatedProfile = {
          ...profile,
          preferences
        };
        await saveJobSeekerProfile(token, updatedProfile);
        toast.success("Preferences saved!");
        setProfile(updatedProfile);
      }
    } catch (error) {
      toast.error("Failed to save preferences");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "delete") return;

    setIsDeleting(true);
    try {
      // 1. Delete Query to Backend (deletes DB user & profile)
      // We need to call backend first because if we delete Firebase user first, 
      // backend middleware might reject the token.
      // Wait, usually backend verification needs valid token.
      const token = localStorage.getItem('authToken');
      if (token) {
        const { deleteUserAccount } = await import('@/lib/auth-api');
        await deleteUserAccount(token);
      }

      // 2. Clear Local State
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');

      // 3. User is technically deleted on backend which triggered firebase delete
      // But to be safe/sure on client side:
      // (Optional) await deleteUser(user!); 
      // Backend already tried to delete firebase user.

      toast.success("Account deleted successfully.");
      navigate('/');
      window.location.reload(); // Force full state clear
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings.</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="account" className="gap-2">
            <UserIcon className="w-4 h-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="w-4 h-4" />
            Privacy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal account details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={profile?.personalInfo?.email || user?.email || ""} disabled className="bg-muted" />
                <p className="text-[10px] text-muted-foreground">Email cannot be changed.</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={profile?.personalInfo?.phone || ""} onChange={handlePhoneChange} />
              </div>
              <Button onClick={handleSaveAccount}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your account is secure with a strong password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleChangePassword}>Update Password</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Delete Account</CardTitle>
              <CardDescription>Permanently remove your account and all data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>Delete Account</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="job-alerts" className="flex flex-col space-y-1">
                  <span>Job Alerts</span>
                  <span className="font-normal text-xs text-muted-foreground">Receive updates about new jobs matching your profile.</span>
                </Label>
                <Switch id="job-alerts" checked={preferences.notifications.jobAlerts} onCheckedChange={() => togglePreference('notifications', 'jobAlerts')} />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="application-updates" className="flex flex-col space-y-1">
                  <span>Application Updates</span>
                  <span className="font-normal text-xs text-muted-foreground">Get notified when your application status changes.</span>
                </Label>
                <Switch id="application-updates" checked={preferences.notifications.applicationUpdates} onCheckedChange={() => togglePreference('notifications', 'applicationUpdates')} />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="marketing" className="flex flex-col space-y-1">
                  <span>Marketing Emails</span>
                  <span className="font-normal text-xs text-muted-foreground">Receive news and special offers.</span>
                </Label>
                <Switch id="marketing" checked={preferences.notifications.marketing} onCheckedChange={() => togglePreference('notifications', 'marketing')} />
              </div>
              <div className="pt-4">
                <Button onClick={handleSavePreferences}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can see your profile details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="public-profile" className="flex flex-col space-y-1">
                  <span>Public Profile</span>
                  <span className="font-normal text-xs text-muted-foreground">Allow employers to find you in search results.</span>
                </Label>
                <Switch id="public-profile" checked={preferences.privacy.publicProfile} onCheckedChange={() => togglePreference('privacy', 'publicProfile')} />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-email" className="flex flex-col space-y-1">
                  <span>Show Email Address</span>
                  <span className="font-normal text-xs text-muted-foreground">Display your email address on your public profile.</span>
                </Label>
                <Switch id="show-email" checked={preferences.privacy.showEmail} onCheckedChange={() => togglePreference('privacy', 'showEmail')} />
              </div>
              <div className="pt-4">
                <Button onClick={handleSavePreferences}>Save Privacy Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Google Alert Dialog */}
      <Dialog open={showGoogleAlert} onOpenChange={setShowGoogleAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Action Not Allowed</DialogTitle>
            <DialogDescription>
              You are signed in with Google. Please manage your password through your Google Account security settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowGoogleAlert(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Account Permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your profile, applications, and remove your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-delete">Type "delete" to confirm</Label>
            <Input
              id="confirm-delete"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="delete"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteInput !== "delete" || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
