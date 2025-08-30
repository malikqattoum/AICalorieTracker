import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, Settings, Key, CheckCircle, AlertCircle, Save } from "lucide-react";
import { apiRequest } from "@/lib/apiRequest";

interface AIConfig {
  id: number;
  provider: string;
  apiKeyEncrypted: string | null;
  hasApiKey: boolean;
  modelName: string;
  temperature: number;
  maxTokens: number;
  promptTemplate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AIConfigPanel() {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [activeTab, setActiveTab] = useState("openai");
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch AI configurations
  const { data: aiConfigs, isLoading } = useQuery({
    queryKey: ['ai-configs'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/ai-config');
      if (!response.ok) {
        throw new Error('Failed to fetch AI configurations');
      }
      return response.json();
    },
  });

  // Update AI configuration
  const updateConfigMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest(`/api/admin/ai-config/${id}`, {
        method: 'PUT',
        body: data,
      });
      if (!response.ok) {
        throw new Error('Failed to update AI configuration');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI configuration updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Activate AI provider
  const activateProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/ai-config/${id}/activate`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to activate AI provider');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "AI provider activated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['ai-configs'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to activate provider: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (aiConfigs) {
      setConfigs(aiConfigs);
      // Initialize form data
      const initialFormData: { [key: string]: any } = {};
      aiConfigs.forEach((config: AIConfig) => {
        initialFormData[config.provider] = {
          apiKey: '',
          modelName: config.modelName,
          temperature: config.temperature / 100, // Convert back to decimal
          maxTokens: config.maxTokens,
          promptTemplate: config.promptTemplate,
        };
      });
      setFormData(initialFormData);
    }
  }, [aiConfigs]);

  const handleFormChange = (provider: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value
      }
    }));
  };

  const handleSaveConfig = async (provider: string) => {
    const config = configs.find(c => c.provider === provider);
    if (!config) return;

    const data = {
      ...formData[provider],
      temperature: Math.round(formData[provider].temperature * 100), // Convert to integer
    };

    // Only include API key if it's been changed
    if (data.apiKey && data.apiKey.trim()) {
      data.apiKey = data.apiKey.trim();
    } else {
      delete data.apiKey;
    }

    await updateConfigMutation.mutateAsync({ id: config.id, data });
  };

  const handleActivateProvider = async (provider: string) => {
    const config = configs.find(c => c.provider === provider);
    if (!config) return;

    await activateProviderMutation.mutateAsync(config.id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Bot className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading AI configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">AI Configuration</h2>
          <p className="text-neutral-600">Manage AI providers for food image analysis</p>
        </div>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {configs.map((config) => (
              <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${config.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-medium capitalize">{config.provider}</p>
                    <p className="text-sm text-neutral-600">{config.modelName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {config.hasApiKey ? (
                    <Badge variant="default">
                      <Key className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      No API Key
                    </Badge>
                  )}
                  {config.isActive && (
                    <Badge variant="secondary">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="openai">OpenAI</TabsTrigger>
              <TabsTrigger value="gemini">Google Gemini</TabsTrigger>
              <TabsTrigger value="testing">AI Testing</TabsTrigger>
            </TabsList>

            <TabsContent value="openai" className="space-y-4 mt-6">
              {formData.openai && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="openai-api-key">API Key</Label>
                      <Input
                        id="openai-api-key"
                        type="password"
                        placeholder="sk-..."
                        value={formData.openai.apiKey}
                        onChange={(e) => handleFormChange('openai', 'apiKey', e.target.value)}
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Leave empty to keep existing key
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="openai-model">Model Name</Label>
                      <Input
                        id="openai-model"
                        value={formData.openai.modelName}
                        onChange={(e) => handleFormChange('openai', 'modelName', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="openai-temperature">Temperature ({formData.openai.temperature})</Label>
                      <Input
                        id="openai-temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.openai.temperature}
                        onChange={(e) => handleFormChange('openai', 'temperature', parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="openai-tokens">Max Tokens</Label>
                      <Input
                        id="openai-tokens"
                        type="number"
                        value={formData.openai.maxTokens}
                        onChange={(e) => handleFormChange('openai', 'maxTokens', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="openai-prompt">Prompt Template</Label>
                    <Textarea
                      id="openai-prompt"
                      rows={4}
                      value={formData.openai.promptTemplate}
                      onChange={(e) => handleFormChange('openai', 'promptTemplate', e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => handleSaveConfig('openai')}
                      disabled={updateConfigMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleActivateProvider('openai')}
                      disabled={activateProviderMutation.isPending}
                    >
                      Set as Active Provider
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="gemini" className="space-y-4 mt-6">
              {formData.gemini && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="gemini-api-key">API Key</Label>
                      <Input
                        id="gemini-api-key"
                        type="password"
                        placeholder="AI..."
                        value={formData.gemini.apiKey}
                        onChange={(e) => handleFormChange('gemini', 'apiKey', e.target.value)}
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Get your API key from Google AI Studio
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="gemini-model">Model Name</Label>
                      <Input
                        id="gemini-model"
                        value={formData.gemini.modelName}
                        onChange={(e) => handleFormChange('gemini', 'modelName', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gemini-temperature">Temperature ({formData.gemini.temperature})</Label>
                      <Input
                        id="gemini-temperature"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={formData.gemini.temperature}
                        onChange={(e) => handleFormChange('gemini', 'temperature', parseFloat(e.target.value))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gemini-tokens">Max Tokens</Label>
                      <Input
                        id="gemini-tokens"
                        type="number"
                        value={formData.gemini.maxTokens}
                        onChange={(e) => handleFormChange('gemini', 'maxTokens', parseInt(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="gemini-prompt">Prompt Template</Label>
                    <Textarea
                      id="gemini-prompt"
                      rows={4}
                      value={formData.gemini.promptTemplate}
                      onChange={(e) => handleFormChange('gemini', 'promptTemplate', e.target.value)}
                    />
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <Button
                      onClick={() => handleSaveConfig('gemini')}
                      disabled={updateConfigMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Configuration
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleActivateProvider('gemini')}
                      disabled={activateProviderMutation.isPending}
                    >
                      Set as Active Provider
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* AI Testing Tab */}
            <TabsContent value="testing" className="space-y-4 mt-6">
              <AITestingPanel configs={configs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// AI Testing Panel Component
function AITestingPanel({ configs }: { configs: AIConfig[] }) {
  const [testImage, setTestImage] = useState<string>("");
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingAI, setIsTestingAI] = useState(false);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTestImage(e.target?.result as string);
        setTestResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const testAIAnalysis = async () => {
    if (!testImage) {
      toast({
        title: "Error",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingAI(true);
    try {
      const response = await fetch('/api/demo-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageData: testImage }),
      });

      if (!response.ok) {
        throw new Error('AI analysis failed');
      }

      const result = await response.json();
      setTestResult(result);
      toast({
        title: "Success",
        description: "AI analysis completed successfully",
      });
    } catch (error) {
      console.error('Error testing AI:', error);
      toast({
        title: "Error",
        description: "AI analysis failed. Check your configuration.",
        variant: "destructive",
      });
    } finally {
      setIsTestingAI(false);
    }
  };

  const activeConfig = configs.find(c => c.isActive);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Bot className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">AI Testing Panel</h3>
          <p className="text-neutral-600">Test your AI configuration with sample images</p>
        </div>
      </div>

      {/* Active Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {activeConfig ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{activeConfig.provider.toUpperCase()}</p>
                <p className="text-sm text-neutral-600">{activeConfig.modelName}</p>
              </div>
              <Badge variant="default">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          ) : (
            <div className="text-center py-4">
              <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
              <p className="text-neutral-600">No AI provider is currently active</p>
              <p className="text-sm text-neutral-500">Configure and activate a provider to test</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Test Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={!activeConfig}
          />
          
          {testImage && (
            <div className="space-y-4">
              <div className="max-w-xs mx-auto">
                <img
                  src={testImage}
                  alt="Test food"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
              
              <Button
                onClick={testAIAnalysis}
                disabled={isTestingAI || !activeConfig}
                className="w-full"
              >
                {isTestingAI ? (
                  <>
                    <Bot className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Test AI Analysis
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Calories</p>
                  <p className="text-xl font-bold text-green-800">{testResult.calories}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Protein</p>
                  <p className="text-xl font-bold text-blue-800">{testResult.protein}g</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Carbs</p>
                  <p className="text-xl font-bold text-orange-800">{testResult.carbs}g</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Fat</p>
                  <p className="text-xl font-bold text-purple-800">{testResult.fat}g</p>
                </div>
              </div>
              
              <div>
                <Label className="font-medium">Food Identified:</Label>
                <p className="text-lg">{testResult.foodName}</p>
              </div>
              
              {testResult.fiber && (
                <div>
                  <Label className="font-medium">Fiber:</Label>
                  <p>{testResult.fiber}g</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}