import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useTranslation } from 'react-i18next';

export const PersonalDetails = () => {
  const { t } = useTranslation();
  const { data, updateStepData } = useOnboarding();
  const { personalInfo } = data;

  const handleChange = (field: keyof typeof personalInfo, value: string) => {
    updateStepData('personalInfo', { ...personalInfo, [field]: value });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('personalDetails.fullName')}</Label>
          <Input
            id="fullName"
            value={personalInfo.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder={t('personalDetails.fullNamePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t('personalDetails.email')}</Label>
          <Input
            id="email"
            type="email"
            value={personalInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('personalDetails.emailPlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">{t('personalDetails.phone')}</Label>
          <Input
            id="phone"
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder={t('personalDetails.phonePlaceholder')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">{t('personalDetails.age')}</Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="120"
            value={personalInfo.age || ''}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder={t('personalDetails.agePlaceholder')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t('personalDetails.bio')}</Label>
        <Textarea
          id="bio"
          value={personalInfo.bio || ''}
          onChange={(e) => handleChange('bio', e.target.value)}
          placeholder={t('personalDetails.bioPlaceholder')}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="languages">{t('personalDetails.languages')}</Label>
        <Input
          id="languages"
          value={personalInfo.languages || ''}
          onChange={(e) => handleChange('languages', e.target.value)}
          placeholder={t('personalDetails.languagesPlaceholder')}
        />
        <p className="text-xs text-slate-500">{t('personalDetails.languagesHint')}</p>
      </div>

      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-semibold text-lg">{t('personalDetails.onlinePresence')}</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="linkedin">{t('personalDetails.linkedin')}</Label>
            <Input
              id="linkedin"
              type="url"
              value={personalInfo.linkedin || ''}
              onChange={(e) => handleChange('linkedin', e.target.value)}
              placeholder={t('personalDetails.linkedinPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="github">{t('personalDetails.github')}</Label>
            <Input
              id="github"
              type="url"
              value={personalInfo.github || ''}
              onChange={(e) => handleChange('github', e.target.value)}
              placeholder={t('personalDetails.githubPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portfolio">{t('personalDetails.portfolio')}</Label>
            <Input
              id="portfolio"
              type="url"
              value={personalInfo.portfolio || ''}
              onChange={(e) => handleChange('portfolio', e.target.value)}
              placeholder={t('personalDetails.portfolioPlaceholder')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
