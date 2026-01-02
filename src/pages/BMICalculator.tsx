import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BMICalculator() {
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");

  useEffect(() => {
    document.title = "BMI Calculator | MediNova";
  }, []);

  const { bmi, category } = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return { bmi: null as number | null, category: "" };
    const meters = h / 100;
    const value = w / (meters * meters);
    let cat = "";
    if (value < 18.5) cat = "Underweight";
    else if (value < 25) cat = "Normal weight";
    else if (value < 30) cat = "Overweight";
    else cat = "Obesity";
    return { bmi: parseFloat(value.toFixed(1)), category: cat };
  }, [heightCm, weightKg]);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-primary">BMI Calculator</h1>
        <p className="text-muted-foreground text-sm">
          Calculate your Body Mass Index to understand your weight category.
        </p>
      </header>

      <main>
        <Card>
          <CardHeader>
            <CardTitle>Enter your details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 170"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                aria-label="Height in centimeters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                placeholder="e.g. 65"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                aria-label="Weight in kilograms"
              />
            </div>

            <div className="sm:col-span-2 mt-2">
              <div className="rounded-lg p-4 bg-primary/10 border border-primary/20">
                {bmi ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Your BMI</div>
                      <div className="text-3xl font-bold text-primary">{bmi}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Category</div>
                      <div className="text-lg font-semibold">{category}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Enter your height and weight to calculate BMI.</div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Note: BMI is a screening tool and may not account for muscle mass or other factors. Consult a healthcare professional for personalized advice.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}