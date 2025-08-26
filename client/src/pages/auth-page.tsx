import { useState } from "react";
import { Link, Redirect } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { AuthErrorBoundary } from "../components/auth/auth-error-boundary";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { Separator } from "../components/ui/separator";
import { Mail, Lock, User, Apple, Leaf, Utensils, ChevronRight } from "lucide-react";
import { Header } from "../components/layout/header";

const loginSchema = z.object({
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
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

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { user, loginMutation, registerMutation } = useAuth();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (formData: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const onRegisterSubmit = async (formData: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync(formData);
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  const handleSocialAuth = (provider: 'google' | 'apple') => {
    // Placeholder for social authentication
    console.log(`${provider} auth not implemented yet`);
    // For demo purposes, we'll simulate successful auth
    // In real implementation, this would handle OAuth flow
  };

  // If user is already logged in, redirect to dashboard
  if (user) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <AuthErrorBoundary>
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Header />
      {/* Left side - Forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Leaf className="h-10 w-10 text-primary-600" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900">NutriScan</h1>
            <p className="text-neutral-600 mt-2">AI-powered calorie estimation</p>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex rounded-lg bg-neutral-100 p-1">
                <button
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                    activeTab === 'login'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`flex-1 text-sm font-medium py-2 px-3 rounded-md transition-colors ${
                    activeTab === 'register'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Register
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {activeTab === 'login' ? (
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Username or Email</FormLabel>
                          <FormControl>
                            <Input placeholder="johndoe or john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }: { field: any }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                    </Button>
                  </form>
                </Form>
              ) : (
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
                      or register with email
                    </span>
                  </div>

                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }: { field: any }) => (
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
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }: { field: any }) => (
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
                        control={registerForm.control}
                        name="email"
                        render={({ field }: { field: any }) => (
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
                        control={registerForm.control}
                        name="username"
                        render={({ field }: { field: any }) => (
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
                        control={registerForm.control}
                        name="password"
                        render={({ field }: { field: any }) => (
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
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }: { field: any }) => (
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
                        {registerMutation.isPending ? 'Creating account...' : 'Create account'}
                      </Button>
                    </form>
                  </Form>
                </div>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-neutral-500 text-center">
            By signing in or creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
      
      {/* Right side - Hero section */}
      <div className="w-full md:w-1/2 bg-primary-600 text-white p-6 md:p-12 hidden md:flex md:flex-col md:justify-center">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <Utensils className="h-16 w-16 mb-6" />
            <h2 className="text-4xl font-bold mb-4">Track Your Nutrition with AI</h2>
            <p className="text-primary-100 text-lg">
              Simply take a photo of your meal and get instant calorie and nutrition information powered by advanced AI.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-primary-500 rounded-full p-1 mr-4">
                <ChevronRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Instant Analysis</h3>
                <p className="text-primary-100">Get calorie counts and nutritional breakdown in seconds</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary-500 rounded-full p-1 mr-4">
                <ChevronRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Track Progress</h3>
                <p className="text-primary-100">Monitor your nutrition over time with detailed statistics</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="bg-primary-500 rounded-full p-1 mr-4">
                <ChevronRight className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Recommendations</h3>
                <p className="text-primary-100">Receive personalized nutrition tips based on your eating habits</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </AuthErrorBoundary>
  );
}