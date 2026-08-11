"use client";

import { Check, Circle, PackageCheck, Plus, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { packingCategories, type PackingCategory, type PackingItem } from "@/lib/types";

type PackingListProps = {
  items: PackingItem[];
  onChange: (items: PackingItem[]) => void;
  saving?: boolean;
  saveMessage?: string;
};

export function PackingList({ items, onChange, saving = false, saveMessage }: PackingListProps) {
  const [newItem, setNewItem] = useState("");
  const [category, setCategory] = useState<PackingCategory>("Optional");
  const completed = items.filter((item) => item.checked).length;

  function updateItem(target: PackingItem, update: Partial<PackingItem>) {
    if (saving) return;
    onChange(items.map((item) => item === target ? { ...item, ...update } : item));
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const item = newItem.trim();
    if (!item) return;
    onChange([...items, { category, item, essential: false, checked: false }]);
    setNewItem("");
  }

  function removeItem(target: PackingItem) {
    if (saving) return;
    onChange(items.filter((item) => item !== target));
  }

  return (
    <section className="packing-list" aria-labelledby="packing-list-title">
      <div className="packing-list-head">
        <div>
          <p className="eyebrow"><PackageCheck size={14}/> PACK FOR THE TRIP</p>
          <h3 id="packing-list-title">Your smart packing list</h3>
          <p>Personalised for your destination, dates, and planned activities.</p>
        </div>
        <span className="packing-progress">{completed}/{items.length} packed</span>
      </div>

      <div className="packing-groups">
        {packingCategories.map((group) => {
          const groupItems = items.filter((item) => item.category === group);
          if (!groupItems.length) return null;
          return <div className="packing-group" key={group}>
            <h4>{group}</h4>
            <ul>
              {groupItems.map((item, index) => <li key={`${item.item}-${index}`} className={item.checked ? "packed" : ""}>
                <button type="button" className="packing-check" onClick={() => updateItem(item, { checked: !item.checked })} aria-label={`${item.checked ? "Mark unpacked" : "Mark packed"}: ${item.item}`} disabled={saving}>
                  {item.checked ? <Check size={15}/> : <Circle size={15}/>} 
                </button>
                <span>{item.item}{item.essential && <em>Essential</em>}</span>
                <button type="button" className="packing-delete" onClick={() => removeItem(item)} aria-label={`Remove ${item.item}`} disabled={saving}><Trash2 size={14}/></button>
              </li>)}
            </ul>
          </div>;
        })}
      </div>

      <form className="packing-add" onSubmit={addItem}>
        <select aria-label="Packing category" value={category} onChange={(event) => setCategory(event.target.value as PackingCategory)} disabled={saving}>
          {packingCategories.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <input value={newItem} onChange={(event) => setNewItem(event.target.value)} maxLength={120} placeholder="Add an item" aria-label="New packing item" disabled={saving} />
        <button type="submit" className="secondary" disabled={saving}><Plus size={15}/> Add</button>
      </form>
      {(saving || saveMessage) && <p className="packing-save-status">{saving ? "Saving checklist…" : saveMessage}</p>}
    </section>
  );
}
