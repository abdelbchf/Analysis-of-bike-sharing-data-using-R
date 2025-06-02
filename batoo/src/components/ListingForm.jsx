import React, { useState, useEffect } from 'react';

function ListingForm({ onSubmit, initialData = null, onCancel, submitButtonText = "Submit Listing" }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('yacht'); // Default type
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [available, setAvailable] = useState(true);
  const [formMessage, setFormMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setType(initialData.type || 'yacht');
      setDescription(initialData.description || '');
      setPrice(initialData.price || '');
      setLocation(initialData.location || '');
      setImageUrl(initialData.image_url || '');
      setAvailable(initialData.available === undefined ? true : initialData.available);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormMessage('');
    if (!name || !price || !location) {
      setFormMessage('Name, price, and location are required.');
      return;
    }
    onSubmit({
      name,
      type,
      description,
      price: parseFloat(price),
      location,
      image_url: imageUrl,
      available,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-white shadow-md rounded-lg">
      <h3 className="text-xl font-semibold text-gray-800">
        {initialData ? 'Edit Listing' : 'Create New Listing'}
      </h3>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
        <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
        <select id="type" value={type} onChange={(e) => setType(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
          <option value="yacht">Yacht</option>
          <option value="jetski">Jetski</option>
          <option value="experience">Experience</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (e.g., 1500)</label>
          <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01"
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
          <input type="text" id="location" value={location} onChange={(e) => setLocation(e.target.value)} required
                 className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Image URL (Optional)</label>
        <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
      </div>

      <div className="flex items-center">
        <input type="checkbox" id="available" checked={available} onChange={(e) => setAvailable(e.target.checked)}
               className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
        <label htmlFor="available" className="ml-2 block text-sm text-gray-900">Available for booking</label>
      </div>

      {formMessage && <p className="text-sm text-red-600">{formMessage}</p>}

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button type="button" onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm border border-gray-300">
            Cancel
          </button>
        )}
        <button type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          {submitButtonText}
        </button>
      </div>
    </form>
  );
}

export default ListingForm;
