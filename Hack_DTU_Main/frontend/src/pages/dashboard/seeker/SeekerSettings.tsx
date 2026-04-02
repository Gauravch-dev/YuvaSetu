import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      toast.success(t('seekerSettings.accountUpdated'));
    } catch (error) {
      toast.error(t('seekerSettings.accountUpdateFailed'));
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
      toast.error(t('seekerSettings.authSessionMissing'));
      return;
    }

    // Check Auth Provider
    const isGoogle = user.providerData.some(p => p.providerId === 'google.com');
    if (isGoogle) {
      setShowGoogleAlert(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('seekerSettings.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('seekerSettings.passwordTooShort'));
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success(t('seekerSettings.passwordUpdated'));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        toast.error(t('seekerSettings.incorrectPassword'));
      } else {
        toast.error(t('seekerSettings.passwordUpdateFailed'));
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
        toast.success(t('seekerSettings.preferencesSaved'));
        setProfile(updatedProfile);
      }
    } catch (error) {
      toast.error(t('seekerSettings.preferencesSaveFailed'));
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

      toast.success(t('seekerSettings.accountDeleted'));
      navigate('/');
      window.location.reload(); // Force full state clear
    } catch (error) {
      console.error(error);
      toast.error(t('seekerSettings.accountDeleteFailed'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) return <div>{t('seekerSettings.loading')}</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">{t('seekerSettings.title')}</h1>
        <p className="text-muted-foreground">{t('seekerSettings.subtitle')}</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="account" className="gap-2">
            <UserIcon className="w-4 h-4" />
            {t('seekerSettings.tabAccount')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            {t('seekerSettings.tabNotifications')}
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2">
            <Shield className="w-4 h-4" />
            {t('seekerSettings.tabPrivacy')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('seekerSettings.profileInfo')}</CardTitle>
              <CardDescription>{t('seekerSettings.profileInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="email">{t('seekerSettings.emailAddress')}</Label>
                <Input id="email" value={profile?.personalInfo?.email || user?.email || ""} disabled className="bg-muted" />
                <p className="text-[10px] text-muted-foreground">{t('seekerSettings.emailCannotChange')}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t('seekerSettings.phoneNumber')}</Label>
                <Input id="phone" value={profile?.personalInfo?.phone || ""} onChange={handlePhoneChange} />
              </div>
              <Button onClick={handleSaveAccount}>{t('seekerSettings.saveChanges')}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('seekerSettings.changePassword')}</CardTitle>
              <CardDescription>{t('seekerSettings.changePasswordDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password">{t('seekerSettings.currentPassword')}</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">{t('seekerSettings.newPassword')}</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">{t('seekerSettings.confirmPassword')}</Label>
                <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleChangePassword}>{t('seekerSettings.updatePassword')}</Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">{t('seekerSettings.deleteAccount')}</CardTitle>
              <CardDescription>{t('seekerSettings.deleteAccountDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>{t('seekerSettings.deleteAccount')}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('seekerSettings.notificationPreferences')}</CardTitle>
              <CardDescription>{t('seekerSettings.notificationPreferencesDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="job-alerts" className="flex flex-col space-y-1">
                  <span>{t('seekerSettings.jobAlerts')}</span>
                  <span className="font-normal text-xs text-muted-foreground">{t('seekerSettings.jobAlertsDesc')}</span>
                </Label>
                <Switch id="job-alerts" checked={preferences.notifications.jobAlerts} onCheckedChange={() => togglePreference('notifications', 'jobAlerts')} />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="application-updates" className="flex flex-col space-y-1">
                  <span>{t('seekerSettings.applicationUpdates')}</span>
                  <span className="font-normal text-xs text-muted-foreground">{t('seekerSettings.applicationUpdatesDesc')}</span>
                </Label>
                <Switch id="application-updates" checked={preferences.notifications.applicationUpdates} onCheckedChange={() => togglePreference('notifications', 'applicationUpdates')} />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="marketing" className="flex flex-col space-y-1">
                  <span>{t('seekerSettings.marketingEmails')}</span>
                  <span className="font-normal text-xs text-muted-foreground">{t('seekerSettings.marketingEmailsDesc')}</span>
                </Label>
                <Switch id="marketing" checked={preferences.notifications.marketing} onCheckedChange={() => togglePreference('notifications', 'marketing')} />
              </div>
              <div className="pt-4">
                <Button onClick={handleSavePreferences}>{t('seekerSettings.savePreferences')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('seekerSettings.privacySettings')}</CardTitle>
              <CardDescription>{t('seekerSettings.privacySettingsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="public-profile" className="flex flex-col space-y-1">
                  <span>{t('seekerSettings.publicProfile')}</span>
                  <span className="font-normal text-xs text-muted-foreground">{t('seekerSettings.publicProfileDesc')}</span>
                </Label>
                <Switch id="public-profile" checked={preferences.privacy.publicProfile} onCheckedChange={() => togglePreference('privacy', 'publicProfile')} />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-email" className="flex flex-col space-y-1">
                  <span>{t('seekerSettings.showEmail')}</span>
                  <span className="font-normal text-xs text-muted-foreground">{t('seekerSettings.showEmailDesc')}</span>
                </Label>
                <Switch id="show-email" checked={preferences.privacy.showEmail} onCheckedChange={() => togglePreference('privacy', 'showEmail')} />
              </div>
              <div className="pt-4">
                <Button onClick={handleSavePreferences}>{t('seekerSettings.savePrivacySettings')}</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Google Alert Dialog */}
      <Dialog open={showGoogleAlert} onOpenChange={setShowGoogleAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('seekerSettings.actionNotAllowed')}</DialogTitle>
            <DialogDescription>
              {t('seekerSettings.googlePasswordMessage')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowGoogleAlert(false)}>{t('seekerSettings.ok')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('seekerSettings.deleteAccountPermanently')}</DialogTitle>
            <DialogDescription>
              {t('seekerSettings.deleteAccountWarning')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="confirm-delete">{t('seekerSettings.typeDeleteToConfirm')}</Label>
            <Input
              id="confirm-delete"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="delete"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>{t('seekerSettings.cancel')}</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteInput !== "delete" || isDeleting}
            >
              {isDeleting ? t('seekerSettings.deleting') : t('seekerSettings.deleteAccount')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
