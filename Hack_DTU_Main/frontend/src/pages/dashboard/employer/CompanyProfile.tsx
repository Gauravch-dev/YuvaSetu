import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Globe, MapPin, Building2, Loader2 } from 'lucide-react';
import { updateEmployerProfile, fetchProtectedData } from '@/lib/auth-api';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';

export const CompanyProfile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    description: '',
    location: '',
    industry: '',
    size: '',
    logoUrl: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        // Updated: Fetch directly from Employer API
        const profileData = await fetchProtectedData('/api/employer/profile', token);

        if (profileData) {
          setFormData({
            companyName: profileData.companyName || '',
            website: profileData.website || '',
            description: profileData.description || '',
            location: profileData.location || '',
            industry: profileData.industry || '',
            size: profileData.size || '',
            logoUrl: profileData.logoUrl || ''
          });
        }
      } catch (error) {
        console.error('Failed to load profile', error);
      }
    };
    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No auth token');

      // Updated: Use separate Employer Endpoint
      await updateEmployerProfile(token, formData);

      toast.success('Profile updated successfully!', {
        description: 'Your company details have been saved.'
      });

      // Real-time Update Trigger
      window.dispatchEvent(new Event('profile-updated'));

      // Redirect to Overview
      setTimeout(() => {
        navigate('/dashboard/employer');
      }, 500);

    } catch (error: any) {
      toast.error('Failed to save profile', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Company Profile</h1>
        <p className="text-muted-foreground">Update your company details and branding. Required for posting jobs.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-sm space-y-8">

        {/* Logo Section */}
        <div className="flex items-center gap-6 pb-6 border-b border-border">
          <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30 overflow-hidden relative group">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt="Company Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-8 h-8 text-muted-foreground" />
            )}
            {isLoading && <div className="absolute inset-0 bg-background/50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">Company Logo</h3>
            <p className="text-sm text-muted-foreground mb-4">Recommended size 400x400px</p>
            <div className="flex gap-3">
              <input
                type="file"
                id="logo-upload"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    setIsLoading(true);
                    const token = localStorage.getItem('authToken');
                    if (!token) throw new Error("No token");

                    // Dynamic Import to avoid cyclic dependencies if any
                    const { uploadFile } = await import('@/lib/upload-api');
                    const url = await uploadFile(file, token);

                    setFormData(prev => ({ ...prev, logoUrl: url }));
                    toast.success("Logo uploaded!");
                  } catch (err) {
                    toast.error("Upload failed");
                    console.error(err);
                  } finally {
                    setIsLoading(false);
                  }
                }}
              />
              <Button variant="outline" size="sm" className="gap-2" onClick={() => document.getElementById('logo-upload')?.click()}>
                <Upload className="w-3 h-3" /> Upload Logo
              </Button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" value={formData.companyName} onChange={handleChange} placeholder="TechCorp Solutions" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input id="website" className="pl-9" value={formData.website} onChange={handleChange} placeholder="https://techcorp.com" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">About Company</Label>
          <Textarea
            id="description"
            className="min-h-[120px]"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell candidates about your mission and culture..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" value={formData.industry} onChange={handleChange} placeholder="Information Technology" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Company Size</Label>
            <Input id="size" value={formData.size} onChange={handleChange} placeholder="e.g. 50-200 Employees" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Headquarters</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input id="location" className="pl-9" value={formData.location} onChange={handleChange} placeholder="City, Country" />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="employer" size="lg" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};
