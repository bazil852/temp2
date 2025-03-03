import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, Camera, X } from 'lucide-react';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [niche, setNiche] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isMagicLink, setIsMagicLink] = useState(false);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('Profile photo must be less than 2MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return;
      }
      setSelectedAvatar(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isMagicLink) {
        const { error: magicLinkError } = await supabase.auth.signInWithOtp({
          email,
        });
        if (magicLinkError) throw magicLinkError;
        setMagicLinkSent(true);
      } else if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        if (!displayName.trim()) {
          throw new Error('Display name is required');
        }

        // First sign up the user
        const { data: { user }, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;
        if (!user) throw new Error('Signup failed');

        // Upload avatar if selected
        let avatarUrl = '';
        if (selectedAvatar) {
          const fileExt = selectedAvatar.name.split('.').pop();
          const fileName = `${user.id}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, selectedAvatar);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          
          avatarUrl = publicUrl;
        }

        // Get auth webhook URL
        const { data: webhookData, error: webhookError } = await supabase
          .from('webhooks')
          .select('url')
          .eq('type', 'auth_webhook')
          .single();

        if (webhookError) {
          console.error('Error fetching webhook:', webhookError);
        }

        // Update profile with display name and avatar
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            avatar_url: avatarUrl || null,
            phone_number: phoneNumber || null,
            niche: niche || null,
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        // Send data to webhook if URL exists
        if (webhookData?.url) {
          try {
            const joined_at = new Date().toISOString();
            await fetch(webhookData.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                display_name: displayName,
                email: email,
                phone_number: phoneNumber || null,
                niche: niche || null,
                bio: null,
                joined_at: joined_at
              }),
            });
          } catch (webhookErr) {
            console.error('Error calling webhook:', webhookErr);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="max-w-6xl w-full flex flex-col sm:flex-row items-center gap-8">
        {/* YouTube Video Section - Desktop Only */}
        <div className="hidden sm:block flex-1 w-full">
          <div className="aspect-video rounded-2xl overflow-hidden bg-[#c9fffc]/5 backdrop-blur-sm border border-[#c9fffc]/10 shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/bTz_1_6LD6I"
              title="Community App Introduction"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>

        {/* Auth Form Section */}
        <div className="flex-1 relative w-full max-w-md">
          <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-24 h-24 rounded-full bg-gray-900 p-4 ring-8 ring-[#c9fffc]/10 z-20">
            <img
              src="https://i.ibb.co/pjH3NFK5/Booklet-App.png"
              alt="Community Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <div className="w-full p-8 pt-16 bg-[#c9fffc]/5 backdrop-blur-sm border border-[#c9fffc]/10 rounded-2xl shadow-2xl z-10">
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-400 text-center mb-8">
              {isLogin 
                ? isMagicLink 
                  ? 'Enter your email to receive a magic link'
                  : 'Sign in to continue to Community' 
                : 'Create a new account to get started'}
            </p>
            
            {/* YouTube Video Section - Mobile Only */}
            <div className="sm:hidden mb-8">
              <div className="aspect-video rounded-xl overflow-hidden bg-[#c9fffc]/5 backdrop-blur-sm border border-[#c9fffc]/10">
                <iframe
                  width="100%"
                  height="100%"
                  src="https://www.youtube.com/embed/bTz_1_6LD6I"
                  title="Community App Introduction"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
            
            {magicLinkSent ? (
              <div className="text-center space-y-4">
                <div className="bg-[#c9fffc]/10 border border-[#c9fffc]/20 rounded-lg p-4">
                  <p className="text-white">Magic link sent! ✨</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Check your email for the login link
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMagicLinkSent(false);
                    setIsMagicLink(false);
                    setEmail('');
                  }}
                  className="text-[#c9fffc] hover:text-white text-sm transition-colors"
                >
                  Try another method
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div className="flex gap-6 items-start">
                    <div className="flex-1">
                      <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1">
                        Display Name
                      </label>
                      <input
                        id="displayName"
                        type="text"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="block w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-[#c9fffc]/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:border-transparent transition-colors"
                        placeholder="How should we call you?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Profile Photo
                      </label>
                      <div className="relative">
                        <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-gray-800/50 backdrop-blur-sm border border-[#c9fffc]/10">
                          {selectedAvatar ? (
                            <img
                              src={URL.createObjectURL(selectedAvatar)}
                              alt="Selected avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Camera className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarSelect}
                          ref={fileInputRef}
                          className="hidden"
                        />
                        {selectedAvatar ? (
                          <button
                            type="button"
                            onClick={() => setSelectedAvatar(null)}
                            className="absolute bottom-0 right-0 p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute bottom-0 right-0 p-2 bg-[#c9fffc] rounded-full hover:bg-[#a0fcf9] transition-colors"
                          >
                            <Camera className="w-4 h-4 text-gray-900" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="phoneNumber"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="block w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-[#c9fffc]/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:border-transparent transition-colors"
                        placeholder="Your phone number"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="niche" className="block text-sm font-medium text-gray-300 mb-1">
                        Niche (Optional)
                      </label>
                      <input
                        id="niche"
                        type="text"
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        className="block w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-[#c9fffc]/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:border-transparent transition-colors"
                        placeholder="Your area of expertise"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-[#c9fffc]/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:border-transparent transition-colors"
                />
              </div>

              {!isMagicLink && <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 bg-gray-800/50 backdrop-blur-sm border border-[#c9fffc]/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:border-transparent transition-colors"
                />
              </div>}

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              {isLogin && (
                <button
                  type="button"
                  onClick={() => setIsMagicLink(!isMagicLink)}
                  className="w-full text-[#c9fffc] hover:text-white text-sm transition-colors"
                >
                  {isMagicLink
                    ? "Use password instead"
                    : "Continue with magic link"}
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 bg-[#c9fffc] text-gray-900 rounded-xl hover:bg-[#a0fcf9] focus:outline-none focus:ring-2 focus:ring-[#c9fffc] focus:ring-offset-2 focus:ring-offset-gray-900 font-medium shadow-lg shadow-[#c9fffc]/10 transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    {isMagicLink ? 'Send Magic Link' : 'Sign In'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Sign Up
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="w-full text-gray-400 hover:text-white text-sm transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}