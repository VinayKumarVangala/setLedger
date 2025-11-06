import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building, Calendar } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-display-id': user.displayId || user.id
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsEditing(false);
        // Update user context if needed
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            title="Close profile modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="text-blue-500" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-gray-900">{user?.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Mail className="text-blue-500" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              ) : (
                <p className="mt-1 text-gray-900">{user?.email}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Building className="text-blue-500" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">User ID</label>
              <p className="mt-1 text-gray-900 font-mono text-sm">{user?.displayId || user?.id}</p>
              {user?.uuid && (
                <>
                  <label className="block text-sm font-medium text-gray-700 mt-2">Internal UUID</label>
                  <p className="mt-1 text-gray-500 font-mono text-xs">{user.uuid}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Calendar className="text-blue-500" size={20} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">Member Since</label>
              <p className="mt-1 text-gray-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                title="Cancel editing and discard changes"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                title="Save your profile changes"
              >
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              title="Edit your personal information"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;