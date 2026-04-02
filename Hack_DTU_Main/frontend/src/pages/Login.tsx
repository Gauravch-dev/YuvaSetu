import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, UserSearch, Building2, ArrowRight, Loader2, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, sendEmailVerification, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { registerUser, loginUser, checkForgotPassword } from '@/lib/auth-api';

export const LoginPage = () => {
  const { userType = 'seeker' } = useParams<{ userType: 'seeker' | 'employer' }>();
  const isSeeker = userType === 'seeker';
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // UX states
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Password strength calculation
  const getPasswordStrength = (pass: string): 'weak' | 'medium' | 'strong' | null => {
    if (!pass) return null;
    const hasLower = /[a-z]/.test(pass);
    const hasUpper = /[A-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (pass.length < 6) return 'weak';
    if (score >= 3 && pass.length >= 8) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  };


  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setEmailError('');
    setIsEmailValid(validateEmail(value));
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      setIsEmailValid(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordError('');
    setPasswordStrength(getPasswordStrength(value));
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const token = await userCredential.user.getIdToken();

      try {
        const userData = await loginUser(token);
        localStorage.setItem('authToken', token);

        const expectedRole = isSeeker ? 'JOB_SEEKER' : 'EMPLOYER';
        if (userData.role !== expectedRole) {
          await signOut(auth);
          localStorage.removeItem('authToken');
          throw new Error(`You are registered as a ${userData.role === 'JOB_SEEKER' ? 'Job Seeker' : 'Employer'}. Please use the ${userData.role === 'JOB_SEEKER' ? 'Student' : 'Employer'} login.`);
        }

        toast.success('Welcome back!');

        if (userData.isOnboardingComplete) {
          navigate(userData.role === 'JOB_SEEKER' ? '/dashboard' : '/dashboard/employer');
        } else {
          navigate(userData.role === 'JOB_SEEKER' ? '/onboarding' : '/dashboard/employer');
        }
      } catch (loginError: any) {
        if (loginError.message.includes('User not registered') || loginError.message.includes('not found')) {
          const userData = await registerUser({
            idToken: token,
            role: isSeeker ? 'JOB_SEEKER' : 'EMPLOYER',
            authProvider: 'google'
          });

          localStorage.setItem('authToken', token);
          toast.success('Account created!');
          navigate(userData.role === 'JOB_SEEKER' ? '/onboarding' : '/dashboard/employer');
        } else {
          await signOut(auth);
          localStorage.removeItem('authToken');
          throw loginError;
        }
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Google sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Check eligibility with backend (Must be email provider)
      await checkForgotPassword(email);

      // 2. If eligible, send Firebase reset email
      await sendPasswordResetEmail(auth, email);

      toast.success('Password reset email sent!', {
        description: 'Check your inbox for instructions.',
      });

      setIsForgotPassword(false); // Go back to login
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasErrors = false;
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasErrors = true;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErrors = true;
    }
    if (hasErrors) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // --- STRICT LOGIN FLOW ---
        // Set session persistence based on "Remember Me" checkbox
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 1. CHECK EMAIL VERIFICATION
        if (!user.emailVerified) {
          await signOut(auth);
          toast.error('Email not verified', {
            description: 'Please check your inbox and verify your email before logging in.',
            duration: 6000,
          });
          return;
        }

        const token = await user.getIdToken();

        try {
          const userData = await loginUser(token);
          localStorage.setItem('authToken', token);

          const expectedRole = isSeeker ? 'JOB_SEEKER' : 'EMPLOYER';
          if (userData.role !== expectedRole) {
            await signOut(auth);
            localStorage.removeItem('authToken');
            throw new Error(`You are registered as a ${userData.role === 'JOB_SEEKER' ? 'Job Seeker' : 'Employer'}. Please use the ${userData.role === 'JOB_SEEKER' ? 'Student' : 'Employer'} login.`);
          }

          toast.success('Welcome back!');

          if (userData.isOnboardingComplete) {
            navigate(userData.role === 'JOB_SEEKER' ? '/dashboard' : '/dashboard/employer');
          } else {
            navigate(userData.role === 'JOB_SEEKER' ? '/onboarding' : '/dashboard/employer');
          }
        } catch (backendError: any) {
          await signOut(auth);
          localStorage.removeItem('authToken');
          throw new Error('Not registered. Please sign up first.');
        }

      } else {
        // --- SIGNUP FLOW (Email Link) ---
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const token = await user.getIdToken();

        await sendEmailVerification(user);

        await registerUser({
          idToken: token,
          role: isSeeker ? 'JOB_SEEKER' : 'EMPLOYER',
          authProvider: 'email'
        });

        await signOut(auth);

        toast.success('Account created!', {
          description: 'We sent a verification link to your email. Please verify before logging in.',
          duration: 6000,
        });

        setIsLogin(true);
      }
    } catch (error: any) {
      console.error(error);
      let msg = 'Authentication failed';
      if (error.code === 'auth/email-already-in-use') msg = 'Email already in use. Please log in.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') msg = 'Invalid email or password, try using google sign in';
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email. Please sign up.';
      if (error.code === 'auth/too-many-requests') msg = 'Too many failed attempts. Please try again later.';
      if (error.message && !error.code) msg = error.message;
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const gradientClass = isSeeker
    ? 'from-[hsl(221_83%_53%)] to-[hsl(199_89%_48%)]'
    : 'from-[hsl(174_72%_40%)] to-[hsl(160_84%_39%)]';

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated Video-like Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-secondary/20 to-background">
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 opacity-30">
          <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-br ${gradientClass} opacity-20 animate-mesh-1`} />
          <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-tl from-accent/30 to-primary/30 opacity-20 animate-mesh-2`} />
          <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-primary/20 to-accent/20 opacity-20 animate-mesh-3`} />
        </div>

        {/* Floating geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`absolute rounded-full ${isSeeker ? 'bg-primary/10' : 'bg-accent/10'} blur-xl`}
              style={{
                width: `${Math.random() * 300 + 50}px`,
                height: `${Math.random() * 300 + 50}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-random ${Math.random() * 20 + 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          ))}
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.1) 1px, transparent 1px),
                             linear-gradient(90deg, hsl(var(--foreground) / 0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Container */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          {/* Left Card - Branding & Info */}
          <div className="glass rounded-3xl p-10 flex flex-col justify-between border border-border/50 shadow-card backdrop-blur-2xl">
            {/* Logo */}
            <div>
              <Link to="/" className="flex items-center gap-3 mb-12 group">
                <div className={`w-14 h-14 rounded-2xl ${isSeeker ? 'bg-primary/10' : 'bg-accent/10'} border-[3px] border-black flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300 overflow-hidden`}>
                  <img src="/favicon.ico" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-display font-bold text-3xl text-foreground">
                  Yuva<span className={isSeeker ? 'text-primary-seeker' : 'text-primary-employer'}>Setu</span>
                </span>
              </Link>

              {/* Info Content */}
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-foreground">
                {isSeeker ? (
                  <>
                    Find Your
                    <br />
                    <span className="text-primary-seeker">Dream Career</span>
                  </>
                ) : (
                  <>
                    Discover
                    <br />
                    <span className="text-primary-employer">Top Talent</span>
                  </>
                )}
              </h1>

              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                {isSeeker
                  ? 'Join thousands who found their perfect role through AI-powered, transparent job matching across all fields.'
                  : 'Access qualified candidates matched to your requirements with our intelligent recruitment platform.'}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-6 mb-8">
                <div className="flex -space-x-3">
                  {isSeeker ? (
                    // Job Seeker: Profile avatars
                    [
                      '/avatar_user_1_1767626189492.png',
                      '/avatar_user_2_1767626206762.png',
                      '/avatar_user_3_1767626221796.png',
                      '/avatar_user_4_1767626237799.png'
                    ].map((avatar, i) => (
                      <div
                        key={i}
                        className="w-11 h-11 rounded-full border-3 border-background shadow-lg overflow-hidden hover:scale-110 hover:z-10 transition-transform"
                        style={{ zIndex: 4 - i }}
                      >
                        <img
                          src={avatar}
                          alt={`Student ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center"><span class="text-xs font-bold text-white">U${i + 1}</span></div>`;
                            }
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    // Employer: Company logos  
                    [
                      '/companies/google.png',
                      '/companies/microsoft.jpeg',
                      '/companies/amazon.png',
                      '/companies/meta.png',
                      '/companies/apple.png'
                    ].map((logo, i) => (
                      <div
                        key={i}
                        className="w-11 h-11 rounded-xl border-3 border-background shadow-lg overflow-hidden bg-white dark:bg-gray-800 p-1.5 hover:scale-110 hover:z-10 transition-transform"
                        style={{ zIndex: 5 - i }}
                      >
                        <img
                          src={logo}
                          alt={`Company ${i + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br ${gradientClass} flex items-center justify-center rounded"><span class="text-xs font-bold text-white">C${i + 1}</span></div>`;
                            }
                          }}
                        />
                      </div>
                    ))
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="text-foreground font-semibold">{isSeeker ? '10,000+' : '500+'}</span> {isSeeker ? 'careers found' : 'companies hiring'}
                </p>
              </div>
            </div>

            {/* Role Switch at Bottom */}
            <div className="pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground mb-4">
                {isSeeker ? 'Looking to hire talent?' : 'Looking for a job?'}
              </p>
              <Link to={isSeeker ? '/login/employer' : '/login/seeker'} className="block">
                <Button variant="outline" className="w-full gap-2 h-12">
                  {isSeeker ? <Briefcase className="w-5 h-5" /> : <UserSearch className="w-5 h-5" />}
                  {isSeeker ? 'Switch to Employer Portal' : 'Switch to Job Seeker Portal'}
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Card - Form */}
          <div className="glass rounded-3xl p-10 border border-border/50 shadow-card backdrop-blur-2xl">
            {/* Role Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isSeeker ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
              }`}>
              {isSeeker ? <UserSearch className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
              <span className="text-sm font-medium">{isSeeker ? 'Job Seeker' : 'Employer'}</span>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h2 className="font-display text-3xl font-bold mb-2 text-foreground">
                {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome Back!' : 'Get Started')}
              </h2>
              <p className="text-muted-foreground">
                {isForgotPassword
                  ? 'Enter your email to receive password reset instructions'
                  : (isLogin
                    ? `Sign in to ${isSeeker ? 'continue your career journey' : 'manage your postings'}`
                    : `Create your account to ${isSeeker ? 'find opportunities' : 'hire talent'}`)}
              </p>
            </div>

            {/* Forgot Password Form */}
            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`pl-12 pr-12 h-12 ${emailError ? 'border-red-500 focus-visible:ring-red-500' :
                      isEmailValid ? 'border-green-500 focus-visible:ring-green-500' : ''
                      }`}
                    required
                  />
                </div>
                {emailError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}

                <Button
                  type="submit"
                  variant={isSeeker ? 'seeker' : 'employer'}
                  size="lg"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsForgotPassword(false)}
                  disabled={isLoading}
                >
                  Back to Login
                </Button>
              </form>
            ) : (
              /* Main Form */
              <form onSubmit={handleSubmit} className="space-y-4">

                {!isLogin && (
                  <>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-12 h-12"
                        required
                      />
                    </div>
                    {!isSeeker && (
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Company Name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="pl-12 h-12"
                          required
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    className={`pl-12 pr-12 h-12 ${emailError ? 'border-red-500 focus-visible:ring-red-500' :
                      isEmailValid ? 'border-green-500 focus-visible:ring-green-500' : ''
                      }`}
                    required
                  />
                  {isEmailValid && (
                    <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                  )}
                  {emailError && (
                    <AlertCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                  )}
                </div>
                {emailError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {emailError}
                  </p>
                )}

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    className={`pl-12 pr-12 h-12 ${passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''
                      }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {passwordError}
                  </p>
                )}

                {/* Password Strength Indicator (Signup only) */}
                {!isLogin && passwordStrength && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength === 'weak' ? 'bg-red-500' :
                        passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength === 'medium' ? 'bg-yellow-500' :
                        passwordStrength === 'strong' ? 'bg-green-500' : 'bg-muted'
                        }`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-muted'
                        }`} />
                    </div>
                    <p className={`text-xs ${passwordStrength === 'weak' ? 'text-red-500' :
                      passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                      Password strength: {passwordStrength}
                    </p>
                  </div>
                )}


                {isLogin && (
                  <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className={`${isSeeker ? 'text-primary' : 'text-accent'} hover:underline font-medium`}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  variant={isSeeker ? 'seeker' : 'employer'}
                  size="lg"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isLogin ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground uppercase">Or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Social Login */}
            <div className="flex justify-center">
              <Button type="button" variant="outline" className="h-11 w-full max-w-xs" onClick={handleGoogleLogin}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </Button>
            </div>

            {/* Toggle */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className={`ml-2 ${isSeeker ? 'text-primary' : 'text-accent'} hover:underline font-semibold`}
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;