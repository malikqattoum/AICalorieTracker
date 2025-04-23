import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Check, Mail, MapPin, Phone, Send } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      console.log("Form submitted:", data);
      setIsSubmitting(false);
      setIsSubmitted(true);
      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
    }, 1500);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Have questions about NutriScan? We're here to help. Reach out to our team and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Contact information */}
            <div className="lg:col-span-1">
              <div className="space-y-8">
                <Card className="border border-neutral-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-primary-100 rounded-full p-3 mr-4">
                        <Mail className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                        <p className="text-neutral-600 mb-1">For general inquiries:</p>
                        <a href="mailto:hello@nutriscan.app" className="text-primary-600 hover:text-primary-700 font-medium">
                          hello@nutriscan.app
                        </a>
                        <p className="text-neutral-600 mt-2 mb-1">For support:</p>
                        <a href="mailto:support@nutriscan.app" className="text-primary-600 hover:text-primary-700 font-medium">
                          support@nutriscan.app
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-neutral-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-primary-100 rounded-full p-3 mr-4">
                        <Phone className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                        <p className="text-neutral-600 mb-1">Customer service:</p>
                        <a href="tel:+1-800-123-4567" className="text-primary-600 hover:text-primary-700 font-medium">
                          +1 (800) 123-4567
                        </a>
                        <p className="text-neutral-600 mt-2 mb-1">Hours of operation:</p>
                        <p className="text-neutral-700">Monday - Friday: 9am - 5pm EST</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-neutral-200 bg-white shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <div className="bg-primary-100 rounded-full p-3 mr-4">
                        <MapPin className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                        <p className="text-neutral-600 mb-1">Our headquarters:</p>
                        <address className="not-italic text-neutral-700">
                          123 Nutrition Street<br />
                          Suite 456<br />
                          San Francisco, CA 94107<br />
                          United States
                        </address>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <Card className="border border-neutral-200 bg-white shadow-sm">
                <CardContent className="p-6 md:p-8">
                  {isSubmitted ? (
                    <div className="text-center py-8">
                      <div className="bg-green-100 rounded-full p-4 inline-flex mx-auto mb-6">
                        <Check className="h-10 w-10 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-2">Message Received!</h3>
                      <p className="text-neutral-600 mb-6">
                        Thank you for reaching out. We've received your message and will get back to you as soon as possible.
                      </p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline">
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Send Us a Message</h2>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Name</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Doe" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Address</FormLabel>
                                  <FormControl>
                                    <Input placeholder="john@example.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Subject</FormLabel>
                                <FormControl>
                                  <Input placeholder="How can we help you?" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Message</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us more about your inquiry..." 
                                    className="min-h-[150px]"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? (
                              <>
                                <Mail className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <Send className="mr-2 h-4 w-4" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ section */}
          <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  question: "How accurate is NutriScan's food recognition?",
                  answer: "NutriScan's AI can identify thousands of foods with an accuracy rate of over 90%. For common foods, the accuracy is even higher. However, for homemade dishes with many ingredients or rare foods, accuracy may vary."
                },
                {
                  question: "Does NutriScan work offline?",
                  answer: "NutriScan requires an internet connection to analyze images as our AI processing happens on secure cloud servers. This allows us to maintain a powerful recognition system without requiring excessive device resources."
                },
                {
                  question: "How is my data used and protected?",
                  answer: "We take data privacy seriously. Your food images and analysis results are used to improve our service and provide personalized insights. All data is encrypted and stored securely. You can request data deletion at any time."
                },
                {
                  question: "Can I use NutriScan for dietary restrictions?",
                  answer: "Yes! NutriScan can help identify foods that match your dietary preferences or restrictions. You can set up allergies, vegetarian/vegan preferences, and other dietary needs in your profile settings."
                }
              ].map((faq, index) => (
                <div key={index} className="mb-4">
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">{faq.question}</h3>
                  <p className="text-neutral-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}