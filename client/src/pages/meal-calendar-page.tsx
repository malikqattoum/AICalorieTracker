import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlannedMeal, InsertPlannedMeal } from '@shared/schema'; // Assuming types are in schema
import { apiRequest, addAuthHeader, addSecurityHeaders } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

export default function MealCalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMeal, setCurrentMeal] = useState<Partial<InsertPlannedMeal> & { id?: number }>({});
  const [editingMeal, setEditingMeal] = useState<PlannedMeal | null>(null);

  const fetchPlannedMeals = async (date: Date) => {
    setIsLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0).toISOString(); // Last day of the month

      const response = await fetch(`/api/planned-meals?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch planned meals');
      }
      const data: PlannedMeal[] = await response.json();
      setPlannedMeals(data);
    } catch (error) {
      toast({
        title: 'Error fetching meals',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCalendar = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/planned-meals/export/ical');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to export calendar. Server returned an error.' }));
        throw new Error(errorData.message || 'Failed to export calendar');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meal_plan.ics';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Calendar Exported',
        description: 'Your meal plan has been downloaded as an iCalendar file.',
      });
    } catch (error) {
      toast({
        title: 'Error Exporting Calendar',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCalendar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('icalFile', file);

    try {
      const headers = addAuthHeader(addSecurityHeaders({}));
      const response = await fetch('/api/planned-meals/import/ical', {
        method: 'POST',
        headers,
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to import calendar. Server returned an error.' }));
        throw new Error(errorData.message || 'Failed to import calendar');
      }

      const result = await response.json();
      toast({
        title: 'Calendar Imported',
        description: result.message || 'Meal plan imported successfully.',
      });
      if (selectedDate) fetchPlannedMeals(selectedDate); // Refresh meals for the current view
    } catch (error) {
      toast({
        title: 'Error Importing Calendar',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      // Reset file input to allow importing the same file again if needed
      event.target.value = '';
    }
  };

  useEffect(() => {
    if (selectedDate) {
      fetchPlannedMeals(selectedDate);
    }
  }, [selectedDate]);

  const handleSelectDate = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const openModal = (meal?: PlannedMeal) => {
    if (meal) {
      setEditingMeal(meal);
      setCurrentMeal({
        id: meal.id,
        date: meal.date, // Keep original date for editing context if needed, or use selectedDate
        mealType: meal.mealType,
        mealName: meal.mealName,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        recipe: meal.recipe || '',
        notes: meal.notes || '',
      });
    } else {
      setEditingMeal(null);
      setCurrentMeal({ date: selectedDate });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMeal({});
    setEditingMeal(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentMeal((prev: Partial<InsertPlannedMeal> & { id?: number }) => ({ ...prev, [name]: name === 'calories' || name === 'protein' || name === 'carbs' || name === 'fat' ? parseInt(value, 10) : value }));
  };

  const handleSubmitMeal = async () => {
    if (!currentMeal.mealName || !currentMeal.mealType || !selectedDate) {
      toast({ title: 'Missing required fields', variant: 'destructive' });
      return;
    }

    const mealData: InsertPlannedMeal = {
      date: selectedDate, // Pass as Date, not string
      userId: user?.id || 0,
      mealType: currentMeal.mealType!,
      mealName: currentMeal.mealName!,
      calories: currentMeal.calories || 0,
      protein: currentMeal.protein || 0,
      carbs: currentMeal.carbs || 0,
      fat: currentMeal.fat || 0,
      recipe: currentMeal.recipe,
      notes: currentMeal.notes,
    };

    try {
      let response;
      if (editingMeal && editingMeal.id) {
        response = await apiRequest('PUT', `/api/planned-meals/${editingMeal.id}`, mealData);
      } else {
        response = await apiRequest('POST', '/api/planned-meals', mealData);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save meal');
      }

      toast({ title: `Meal ${editingMeal ? 'updated' : 'added'} successfully` });
      closeModal();
      if (selectedDate) fetchPlannedMeals(selectedDate); // Refresh meals for the current month
    } catch (error) {
      toast({
        title: 'Error saving meal',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    if (!confirm('Are you sure you want to delete this meal?')) return;

    try {
      const response = await apiRequest('DELETE', `/api/planned-meals/${mealId}`);
      if (!response.ok && response.status !== 204) { // 204 No Content is a success for DELETE
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete meal');
      }
      toast({ title: 'Meal deleted successfully' });
      if (selectedDate) fetchPlannedMeals(selectedDate); // Refresh meals
    } catch (error) {
      toast({
        title: 'Error deleting meal',
        description: (error as Error).message,
        variant: 'destructive',
      });
    }
  };

  const mealsForSelectedDate = plannedMeals.filter(meal => 
    selectedDate && new Date(meal.date).toDateString() === selectedDate.toDateString()
  ).sort((a, b) => {
    const mealOrder: Record<string, number> = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
    const aKey = (typeof a.mealType === 'string' && mealOrder[a.mealType.toLowerCase()]) ? a.mealType.toLowerCase() : 'snack';
    const bKey = (typeof b.mealType === 'string' && mealOrder[b.mealType.toLowerCase()]) ? b.mealType.toLowerCase() : 'snack';
    return (mealOrder[aKey] || 5) - (mealOrder[bKey] || 5);
  });


  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Meal Planning Calendar</h1>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelectDate}
            className="rounded-md border shadow"
          />
        </div>
        <div className="md:col-span-2">
          {isLoading && <p>Loading meals...</p>}
          {!isLoading && mealsForSelectedDate.length === 0 && <p>No meals planned for this day.</p>}
          {!isLoading && mealsForSelectedDate.length > 0 && (
            <ul className="space-y-4">
              {mealsForSelectedDate.map(meal => (
                <li key={meal.id} className="p-4 border rounded-md shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{meal.mealName} ({meal.mealType})</h3>
                      <p className="text-sm text-gray-600">
                        {meal.calories} kcal | P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fat}g
                      </p>
                      {meal.recipe && <p className="text-xs mt-1">Recipe: {meal.recipe}</p>}
                      {meal.notes && <p className="text-xs mt-1">Notes: {meal.notes}</p>}
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm" onClick={() => openModal(meal)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteMeal(meal.id)}>Delete</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <h2 className="text-xl font-semibold mb-4">
            Meals for {selectedDate ? selectedDate.toLocaleDateString() : 'selected date'}
          </h2>
          {/* Placeholder for meal list and add button */}
          <Button onClick={() => openModal()} className="mt-4">Add Meal to this Date</Button>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Calendar Integrations</h3>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExportCalendar}>Export Calendar (iCal)</Button>
              <Button variant="outline" onClick={() => document.getElementById('ical-import-input')?.click()}>Import Calendar (iCal)</Button>
              <input type="file" id="ical-import-input" accept=".ics" onChange={handleImportCalendar} style={{ display: 'none' }} />
            </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-2xl font-semibold mb-4">{editingMeal ? 'Edit' : 'Add'} Meal</h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="mealName" className="block text-sm font-medium text-gray-700">Meal Name</label>
                    <input type="text" name="mealName" id="mealName" value={currentMeal.mealName || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                  </div>
                  <div>
                    <label htmlFor="mealType" className="block text-sm font-medium text-gray-700">Meal Type</label>
                    <select name="mealType" id="mealType" value={currentMeal.mealType || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2">
                      <option value="">Select Type</option>
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="calories" className="block text-sm font-medium text-gray-700">Calories</label>
                      <input type="number" name="calories" id="calories" value={currentMeal.calories || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                    </div>
                    <div>
                      <label htmlFor="protein" className="block text-sm font-medium text-gray-700">Protein (g)</label>
                      <input type="number" name="protein" id="protein" value={currentMeal.protein || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                    </div>
                    <div>
                      <label htmlFor="carbs" className="block text-sm font-medium text-gray-700">Carbs (g)</label>
                      <input type="number" name="carbs" id="carbs" value={currentMeal.carbs || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                    </div>
                    <div>
                      <label htmlFor="fat" className="block text-sm font-medium text-gray-700">Fat (g)</label>
                      <input type="number" name="fat" id="fat" value={currentMeal.fat || ''} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="recipe" className="block text-sm font-medium text-gray-700">Recipe (optional)</label>
                    <textarea name="recipe" id="recipe" value={currentMeal.recipe || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"></textarea>
                  </div>
                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                    <textarea name="notes" id="notes" value={currentMeal.notes || ''} onChange={handleInputChange} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2"></textarea>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="outline" onClick={closeModal}>Cancel</Button>
                  <Button onClick={handleSubmitMeal}>{editingMeal ? 'Update' : 'Add'} Meal</Button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}