import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { NutritionFields, WeightInput } from "../../shared/schemas";
import { nutritionFieldsSchema, weightInputSchema } from "../../shared/schemas";
import { api } from "../api";
import { localDate } from "../utils";
import { Modal } from "./Modal";

const numberValue = { valueAsNumber: true } as const;

export function WeightModal({ initial, onClose, onSaved }: { initial?: WeightInput; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<WeightInput>({
    resolver: zodResolver(weightInputSchema),
    defaultValues: initial ?? { date: localDate(), pounds: undefined, note: null },
  });
  return (
    <Modal title={initial ? "Update weight" : "Log weight"} eyebrow="Daily check-in" onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit(async (value) => { await api.saveWeight(value); onSaved(); })}>
        <label><span>Date</span><input type="date" {...register("date")} /></label>
        <label><span>Weight in pounds</span><div className="input-suffix"><input type="number" step="0.1" inputMode="decimal" autoFocus {...register("pounds", numberValue)} /><b>lb</b></div>{errors.pounds && <small>{errors.pounds.message}</small>}</label>
        <label><span>Note <em>optional</em></span><textarea rows={2} placeholder="How are you feeling?" {...register("note")} /></label>
        <button className="primary-button" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save weight"}</button>
      </form>
    </Modal>
  );
}

export function NutritionModal({ initial, title, onClose, onSave }: { initial?: NutritionFields; title: string; onClose: () => void; onSave: (value: NutritionFields) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NutritionFields>({
    resolver: zodResolver(nutritionFieldsSchema),
    defaultValues: initial ?? { name: "", description: "", calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
  });
  return (
    <Modal title={title} eyebrow="Nutrition" onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit(async (value) => { await onSave(value); onClose(); })}>
        <label><span>Name</span><input placeholder="Greek yogurt bowl" autoFocus {...register("name")} />{errors.name && <small>{errors.name.message}</small>}</label>
        <label><span>Description <em>optional</em></span><textarea rows={2} placeholder="Yogurt, blueberries, and granola" {...register("description")} /></label>
        <div className="macro-form-grid">
          <label><span>Calories</span><input type="number" inputMode="decimal" {...register("calories", numberValue)} /></label>
          <label><span>Protein</span><div className="input-suffix"><input type="number" step="0.1" inputMode="decimal" {...register("proteinGrams", numberValue)} /><b>g</b></div></label>
          <label><span>Carbs</span><div className="input-suffix"><input type="number" step="0.1" inputMode="decimal" {...register("carbsGrams", numberValue)} /><b>g</b></div></label>
          <label><span>Fat</span><div className="input-suffix"><input type="number" step="0.1" inputMode="decimal" {...register("fatGrams", numberValue)} /><b>g</b></div></label>
        </div>
        <button className="primary-button" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save"}</button>
      </form>
    </Modal>
  );
}
