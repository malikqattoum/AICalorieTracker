import { useState } from "react";
import { NutritionData } from "@/types";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Edit, Check, X, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MultiFoodDisplayProps {
  foods: NutritionData[];
  onBack: () => void;
  onUpdate: (index: number, updatedFood: NutritionData) => void;
}

export function MultiFoodDisplay({ foods, onBack, onUpdate }: MultiFoodDisplayProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [portionSize, setPortionSize] = useState<number>(0);
  const [showDetails, setShowDetails] = useState<boolean[]>([]);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setPortionSize(foods[index].portionSize?.estimatedWeight || 0);
  };

  const handleSave = (index: number) => {
    if (portionSize <= 0) return;
    
    const original = foods[index];
    const ratio = portionSize / (original.portionSize?.estimatedWeight || 1);
    
    const updatedFood = {
      ...original,
      portionSize: {
        ...original.portionSize,
        estimatedWeight: portionSize
      },
      calories: Math.round(original.calories * ratio),
      protein: Math.round(original.protein * ratio * 10) / 10,
      carbs: Math.round(original.carbs * ratio * 10) / 10,
      fat: Math.round(original.fat * ratio * 10) / 10
    };

    onUpdate(index, updatedFood);
    setEditingIndex(null);
  };

  const toggleDetails = (index: number) => {
    const newShowDetails = [...showDetails];
    newShowDetails[index] = !newShowDetails[index];
    setShowDetails(newShowDetails);
  };
  return (
    <div className="fixed inset-0 bg-black z-50 p-4 flex flex-col">
      <button 
        onClick={onBack}
        className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 z-10"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 overflow-y-auto">
        {foods.map((food, index) => (
          <div key={index} className="bg-white rounded-xl p-4 shadow-lg">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xl font-bold">{food.foodName}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleDetails(index)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <Info size={18} />
                </button>
                <button
                  onClick={() => handleEdit(index)}
                  className="text-primary-600 hover:text-primary-800"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <span>Calories</span>
                <span>{food.calories}</span>
              </div>
              <Progress value={Math.min(food.calories / 800 * 100, 100)} className="h-2" />
            </div>

            {editingIndex === index ? (
              <div className="mb-4">
                <Label htmlFor={`portion-${index}`} className="block mb-2">Adjust Portion (grams)</Label>
                <div className="flex gap-2">
                  <Input
                    id={`portion-${index}`}
                    type="number"
                    value={portionSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPortionSize(Number(e.target.value))}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => handleSave(index)}>
                    <Check size={18} />
                  </Button>
                  <Button variant="outline" onClick={() => setEditingIndex(null)}>
                    <X size={18} />
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

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600">Protein</div>
                <div className="font-bold">{food.protein}g</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600">Carbs</div>
                <div className="font-bold">{food.carbs}g</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-sm text-yellow-600">Fat</div>
                <div className="font-bold">{food.fat}g</div>
              </div>
            </div>

            {showDetails[index] && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Allergens:</span>
                    <span className="font-medium ml-2">{food.allergens?.join(', ') || 'None detected'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Health Impact:</span>
                    <span className="font-medium ml-2">{food.healthImpactRating}/5</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Vitamins:</span>
                    <span className="font-medium ml-2">{food.micronutrients?.vitamins?.join(', ') || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Minerals:</span>
                    <span className="font-medium ml-2">{food.micronutrients?.minerals?.join(', ') || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {food.densityScore && (
              <div className="mb-2">
                <div className="flex justify-between mb-1">
                  <span>Nutrient Density</span>
                  <span>{food.densityScore}/100</span>
                </div>
                <Progress value={food.densityScore} className="h-2 bg-gray-200" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}