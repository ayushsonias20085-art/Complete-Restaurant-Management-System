import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Recipe, MenuItem, Ingredient } from '../types';
import { useSettings } from '../context/SettingsContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Utensils,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

export const RecipeManagement: React.FC = () => {
  const { formatCurrency } = useSettings();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number>(0);
  const [instructions, setInstructions] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [recipeLines, setRecipeLines] = useState<
    { ingredient_id: number; quantity_required: number; unit: string }[]
  >([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [recs, items, ingRes] = await Promise.all([
        api.getRecipes(),
        api.getMenuItems(),
        api.getIngredients(),
      ]);
      setRecipes(recs);
      setMenuItems(items);
      setIngredients(ingRes.ingredients);
    } catch (err) {
      console.error('Failed to load recipe data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewRecipe = () => {
    const firstUnmapped = menuItems.find((m) => !recipes.some((r) => r.menu_item_id === m.id));
    setSelectedMenuItemId(firstUnmapped?.id || menuItems[0]?.id || 0);
    setInstructions('');
    setPrepNotes('');
    setRecipeLines([
      {
        ingredient_id: ingredients[0]?.id || 1,
        quantity_required: 1,
        unit: ingredients[0]?.unit || 'kg',
      },
    ]);
    setShowModal(true);
  };

  const openEditRecipe = (r: Recipe) => {
    setSelectedMenuItemId(r.menu_item_id);
    setInstructions(r.instructions);
    setPrepNotes(r.prep_notes);
    setRecipeLines(
      r.ingredients.map((ri) => ({
        ingredient_id: ri.ingredient_id,
        quantity_required: ri.quantity_required,
        unit: ri.unit,
      }))
    );
    setShowModal(true);
  };

  const addIngredientLine = () => {
    const firstIng = ingredients[0];
    setRecipeLines([
      ...recipeLines,
      {
        ingredient_id: firstIng?.id || 1,
        quantity_required: 1,
        unit: firstIng?.unit || 'kg',
      },
    ]);
  };

  const removeIngredientLine = (index: number) => {
    setRecipeLines(recipeLines.filter((_, idx) => idx !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    setRecipeLines(
      recipeLines.map((line, idx) => {
        if (idx === index) {
          if (field === 'ingredient_id') {
            const ing = ingredients.find((i) => i.id === Number(value));
            return {
              ...line,
              ingredient_id: Number(value),
              unit: ing?.unit || line.unit,
            };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuItemId || recipeLines.length === 0) return;

    try {
      await api.saveRecipe({
        menu_item_id: selectedMenuItemId,
        instructions,
        prep_notes: prepNotes,
        ingredients: recipeLines.map((l) => ({
          ingredient_id: l.ingredient_id,
          quantity_required: parseFloat(String(l.quantity_required)) || 0,
          unit: l.unit,
        })),
      });
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      alert(`Failed to save recipe: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-serif">
            Recipe Formulation & Costing
            <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
              {recipes.length} Formulated Recipes
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Map menu dishes to raw ingredients to automate inventory deduction and track food cost percentages.
          </p>
        </div>

        <button
          onClick={openNewRecipe}
          className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 text-white rounded-2xl text-xs font-semibold shadow-md shadow-orange-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Build New Recipe</span>
        </button>
      </div>

      {/* Recipes Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recipes.map((r) => (
          <div
            key={r.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {r.image_url && (
                    <img
                      src={r.image_url}
                      alt={r.menu_item_name}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                  )}
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {r.category_name}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {r.menu_item_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-0.5 text-xs font-mono">
                      <span className="text-slate-500">
                        Menu Price: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(r.menu_item_price)}</strong>
                      </span>
                      <span className="text-slate-500">
                        Plate Cost: <strong className="text-orange-600">{formatCurrency(r.total_cost)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                    {r.profit_margin_percent}% Margin
                  </span>
                </div>
              </div>

              {/* Ingredients Breakdown Table */}
              <div className="mt-3 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Raw Ingredients Depleted per Plate:
                </span>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border rounded-2xl border-slate-100 dark:border-slate-800 overflow-hidden text-xs">
                  {r.ingredients.map((ing) => (
                    <div key={ing.id} className="p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {ing.ingredient_name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          {ing.quantity_required} {ing.unit}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500">
                        {formatCurrency(ing.cost_contribution)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions snippet */}
              {r.instructions && (
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px] mb-0.5">
                    Cooking Protocol:
                  </span>
                  <p className="line-clamp-2 italic text-[11px]">{r.instructions}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => openEditRecipe(r)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Modify Recipe</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Builder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveRecipe}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Recipe Formulation Editor
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Menu Dish *
                </label>
                <select
                  value={selectedMenuItemId}
                  onChange={(e) => setSelectedMenuItemId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                >
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatCurrency(m.price)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipe Lines */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Required Ingredients per Serving:
                  </span>
                  <button
                    type="button"
                    onClick={addIngredientLine}
                    className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {recipeLines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-2"
                    >
                      <select
                        value={line.ingredient_id}
                        onChange={(e) => updateLine(idx, 'ingredient_id', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        required
                        placeholder="Quantity"
                        value={line.quantity_required}
                        onChange={(e) => updateLine(idx, 'quantity_required', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white"
                      />

                      <span className="text-slate-400 font-mono w-10 text-center">{line.unit}</span>

                      <button
                        type="button"
                        onClick={() => removeIngredientLine(idx)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Preparation & Cooking Instructions
                </label>
                <textarea
                  rows={3}
                  placeholder="Step 1: Sear wagyu patty. Step 2: Toast brioche..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chef Plating & Allergy Notes
                </label>
                <input
                  type="text"
                  placeholder="Garnish with fresh microgreens and maldon sea salt"
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Save Recipe
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
