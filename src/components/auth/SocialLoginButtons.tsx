'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  hoverColor: string;
  textColor: string;
}

// Icon components for social providers
const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill="#1877F2"
    />
  </svg>
);

const DiscordIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0189 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
  </svg>
);

const socialProviders: SocialProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: GoogleIcon,
    bgColor: 'bg-white border',
    hoverColor: 'hover:bg-gray-700',
    textColor: 'text-white/70 hover:text-white',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: FacebookIcon,
    bgColor: 'bg-[#1877F2]',
    hoverColor: 'hover:bg-gray-700',
    textColor: 'text-white/70 hover:text-white',
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: DiscordIcon,
    bgColor: 'bg-[#5865F2]',
    hoverColor: 'hover:bg-gray-700',
    textColor: 'text-white/70 hover:text-white',
  },
];

interface SocialLoginButtonsProps {
  onError?: (error: string) => void;
  isLoading?: boolean;
  className?: string;
  showLabels?: boolean;
  providers?: string[];
}

export function SocialLoginButtons({
  onError,
  isLoading = false,
  className,
  showLabels = true,
  providers = ['google', 'facebook', 'discord'],
}: SocialLoginButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const handleSocialLogin = async (providerId: string) => {
    if (isLoading || loadingProvider) return;

    setLoadingProvider(providerId);

    try {
      const result = await signIn(providerId, {
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        onError?.(result.error);
      }
      // Success case will be handled by NextAuth's callback
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoadingProvider(null);
    }
  };

  const filteredProviders = socialProviders.filter((provider) =>
    providers.includes(provider.id)
  );

  const googleProvider = filteredProviders.find((p) => p.id === 'google');
  const otherProviders = filteredProviders.filter((p) => p.id !== 'google');

  const renderButton = (provider: SocialProvider, isInFlex = false) => {
    const Icon = provider.icon;
    const isProviderLoading = loadingProvider === provider.id;
    const disabled = isLoading || Boolean(loadingProvider);

    return (
      <Button
        key={provider.id}
        type="button"
        variant="outline"
        size="lg"
        className={cn(
          isInFlex ? 'flex-1' : 'w-full',
          'relative cursor-pointer transition-all duration-200',
          provider.bgColor,
          provider.hoverColor,
          provider.textColor,
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => handleSocialLogin(provider.id)}
        disabled={disabled}
      >
        <Icon
          className={cn('h-4 w-4', isInFlex ? 'mr-2' : 'absolute left-4')}
        />
        {isProviderLoading ? (
          <div className="flex items-center space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Connecting...</span>
          </div>
        ) : (
          showLabels &&
          (isInFlex ? provider.name : `Continue with ${provider.name}`)
        )}
      </Button>
    );
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Google button on its own row */}
      {googleProvider && renderButton(googleProvider)}

      {/* Other providers in a flex row */}
      {otherProviders.length > 0 && (
        <div className="flex gap-3">
          {otherProviders.map((provider) => renderButton(provider, true))}
        </div>
      )}
    </div>
  );
}

export default SocialLoginButtons;
