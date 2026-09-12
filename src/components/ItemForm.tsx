import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2, Tag as TagIcon } from 'lucide-react';
import type { ItemCategory } from '@/types';
import { CATEGORIES } from '@/types';
import { supabase, PHOTO_BUCKET } from '@/lib/supabase';

export interface ItemFormData {
  name: string;
  contact: string;
  itemName: string;
  category: ItemCategory;
  color: string;
  brand: string;
  tags: string[];
  description: string;
  location: string;
  date: string;
  photoUrl: string;
}

interface Props {
  type: 'lost' | 'found';
  onSubmit: (data: ItemFormData) => Promise<void>;
  submitting: boolean;
}

export function ItemForm({ type, onSubmit, submitting }: Props) {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState<ItemCategory>('Other');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitBtnClass = type === 'lost'
    ? 'w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-rose-700 disabled:opacity-60'
    : 'w-full rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-teal-700 disabled:opacity-60';

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  }

  function removeTag(t: string) {
    setTags(tags.filter((x) => x !== t));
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(fileName, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage
        .from(PHOTO_BUCKET)
        .getPublicUrl(fileName);
      setPhotoUrl(urlData.publicUrl);
    } catch {
      // ignore — photo is optional
    } finally {
      setUploading(false);
    }
  }

  function removePhoto() {
    setPhotoUrl('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name,
      contact,
      itemName,
      category,
      color,
      brand,
      tags,
      description,
      location,
      date,
      photoUrl,
    });
    // Reset
    setName('');
    setContact('');
    setItemName('');
    setCategory('Other');
    setColor('');
    setBrand('');
    setTags([]);
    setDescription('');
    setLocation('');
    setDate('');
    setPhotoUrl('');
  }

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Reporter / Finder info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            {type === 'lost' ? 'Your Name' : 'Finder Name'}
          </label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Doe"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Contact (email or phone)
          </label>
          <input
            className={inputClass}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            placeholder="jane@university.edu"
          />
        </div>
      </div>

      {/* Item details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Item Name
          </label>
          <input
            className={inputClass}
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            required
            placeholder="Blue North Face Backpack"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Category
          </label>
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as ItemCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Color
          </label>
          <input
            className={inputClass}
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="Blue"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Brand
          </label>
          <input
            className={inputClass}
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="North Face"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            className={inputClass}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="water bottle, zipper, laptop sleeve"
          />
          <button
            type="button"
            onClick={addTag}
            className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
              >
                <TagIcon className="h-3 w-3" />
                {t}
                <button
                  type="button"
                  onClick={() => removeTag(t)}
                  className="ml-0.5 text-teal-400 hover:text-teal-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Description
        </label>
        <textarea
          className={`${inputClass} min-h-[80px] resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Black laptop with a sticker on the lid, slight scratch on the right corner..."
        />
      </div>

      {/* Location + Date */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            {type === 'lost' ? 'Last Seen Location' : 'Found Location'}
          </label>
          <input
            className={inputClass}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Library, 2nd floor"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            {type === 'lost' ? 'Date Lost' : 'Date Found'}
          </label>
          <input
            type="datetime-local"
            className={inputClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Photo upload */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Photo {type === 'lost' ? '(of the item if you have one)' : '(of the found item)'}
        </label>
        {photoUrl ? (
          <div className="relative inline-block">
            <img
              src={photoUrl}
              alt="Uploaded item"
              className="h-32 w-32 rounded-lg object-cover border border-gray-200"
            />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute -right-2 -top-2 rounded-full bg-rose-500 p-1 text-white shadow-lg transition hover:bg-rose-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-32 w-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-400 transition hover:border-teal-400 hover:text-teal-500"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6" />
                <span className="mt-1 text-xs">Upload</span>
              </>
            )}
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoUpload}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={submitBtnClass}
      >
        {submitting
          ? 'Submitting...'
          : type === 'lost'
          ? 'Report Lost Item'
          : 'Log Found Item'}
      </button>
    </form>
  );
}
