import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Mail, Lock, User, Apple } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";

const accountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type AccountFormValues = z.infer<typeof accountSchema>;

interface AccountCreationStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function AccountCreationStep({ 
  data, 
  updateData, 
  onStepCompleted, 
  onNext,
  isCompleted 
}: AccountCreationStepProps) {
  const { registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<'social' | 'email'>('social');

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      firstName: data.name?.split(' ')[0] || "",
      lastName: data.name?.split(' ')[1] || "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (formData: AccountFormValues) => {
    try {
      await registerMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.password, // Add confirmPassword field
        email: formData.email,
      });
      
      updateData({ 
        name: `${formData.firstName} ${formData.lastName}` 
      });
      onStepCompleted();
      onNext();
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    // Placeholder for social authentication
    console.log(`${provider} auth not implemented yet`);
    // For demo purposes, we'll simulate successful auth
    // In real implementation, this would handle OAuth flow
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-neutral-900">Create Your Account</h2>
        <p className="text-neutral-600">Choose how you'd like to sign up</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex rounded-lg bg-neutral-100 p-1">
            <button
              onClick={() => setActiveTab('social')}
              className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                activeTab === 'social'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Social Sign Up
            </button>
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                activeTab === 'email'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Email Sign Up
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeTab === 'social' ? (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('google')}
                className="w-full flex items-center justify-center gap-3 h-11"
                disabled
              >
                <Mail className="h-5 w-5 text-red-500" />
                Continue with Google
                <span className="text-xs text-neutral-400 ml-2">(Coming Soon)</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleSocialAuth('apple')}
                className="w-full flex items-center justify-center gap-3 h-11"
                disabled
              >
                <Apple className="h-5 w-5" />
                Continue with Apple
                <span className="text-xs text-neutral-400 ml-2">(Coming Soon)</span>
              </Button>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-neutral-500">
                  or sign up with email
                </span>
              </div>

              <Button
                variant="ghost"
                onClick={() => setActiveTab('email')}
                className="w-full flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                Use Email Instead
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="johndoe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-neutral-500 text-center">
        By creating an account, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}