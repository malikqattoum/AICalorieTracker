import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Dumbbell, Flame, X, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Workout {
  id: number;
  userId: number;
  type: string;
  duration: number;
  caloriesBurned: number;
  date: string;
}

const WORKOUT_TYPES = [
  { value: "cardio", label: "Cardio", caloriesPerMinute: 8 },
  { value: "strength", label: "Strength Training", caloriesPerMinute: 6 },
  { value: "yoga", label: "Yoga", caloriesPerMinute: 4 },
  { value: "hiit", label: "HIIT", caloriesPerMinute: 12 },
  { value: "walking", label: "Walking", caloriesPerMinute: 4 },
  { value: "running", label: "Running", caloriesPerMinute: 10 },
  { value: "cycling", label: "Cycling", caloriesPerMinute: 8 },
  { value: "swimming", label: "Swimming", caloriesPerMinute: 9 },
];

export function WorkoutTrackerCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [workoutType, setWorkoutType] = useState(WORKOUT_TYPES[0].value);
  const [duration, setDuration] = useState(30);
  
  // Calculate calories burned based on workout type and duration
  const calculateCaloriesBurned = () => {
    const selectedType = WORKOUT_TYPES.find(type => type.value === workoutType);
    return selectedType ? Math.round(selectedType.caloriesPerMinute * duration) : 0;
  };

  // Fetch workouts
  const { data: workouts, isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/workouts");
        if (!res.ok) throw new Error("Failed to fetch workouts");
        return res.json();
      } catch (error) {
        console.error("Error fetching workouts:", error);
        return [];
      }
    },
  });

  // Add workout mutation
  const addWorkoutMutation = useMutation({
    mutationFn: async (workout: Omit<Workout, "id">) => {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workout),
      });
      if (!res.ok) throw new Error("Failed to add workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Workout added successfully" });
      setIsAdding(false);
      setWorkoutType(WORKOUT_TYPES[0].value);
      setDuration(30);
    },
    onError: () => {
      toast({ 
        title: "Failed to add workout", 
        variant: "destructive"
      });
    },
  });

  // Delete workout mutation
  const deleteWorkoutMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/workouts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete workout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Workout deleted successfully" });
    },
    onError: () => {
      toast({ 
        title: "Failed to delete workout", 
        variant: "destructive"
      });
    },
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const caloriesBurned = calculateCaloriesBurned();
    addWorkoutMutation.mutate({
      userId: 0, // This will be set by the server based on the authenticated user
      type: workoutType,
      duration,
      caloriesBurned,
      date: new Date().toISOString(),
    });
  };

  // Calculate total calories burned this week
  const calculateTotalCaloriesBurned = () => {
    if (!workouts || workouts.length === 0) return 0;
    
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    return workouts
      .filter(workout => new Date(workout.date) >= startOfWeek)
      .reduce((total, workout) => total + workout.caloriesBurned, 0);
  };

  // Get workout type label
  const getWorkoutTypeLabel = (value: string) => {
    const type = WORKOUT_TYPES.find(type => type.value === value);
    return type ? type.label : value;
  };

  return (
    <Card className="card-gradient hover-effect rounded-xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b border-neutral-200 flex justify-between items-center">
        <CardTitle className="text-xl font-semibold text-neutral-800 flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-primary-500" />
          Workout Tracker
        </CardTitle>
        {!isAdding && (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" /> Add Workout
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isAdding ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Workout Type</label>
                <select
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={workoutType}
                  onChange={(e) => setWorkoutType(e.target.value)}
                >
                  {WORKOUT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                />
              </div>
            </div>
            
            <div className="bg-neutral-50 p-3 rounded-md border border-neutral-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estimated Calories Burned:</span>
                <span className="text-lg font-bold text-primary-600 flex items-center gap-1">
                  <Flame className="h-4 w-4" />
                  {calculateCaloriesBurned()}
                </span>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={addWorkoutMutation.isPending}
              >
                {addWorkoutMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-1">⏳</span> Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" /> Save Workout
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : workouts && workouts.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-primary-50 p-3 rounded-md border border-primary-100 flex justify-between items-center">
              <span className="text-sm font-medium text-primary-800">Total Calories Burned This Week:</span>
              <span className="text-lg font-bold text-primary-600 flex items-center gap-1">
                <Flame className="h-5 w-5" />
                {calculateTotalCaloriesBurned()}
              </span>
            </div>
            
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
              {workouts.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((workout) => (
                <div 
                  key={workout.id} 
                  className="flex justify-between items-center p-3 bg-white rounded-md border border-neutral-200 hover:border-neutral-300 transition-colors"
                >
                  <div>
                    <div className="font-medium">{getWorkoutTypeLabel(workout.type)}</div>
                    <div className="text-sm text-neutral-500 flex items-center gap-2">
                      <span>{workout.duration} min</span>
                      <span>•</span>
                      <span>{format(new Date(workout.date), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-primary-600 font-medium flex items-center">
                      <Flame className="h-4 w-4 mr-1" />
                      {workout.caloriesBurned}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-neutral-400 hover:text-red-500"
                      onClick={() => deleteWorkoutMutation.mutate(workout.id)}
                      disabled={deleteWorkoutMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-400">
            <Dumbbell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="mb-4">No workouts tracked yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mx-auto"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Your First Workout
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}