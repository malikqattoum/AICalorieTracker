import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Calendar, Ruler, Weight } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";

const personalInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(13, "You must be at least 13 years old").max(120, "Please enter a valid age"),
  gender: z.string().min(1, "Please select your gender"),
  height: z.number().min(100, "Height must be at least 100cm").max(250, "Please enter a valid height"),
  weight: z.number().min(30, "Weight must be at least 30kg").max(300, "Please enter a valid weight"),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

interface PersonalInfoStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function PersonalInfoStep({ 
  data, 
  updateData, 
  onStepCompleted, 
  onNext,
  isCompleted 
}: PersonalInfoStepProps) {
  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: data.name || "",
      age: data.age || undefined,
      gender: data.gender || "",
      height: data.height || undefined,
      weight: data.weight || undefined,
    },
  });

  const onSubmit = (formData: PersonalInfoFormValues) => {
    updateData({
      name: formData.name,
      age: formData.age,
      gender: formData.gender,
      height: formData.height,
      weight: formData.weight,
    });
    onStepCompleted();
    onNext();
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
          <User className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Tell Us About You</h2>
        <p className="text-neutral-600">This helps us personalize your nutrition recommendations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4 text-primary-600" />
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary-600" />
                        Age
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="25" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="height"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Ruler className="h-4 w-4 text-primary-600" />
                        Height (cm)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="170" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-primary-600" />
                        Weight (kg)
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="70" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="text-xs text-neutral-500 text-center space-y-1">
        <p>Your personal information is kept private and secure.</p>
        <p>We use this data only to provide personalized recommendations.</p>
      </div>
    </div>
  );
}