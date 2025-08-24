import { EnhancedFoodResult } from './camera-view';
import { Progress } from '../ui/progress';
import { ArrowLeft, Edit, Check, X, Info, Scale, Heart, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import { useState } from 'react';

interface EnhancedResultsDisplayProps {
  results: EnhancedFoodResult;
  onBack: () => void;
  onUpdate?: (index: number, updatedFood: any) => void;
}

export function EnhancedResultsDisplay({ results, onBack, onUpdate }: EnhancedResultsDisplayProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [portionSize, setPortionSize] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<boolean[]>([]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setPortionSize(results.foods?.[index]?.portionSize?.estimatedWeight || 0);
  };

  const handleSave = (index: number) => {
    if (portionSize <= 0) return;
    
    const original = results.foods?.[index];
    if (!original) return;
    
    const ratio = portionSize / (original.portionSize?.estimatedWeight || 1);
    
    const updatedFood = {
      ...original,
      portionSize: {
        ...original.portionSize,
        estimatedWeight: portionSize
      },
      nutritionalInfo: {
        ...original.nutritionalInfo,
        calories: Math.round(original.nutritionalInfo?.calories || 0 * ratio),
        protein: Math.round((original.nutritionalInfo?.protein || 0) * ratio * 10) / 10,
        carbs: Math.round((original.nutritionalInfo?.carbs || 0) * ratio * 10) / 10,
        fat: Math.round((original.nutritionalInfo?.fat || 0) * ratio * 10) / 10
      }
    };

    if (onUpdate) {
      onUpdate(index, updatedFood);
    }
    setEditingIndex(null);
  };

  const toggleDetails = (index: number) => {
    const newShowDetails = [...showDetails];
    newShowDetails[index] = !newShowDetails[index];
    setShowDetails(newShowDetails);
  };

  // Handle error case
  if (results.error) {
    return (
      <div className="fixed inset-0 bg-black z-50 p-4 flex flex-col">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 z-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 shadow-xl text-center max-w-md">
            <div className="text-red-500 mb-4">
              <Activity className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Analysis Failed</h2>
            <p className="text-gray-600 mb-6">{results.error}</p>
            <div className="space-y-3">
              <Button 
                onClick={() => onBack()} 
                className="w-full"
                variant="outline"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => {
                  // Fallback to original image
                  if (results.fallbackData) {
                    onBack();
                  }
                }} 
                className="w-full"
              >
                Use Original Image
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle single food result
  if (results.foodName) {
    return (
      <div className="fixed inset-0 bg-black z-50 p-4 flex flex-col">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 z-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{results.foodName}</h2>
                {results.nutritionalInfo?.healthScore && (
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-gray-700">
                      Health Score: {results.nutritionalInfo.healthScore}/100
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-lg font-medium">Calories</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {results.nutritionalInfo?.calories || 0}
                  </span>
                </div>
                <Progress 
                  value={Math.min((results.nutritionalInfo?.calories || 0) / 800 * 100, 100)} 
                  className="h-3" 
                />
              </div>

              {results.portionSize && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Portion Size</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="bg-white rounded-lg px-3 py-2 text-sm font-medium">
                      {results.portionSize.estimatedWeight}g
                    </div>
                    {results.portionSize.referenceObject && (
                      <div className="bg-white rounded-lg px-3 py-2 text-sm text-gray-600">
                        Compared to {results.portionSize.referenceObject}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-green-600 mb-1">Protein</div>
                  <div className="text-xl font-bold text-green-800">
                    {results.nutritionalInfo?.protein || 0}g
                  </div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-yellow-600 mb-1">Carbs</div>
                  <div className="text-xl font-bold text-yellow-800">
                    {results.nutritionalInfo?.carbs || 0}g
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-red-600 mb-1">Fat</div>
                  <div className="text-xl font-bold text-red-800">
                    {results.nutritionalInfo?.fat || 0}g
                  </div>
                </div>
              </div>

              {results.analysisMetadata && (
                <div className="text-sm text-gray-500 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span>{results.analysisMetadata.processingTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Version:</span>
                    <span>{results.analysisMetadata.modelVersion}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={onBack}
                className="flex-1"
              >
                Done
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Allow editing portion size
                  if (results.portionSize) {
                    setEditingIndex(0);
                    setPortionSize(results.portionSize.estimatedWeight);
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Portion
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle multi-food results
  if (results.foods && results.foods.length > 0) {
    return (
      <div className="fixed inset-0 bg-black z-50 p-4 flex flex-col">
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 z-10"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Detected Foods</h2>
              {results.analysisMetadata && (
                <p className="text-gray-300">
                  Found {results.analysisMetadata.totalFoods} foods with average confidence of {(results.analysisMetadata.averageConfidence * 100).toFixed(1)}%
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.foods.map((food: any, index: number) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{food.foodName}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleDetails(index)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <Info size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span>Calories</span>
                      <span className="font-semibold">{food.nutritionalInfo?.calories || 0}</span>
                    </div>
                    <Progress value={Math.min((food.nutritionalInfo?.calories || 0) / 800 * 100, 100)} className="h-2" />
                  </div>

                  {editingIndex === index ? (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium mb-2">Adjust Portion (grams)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={portionSize}
                          onChange={(e) => setPortionSize(Number(e.target.value))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                          min="1"
                        />
                        <Button size="sm" onClick={() => handleSave(index)}>
                          <Check size={16} />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingIndex(null)}>
                          <X size={16} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    food.portionSize && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Portion Size</h4>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-100 rounded-lg px-3 py-1 text-sm">
                            {food.portionSize.estimatedWeight}g
                          </div>
                          {food.portionSize.referenceObject !== 'none' && (
                            <div className="bg-gray-100 rounded-lg px-3 py-1 text-sm">
                              Compared to {food.portionSize.referenceObject}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-xs text-blue-600">Protein</div>
                      <div className="font-bold text-blue-800">{food.nutritionalInfo?.protein || 0}g</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-xs text-green-600">Carbs</div>
                      <div className="font-bold text-green-800">{food.nutritionalInfo?.carbs || 0}g</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <div className="text-xs text-yellow-600">Fat</div>
                      <div className="font-bold text-yellow-800">{food.nutritionalInfo?.fat || 0}g</div>
                    </div>
                  </div>

                  {food.healthScore && (
                    <div className="mb-2">
                      <div className="flex justify-between mb-1">
                        <span>Health Score</span>
                        <span>{food.healthScore}/100</span>
                      </div>
                      <Progress value={food.healthScore} className="h-2 bg-gray-200" />
                    </div>
                  )}

                  {showDetails[index] && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="font-medium ml-2">{(food.confidence * 100).toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium ml-2">{food.category || 'Unknown'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {results.analysisMetadata && (
              <div className="mt-6 p-4 bg-white/10 rounded-lg">
                <div className="text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>Processing Time:</span>
                    <span>{results.analysisMetadata.processingTime}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model Version:</span>
                    <span>{results.analysisMetadata.modelVersion}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Button 
                onClick={onBack}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for unknown result format
  return (
    <div className="fixed inset-0 bg-black z-50 p-4 flex flex-col">
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 z-10"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-white text-center">
          <p>No results available</p>
          <Button onClick={onBack} className="mt-4">
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}