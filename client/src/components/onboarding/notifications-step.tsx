import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Clock, TrendingUp, Utensils, Shield } from "lucide-react";
import { OnboardingData } from "@/pages/onboarding-page";

interface NotificationsStepProps {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  onStepCompleted: () => void;
  onNext: () => void;
  isCompleted: boolean;
}

export default function NotificationsStep({ 
  data, 
  updateData, 
  onStepCompleted, 
  onNext,
  isCompleted 
}: NotificationsStepProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    data.notificationsEnabled !== undefined ? data.notificationsEnabled : true
  );
  const [permissionStatus, setPermissionStatus] = useState<'default' | 'granted' | 'denied'>('default');

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
    updateData({ notificationsEnabled: enabled });
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          updateData({ notificationsEnabled: true });
        } else {
          setNotificationsEnabled(false);
          updateData({ notificationsEnabled: false });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        setPermissionStatus('denied');
      }
    }
  };

  const handleContinue = () => {
    onStepCompleted();
    onNext();
  };

  const handleSkip = () => {
    updateData({ notificationsEnabled: false });
    onNext();
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
          <Bell className="h-6 w-6 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Stay on Track</h2>
        <p className="text-neutral-600">Get helpful reminders to maintain your nutrition goals</p>
      </div>

      {/* Notification Benefits */}
      <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-200">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary-600" />
            What you'll get
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-neutral-900">Daily Meal Reminders</h4>
                <p className="text-xs text-neutral-600">Gentle nudges to log your meals and stay consistent</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <TrendingUp className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-neutral-900">Progress Updates</h4>
                <p className="text-xs text-neutral-600">Weekly summaries of your nutrition achievements</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Utensils className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm text-neutral-900">Smart Meal Suggestions</h4>
                <p className="text-xs text-neutral-600">AI-powered meal ideas delivered at the right time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Toggle */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="text-base font-medium">
                Enable Notifications
              </Label>
              <p className="text-sm text-neutral-600">
                Allow NutriScan to send you helpful reminders
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
            />
          </div>
          
          {notificationsEnabled && permissionStatus === 'default' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  🔔 To receive notifications, we need your browser's permission.
                </p>
                <Button
                  onClick={requestNotificationPermission}
                  size="sm"
                  className="w-full"
                >
                  Allow Notifications
                </Button>
              </div>
            </div>
          )}
          
          {permissionStatus === 'granted' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Perfect! You'll receive helpful reminders to stay on track.
              </p>
            </div>
          )}
          
          {permissionStatus === 'denied' && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                ℹ️ Notifications are blocked. You can enable them later in your browser settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Card className="bg-neutral-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Shield className="h-5 w-5 text-neutral-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm text-neutral-900">Your Privacy</h4>
              <p className="text-xs text-neutral-600">
                We'll only send helpful, relevant notifications. No spam, ever. 
                You can adjust or disable these anytime in your settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Button 
          variant="ghost"
          onClick={handleSkip}
          className="text-neutral-500"
        >
          Skip for Now
        </Button>
        
        <Button onClick={handleContinue}>
          Continue
        </Button>
      </div>
    </div>
  );
}