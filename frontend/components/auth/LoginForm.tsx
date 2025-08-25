'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { LoginCredentials } from '@/lib/types/auth';
import { AuthService } from '@/lib/auth';
import { useState } from 'react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const [generalError, setGeneralError] = useState<string>('');

  const form = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    setGeneralError('');

    try {
      await login(data);
      
      // Get user and redirect based on role
      const user = AuthService.getUser();
      if (user) {
        const dashboardUrl = AuthService.getDashboardUrl(user.role);
        router.push(dashboardUrl);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : 'Giriş zamanı xəta baş verdi');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-2 text-center pb-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-800 shadow-lg">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              REA INVEST
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Hesabınıza daxil olun
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: 'E-poçt ünvanı tələb olunur',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Keçərli e-poçt ünvanı daxil edin'
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-poçt ünvanı</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e-poçt@nümunə.com"
                          type="email"
                          autoComplete="email"
                          disabled={form.formState.isSubmitting || isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  rules={{
                    required: 'Şifrə tələb olunur',
                    minLength: {
                      value: 6,
                      message: 'Şifrə ən azı 6 simvol olmalıdır'
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Şifrə</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Şifrənizi daxil edin"
                          type="password"
                          autoComplete="current-password"
                          disabled={form.formState.isSubmitting || isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {generalError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-destructive"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-destructive font-medium">{generalError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={form.formState.isSubmitting || isLoading}
                  size="lg"
                >
                  {form.formState.isSubmitting || isLoading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Daxil olunur...
                    </div>
                  ) : (
                    'Daxil ol'
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Test məlumatları: admin@rea-invest.com / password123
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}