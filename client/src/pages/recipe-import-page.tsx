import React, { useState, useEffect, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ImportedRecipe, InsertImportedRecipe } from '@shared/schema'; // Assuming types are in schema
import { Loader2, UploadCloud, Link, Trash2, Edit3, Eye } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Define type for nutrition information to improve type safety
interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export default function RecipeImportPage() {
  const [importUrl, setImportUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedRecipes, setImportedRecipes] = useState<ImportedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingRecipes, setIsFetchingRecipes] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<ImportedRecipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<ImportedRecipe | null>(null);

  const { toast } = useToast();

  const fetchImportedRecipes = async () => {
    setIsFetchingRecipes(true);
    try {
      const response = await apiRequest('GET', '/api/imported-recipes');
      if (!response.ok) throw new Error('Failed to fetch imported recipes');
      const data: ImportedRecipe[] = await response.json();
      setImportedRecipes(data);
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
    setIsFetchingRecipes(false);
  };

  useEffect(() => {
    fetchImportedRecipes();
  }, []);

  const handleUrlImport = async () => {
    if (!importUrl) {
      toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/imported-recipes/from-url', { url: importUrl });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import from URL');
      }
      toast({ title: 'Success', description: 'Recipe imported successfully from URL!' });
      setImportUrl('');
      fetchImportedRecipes(); // Refresh list
    } catch (error) {
      toast({ title: 'Import Error', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImageImport = async () => {
    if (!selectedFile) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(selectedFile);
    reader.onload = async () => {
      try {
        const base64ImageData = reader.result as string;
        const response = await apiRequest('POST', '/api/imported-recipes/from-image', { imageData: base64ImageData });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to import from image');
        }
        toast({ title: 'Success', description: 'Recipe imported successfully from image!' });
        setSelectedFile(null);
        if (document.getElementById('image-upload') as HTMLInputElement) {
            (document.getElementById('image-upload') as HTMLInputElement).value = '';
        }
        fetchImportedRecipes(); // Refresh list
      } catch (error) {
        toast({ title: 'Import Error', description: (error as Error).message, variant: 'destructive' });
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      toast({ title: 'Error', description: 'Failed to read file.', variant: 'destructive' });
      setIsLoading(false);
    };
  };

  const handleDeleteRecipe = async (recipeId: number) => {
    if (!confirm('Are you sure you want to delete this imported recipe?')) return;
    try {
      const response = await apiRequest('DELETE', `/api/imported-recipes/${recipeId}`);
      if (!response.ok && response.status !== 204) throw new Error('Failed to delete recipe');
      toast({ title: 'Success', description: 'Recipe deleted successfully.' });
      fetchImportedRecipes();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };
  
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRecipeForm, setCurrentRecipeForm] = useState<Partial<ImportedRecipe>>({});

  const openViewModal = (recipe: ImportedRecipe) => {
    setViewingRecipe(recipe);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingRecipe(null);
  };

  const openEditModal = (recipe: ImportedRecipe) => {
    setEditingRecipe(recipe);
    setCurrentRecipeForm({
      id: recipe.id,
      recipeName: recipe.recipeName,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      parsedNutrition: recipe.parsedNutrition,
      notes: recipe.notes,
      sourceUrl: recipe.sourceUrl,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRecipe(null);
    setCurrentRecipeForm({});
  };

  const handleEditFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentRecipeForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditFormJsonChange = (name: 'ingredients' | 'parsedNutrition', value: string) => {
    try {
      const parsedJson = JSON.parse(value);
      setCurrentRecipeForm((prev: any) => ({ ...prev, [name]: parsedJson }));
    } catch (err) {
      toast({ title: 'Invalid JSON', description: `Error parsing ${name}. Please ensure it's valid JSON.`, variant: 'destructive'});
    }
  };

 const handleUpdateRecipe = async () => {
   if (!editingRecipe || !editingRecipe.id) return;
   setIsLoading(true);
   try {
     const response = await apiRequest('PUT', `/api/imported-recipes/${editingRecipe.id}`, {
       recipeName: currentRecipeForm.recipeName,
       ingredients: currentRecipeForm.ingredients,
       instructions: currentRecipeForm.instructions,
       parsedNutrition: currentRecipeForm.parsedNutrition,
       notes: currentRecipeForm.notes,
       sourceUrl: currentRecipeForm.sourceUrl,
     });
     if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.error || 'Failed to update recipe');
     }
     toast({ title: 'Success', description: 'Recipe updated successfully!' });
     closeEditModal();
     fetchImportedRecipes();
   } catch (error) {
     toast({ title: 'Update Error', description: (error as Error).message, variant: 'destructive' });
   }
   setIsLoading(false);
 };

 // Helper function to render nutrition information safely
 const renderNutritionInfo = (nutrition: any) => {
   if (!nutrition || typeof nutrition !== 'object') return null;

   const nutritionData = nutrition as NutritionInfo;
   const fields = [
     { key: 'calories', label: 'Calories', unit: '' },
     { key: 'protein', label: 'Protein', unit: 'g' },
     { key: 'carbs', label: 'Carbs', unit: 'g' },
     { key: 'fat', label: 'Fat', unit: 'g' },
     { key: 'fiber', label: 'Fiber', unit: 'g' },
     { key: 'sugar', label: 'Sugar', unit: 'g' },
     { key: 'sodium', label: 'Sodium', unit: 'mg' },
   ];

   const availableFields = fields.filter(field =>
     typeof nutritionData[field.key as keyof NutritionInfo] === 'number' &&
     nutritionData[field.key as keyof NutritionInfo] !== undefined
   );

   if (availableFields.length === 0) return null;

   return (
     <div className="text-xs text-gray-600 space-y-1">
       <div className="font-medium text-gray-700">Nutrition (per serving):</div>
       {availableFields.map(field => (
         <div key={field.key} className="flex justify-between">
           <span>{field.label}:</span>
           <span>{nutritionData[field.key as keyof NutritionInfo]}{field.unit}</span>
         </div>
       ))}
     </div>
   );
 };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Import & Manage Recipes</h1>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Link className="mr-2 h-5 w-5" /> Import from URL</CardTitle>
            <CardDescription>Paste a URL to a recipe page to import it.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              type="url" 
              placeholder="https://www.example.com/your-favorite-recipe" 
              value={importUrl} 
              onChange={(e) => setImportUrl(e.target.value)} 
              className="mb-4"
            />
          </CardContent>
          <CardFooter>
            <Button onClick={handleUrlImport} disabled={isLoading || !importUrl}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import from URL
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><UploadCloud className="mr-2 h-5 w-5" /> Import from Image</CardTitle>
            <CardDescription>Upload an image of a recipe (e.g., from a cookbook).</CardDescription>
          </CardHeader>
          <CardContent>
            <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="mb-4" />
            {selectedFile && <p className="text-sm text-muted-foreground">Selected: {selectedFile.name}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={handleImageImport} disabled={isLoading || !selectedFile}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Import from Image
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Imported Recipes</h2>
        {isFetchingRecipes ? (
          <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : importedRecipes.length === 0 ? (
          <p>You haven't imported any recipes yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {importedRecipes.map(recipe => (
              <Card key={recipe.id}>
                <CardHeader>
                  <CardTitle className="truncate">{recipe.recipeName}</CardTitle>
                  {recipe.sourceUrl && <CardDescription className="text-xs truncate"><a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Source URL</a></CardDescription>}
                  {recipe.sourceImageUrl && <CardDescription className="text-xs truncate"><a href={recipe.sourceImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Source Image</a></CardDescription>}
                  {!recipe.sourceUrl && !recipe.sourceImageUrl && recipe.rawImageData && <CardDescription className="text-xs">Image Upload</CardDescription>}
                </CardHeader>
                <CardContent className="text-sm">
                  {/* Enhanced display of nutrition information */}
                  {renderNutritionInfo(recipe.parsedNutrition)}
                  <p className="mt-2 text-gray-600 truncate h-10">{recipe.instructions || 'No instructions available.'}</p>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openViewModal(recipe)}><Eye className="mr-1 h-4 w-4" /> View</Button>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(recipe)}><Edit3 className="mr-1 h-4 w-4" /> Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteRecipe(recipe.id)}><Trash2 className="mr-1 h-4 w-4"/> Delete</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      {isViewModalOpen && viewingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <CardHeader>
              <CardTitle>{viewingRecipe.recipeName}</CardTitle>
              {viewingRecipe.sourceUrl && <CardDescription><a href={viewingRecipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Source URL</a></CardDescription>}
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto">
              <h3 className="font-semibold mt-2 mb-1">Ingredients:</h3>
              {Array.isArray(viewingRecipe.ingredients) ? (
                <ul className="list-disc pl-5 text-sm">
                  {viewingRecipe.ingredients.map((ing: any, index: number) => <li key={index}>{`${ing.quantity || ''} ${ing.unit || ''} ${ing.name}`}</li>)}
                </ul>
              ) : <p className="text-sm">{typeof viewingRecipe.ingredients === 'string' ? viewingRecipe.ingredients : 'Not available'}</p>}
              
              <h3 className="font-semibold mt-4 mb-1">Instructions:</h3>
              <p className="text-sm whitespace-pre-wrap">{viewingRecipe.instructions || 'Not available'}</p>
              
              <h3 className="font-semibold mt-4 mb-1">Parsed Nutrition:</h3>
              {viewingRecipe.parsedNutrition && typeof viewingRecipe.parsedNutrition === 'object' ? (
                <pre className="text-sm bg-gray-100 p-2 rounded overflow-x-auto">{JSON.stringify(viewingRecipe.parsedNutrition, null, 2)}</pre>
              ) : <p className="text-sm">Not available</p>}

              {viewingRecipe.notes && <><h3 className="font-semibold mt-4 mb-1">Notes:</h3><p className="text-sm whitespace-pre-wrap">{viewingRecipe.notes}</p></>}
            </CardContent>
            <CardFooter>
              <Button onClick={closeViewModal}>Close</Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {isEditModalOpen && editingRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
            <CardHeader>
              <CardTitle>Edit: {editingRecipe.recipeName}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto space-y-4">
              <div>
                <label htmlFor="edit-recipeName" className="block text-sm font-medium">Recipe Name</label>
                <Input id="edit-recipeName" name="recipeName" value={currentRecipeForm.recipeName || ''} onChange={handleEditFormChange} />
              </div>
              <div>
                <label htmlFor="edit-sourceUrl" className="block text-sm font-medium">Source URL (optional)</label>
                <Input id="edit-sourceUrl" name="sourceUrl" value={currentRecipeForm.sourceUrl || ''} onChange={handleEditFormChange} />
              </div>
              <div>
                <label htmlFor="edit-ingredients" className="block text-sm font-medium">Ingredients (JSON format)</label>
                <Textarea id="edit-ingredients" name="ingredients" value={typeof currentRecipeForm.ingredients === 'string' ? currentRecipeForm.ingredients : JSON.stringify(currentRecipeForm.ingredients, null, 2)} onChange={(e) => handleEditFormJsonChange('ingredients', e.target.value)} rows={5} />
              </div>
              <div>
                <label htmlFor="edit-instructions" className="block text-sm font-medium">Instructions</label>
                <Textarea id="edit-instructions" name="instructions" value={currentRecipeForm.instructions || ''} onChange={handleEditFormChange} rows={5} />
              </div>
              <div>
                <label htmlFor="edit-parsedNutrition" className="block text-sm font-medium">Parsed Nutrition (JSON format)</label>
                <Textarea id="edit-parsedNutrition" name="parsedNutrition" value={typeof currentRecipeForm.parsedNutrition === 'string' ? currentRecipeForm.parsedNutrition : JSON.stringify(currentRecipeForm.parsedNutrition, null, 2)} onChange={(e) => handleEditFormJsonChange('parsedNutrition', e.target.value)} rows={3} />
              </div>
              <div>
                <label htmlFor="edit-notes" className="block text-sm font-medium">Notes</label>
                <Textarea id="edit-notes" name="notes" value={currentRecipeForm.notes || ''} onChange={handleEditFormChange} rows={3} />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeEditModal}>Cancel</Button>
              <Button onClick={handleUpdateRecipe} disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Update Recipe
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

    </div>
  );
}