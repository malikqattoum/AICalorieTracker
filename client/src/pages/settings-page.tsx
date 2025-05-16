import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState({
    calories: user?.nutritionGoals?.calories || 2000,
    protein: user?.nutritionGoals?.protein || 100,
    carbs: user?.nutritionGoals?.carbs || 250,
    fat: user?.nutritionGoals?.fat || 70,
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoals({ ...goals, [e.target.name]: Number(e.target.value) });
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    await fetch("/api/user/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goals),
    });
    setSaving(false);
    setSuccess(true);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Nutrition Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <div>
                  <label className="block text-sm font-medium mb-1">Daily Calories</label>
                  <input type="number" name="calories" value={goals.calories} onChange={handleChange} className="input input-bordered w-full" min={1000} max={6000} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Protein (g)</label>
                    <input type="number" name="protein" value={goals.protein} onChange={handleChange} className="input input-bordered w-full" min={20} max={400} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Carbs (g)</label>
                    <input type="number" name="carbs" value={goals.carbs} onChange={handleChange} className="input input-bordered w-full" min={50} max={800} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Fat (g)</label>
                    <input type="number" name="fat" value={goals.fat} onChange={handleChange} className="input input-bordered w-full" min={10} max={200} />
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full mt-4">
                  {saving ? "Saving..." : "Save Goals"}
                </Button>
                {success && <div className="text-green-600 text-sm mt-2">Goals saved!</div>}
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
