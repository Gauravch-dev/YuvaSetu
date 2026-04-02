
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { deleteUserAccount, fetchProtectedData, updateProfile } from "@/lib/auth-api";
import { Loader2, AlertTriangle, Building2, User, CreditCard, Bell } from "lucide-react";

export const EmployerSettings = () => {
  const { t } = useTranslation();
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
        toast.error(t('employerSettings.loadFailed'));
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
        toast.success(t('employerSettings.profileUpdated'));
      }
    } catch (error) {
      toast.error(t('employerSettings.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm(t('employerSettings.deleteConfirmWarning'))) return;

    // Double confirmation
    const verification = prompt(t('employerSettings.typeDeleteToConfirm'));
    if (verification !== 'DELETE') return;

    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await deleteUserAccount(token);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        toast.success(t('employerSettings.accountDeleted'));
        navigate('/');
      }
    } catch (error) {
      toast.error(t('employerSettings.deleteFailed'));
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold">{t('employerSettings.title')}</h1>
        <p className="text-muted-foreground">{t('employerSettings.subtitle')}</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-xl">
          <TabsTrigger value="account" className="gap-2">
            <User className="w-4 h-4" />
            {t('employerSettings.tabAccount')}
          </TabsTrigger>
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" />
            {t('employerSettings.tabCompany')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="w-4 h-4" />
            {t('employerSettings.tabBilling')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            {t('employerSettings.tabAlerts')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('employerSettings.personalInfo')}</CardTitle>
              <CardDescription>{t('employerSettings.personalInfoDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="work-email">{t('employerSettings.emailAddress')}</Label>
                <Input id="work-email" value={user?.email || ''} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">{t('employerSettings.emailCannotChange')}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="full-name">{t('employerSettings.fullName')}</Label>
                <Input
                  id="full-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <Button onClick={handleUpdateProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('employerSettings.saveChanges')}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t('employerSettings.dangerZone')}
              </CardTitle>
              <CardDescription className="text-red-600/80">
                {t('employerSettings.dangerZoneDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDeleteAccount}>{t('employerSettings.deleteAccount')}</Button>
              <p className="text-xs text-red-500 mt-2">
                {t('employerSettings.deleteAccountDesc')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('employerSettings.companyProfile')}</CardTitle>
              <CardDescription>{t('employerSettings.companyProfileDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-muted/50 rounded-lg text-center space-y-4 border border-dashed">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{t('employerSettings.visitProfileEditor')}</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                    {t('employerSettings.visitProfileEditorDesc')}
                  </p>
                </div>
                <Button onClick={() => navigate('/dashboard/employer/profile')}>
                  {t('employerSettings.goToCompanyProfile')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('employerSettings.subscriptionPlan')}</CardTitle>
              <CardDescription>{t('employerSettings.subscriptionPlanDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{t('employerSettings.freeTier')}</h4>
                  <p className="text-sm text-muted-foreground">{t('employerSettings.standardAccess')}</p>
                </div>
                <Button variant="outline" disabled>{t('employerSettings.managePlan')}</Button>
              </div>
              <p className="text-sm text-muted-foreground">{t('employerSettings.billingComingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('employerSettings.emailNotifications')}</CardTitle>
              <CardDescription>{t('employerSettings.emailNotificationsDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="new-applications" className="flex flex-col space-y-1">
                  <span>{t('employerSettings.newApplications')}</span>
                  <span className="font-normal text-xs text-muted-foreground">{t('employerSettings.newApplicationsDesc')}</span>
                </Label>
                <Switch id="new-applications" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="candidate-messages" className="flex flex-col space-y-1">
                  <span>{t('employerSettings.candidateMessages')}</span>
                  <span className="font-normal text-xs text-muted-foreground">{t('employerSettings.candidateMessagesDesc')}</span>
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
