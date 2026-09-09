'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CATEGORY_SLUGS,
  SUBCATEGORY_SLUGS,
  SUBCATEGORIES_BY_CATEGORY,
  CATEGORY_LABELS,
  getDefaultMaxQuantity,
} from '@/lib/constants';

const CATEGORY_OPTIONS = [
  { slug: CATEGORY_SLUGS.CROCHET, label: CATEGORY_LABELS[CATEGORY_SLUGS.CROCHET] },
  { slug: CATEGORY_SLUGS.PIPECLEANER_ART, label: CATEGORY_LABELS[CATEGORY_SLUGS.PIPECLEANER_ART] },
];

const inputStyle = {
  backgroundColor: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  color: 'var(--admin-text)',
};

const labelStyle = { color: 'var(--admin-text)' };
const mutedStyle = { color: 'var(--admin-text-muted)' };

export default function ProductForm({ initialData, productId }) {
  const router = useRouter();

  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [subcategory, setSubcategory] = useState(initialData?.subcategory || '');
  const [maxQuantity, setMaxQuantity] = useState(
    initialData?.maxQuantity ?? getDefaultMaxQuantity(initialData?.subcategory)
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [basePrice, setBasePrice] = useState(initialData?.basePrice || '');
  const [originalPrice, setOriginalPrice] = useState(initialData?.originalPrice || '');
  const [isActive, setIsActive] = useState(initialData?.isActive !== undefined ? initialData.isActive : true);
  const [tags, setTags] = useState(initialData?.tags ? initialData.tags.join(', ') : '');

  const [images, setImages] = useState(initialData?.images || []);
  const [removedImages, setRemovedImages] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isPipecleaner = category === CATEGORY_SLUGS.PIPECLEANER_ART;
  const subcategoryOptions = SUBCATEGORIES_BY_CATEGORY[category] ?? [];

  // When category changes: clear subcategory, recalculate maxQuantity default
  function handleCategoryChange(value) {
    setCategory(value);
    setSubcategory('');
    if (!productId) {
      setMaxQuantity(getDefaultMaxQuantity(''));
    }
  }

  // When subcategory changes: update maxQuantity default (only on create)
  function handleSubcategoryChange(value) {
    setSubcategory(value);
    if (!productId) {
      setMaxQuantity(getDefaultMaxQuantity(value));
    }
  }

  function handleNameChange(value) {
    setName(value);
    if (!productId) {
      setSlug(
        value
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
      );
    }
  }

  function handleImageRemove(imageUrl) {
    setRemovedImages((prev) => [...prev, imageUrl]);
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    await Promise.all(
      files.map(async (file, index) => {
        const fileId = `${Date.now()}-${index}`;
        setUploadingFiles((prev) => [...prev, { id: fileId, name: file.name }]);
        try {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          setImages((prev) => [...prev, { url: data.secure_url, order: prev.length + index }]);
        } catch {
          setError(`Failed to upload ${file.name}`);
        } finally {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== fileId));
        }
      })
    );
    e.target.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const finalImages = images
        .filter((img) => {
          const url = typeof img === 'string' ? img : img.url;
          return !removedImages.includes(url);
        })
        .map((img, index) =>
          typeof img === 'string' ? img : { ...img, order: index }
        );

      const tagsArray = tags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const payload = {
        name,
        slug,
        category,
        subcategory: isPipecleaner ? subcategory : null,
        maxQuantity: parseInt(maxQuantity) || 1,
        description,
        basePrice: parseFloat(basePrice),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        images: finalImages,
        isActive,
        tags: tagsArray,
      };

      const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';
      const res = await fetch(url, {
        method: productId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      toast.success(productId ? 'Product updated successfully' : 'Product created successfully');
      router.push('/admin/products');
    } catch (err) {
      setError(err.message);
      toast.error(`${productId ? 'Edit product' : 'Create product'} failed. Consult your brother for the solution.`);
    } finally {
      setSubmitting(false);
    }
  }

  const displayImages = images.filter((img) => {
    const url = typeof img === 'string' ? img : img.url;
    return !removedImages.includes(url);
  });

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 space-y-6" style={{ color: 'var(--admin-text)' }}>
      <h1 className="text-2xl font-bold" style={labelStyle}>
        {productId ? 'Edit Product' : 'Create Product'}
      </h1>

      {error && (
        <div className="px-4 py-3 rounded text-red-400" style={{ backgroundColor: 'var(--admin-surface)', border: '1px solid #7f1d1d' }}>
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            Product Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Slug <span className='text-sm text-gray-500'>(Auto-generated)</span></label>
          <input
            type="text"
            value={slug}
            readOnly
            className="w-full px-3 py-2 rounded-md focus:outline-none cursor-default"
            style={{ ...inputStyle, opacity: 0.6 }}
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            Category <span className="text-red-400">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md focus:outline-none"
            style={{ ...inputStyle, colorScheme: 'light' }}
          >
            <option value="">Select a category</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.slug} value={opt.slug}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory — only shown for Pipecleaner Art */}
        {isPipecleaner && (
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Subcategory <span className="text-red-400">*</span>
            </label>
            <select
              value={subcategory}
              onChange={(e) => handleSubcategoryChange(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-md focus:outline-none"
              style={{ ...inputStyle, colorScheme: 'light' }}
            >
              <option value="">Select a subcategory</option>
              {subcategoryOptions.map((slug) => (
                <option key={slug} value={slug}>
                  {CATEGORY_LABELS[slug]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Max Quantity */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>
            Max Quantity per Order <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            value={maxQuantity}
            onChange={(e) => setMaxQuantity(e.target.value)}
            min="1"
            required
            className="w-full px-3 py-2 rounded-md focus:outline-none"
            style={inputStyle}
          />
          <p className="text-xs mt-1" style={mutedStyle}>
            Default: 3 for wall hangings, 5 for everything else. Editable.
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-md focus:outline-none"
            style={inputStyle}
          />
        </div>

        {/* Base Price + Original Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Base Price <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              min="0"
              step="0.01"
              required
              className="w-full px-3 py-2 rounded-md focus:outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={labelStyle}>
              Original Price
            </label>
            <input
              type="number"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 rounded-md focus:outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2, tag3"
            className="w-full px-3 py-2 rounded-md focus:outline-none"
            style={inputStyle}
          />
          <p className="text-xs mt-1" style={mutedStyle}>Comma-separated values</p>
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <label htmlFor="isActive" className="text-sm font-medium" style={labelStyle}>
            Active
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="pt-6 space-y-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
        <h2 className="text-lg font-semibold" style={labelStyle}>Images</h2>

        {displayImages.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayImages
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((img, index) => {
                const url = typeof img === 'string' ? img : img.url;
                return (
                  <div key={index} className="relative">
                    <img src={url} alt="" className="w-16 h-16 object-cover rounded" style={{ border: '1px solid var(--admin-border)' }} />
                    <button
                      type="button"
                      onClick={() => handleImageRemove(url)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1" style={labelStyle}>Upload Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="w-full px-3 py-2 rounded-md"
            style={inputStyle}
          />
        </div>

        {uploadingFiles.length > 0 && (
          <div className="space-y-1">
            {uploadingFiles.map((file) => (
              <div key={file.id} className="text-sm flex items-center gap-2" style={mutedStyle}>
                <div className="animate-spin h-4 w-4 border-2 border-t-transparent rounded-full" style={{ borderColor: 'var(--admin-accent)', borderTopColor: 'transparent' }} />
                Uploading {file.name}...
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit / Cancel */}
      <div className="flex gap-4 pt-6" style={{ borderTop: '1px solid var(--admin-border)' }}>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 font-bold rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'var(--admin-accent)', color: '#fff' }}
        >
          {submitting ? 'Saving...' : productId ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-6 py-2 font-semibold rounded-md border border-red-600 text-red-500"
          style={{ backgroundColor: 'var(--admin-bg)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
