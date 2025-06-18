'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { InviteData } from '@/lib/invite-utils';

const getDaysLeft = (createdAt: string): number => {
  const diffInMs = Date.now() - new Date(createdAt).getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 3600 * 24));
  return Math.max(0, 30 - diffInDays);
};

const getStatusInfo = (invite: InviteData) => {
  if (!invite.isActive) return { text: 'Inactive', color: 'text-red-500' };

  const daysLeft = getDaysLeft(invite.createdAt);
  if (daysLeft === 0) return { text: 'Expired', color: 'text-red-500' };
  if (daysLeft <= 7) return { text: `Active (${daysLeft} days left)`, color: 'text-yellow-500' };
  return { text: `Active (${daysLeft} days left)`, color: 'text-green-500' };
};

export default function AdminPanel() {
  const { user, isLoading } = useUser();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const fetchInvite = async () => {
    try {
      const response = await fetch('/api/invite');
      if (response.ok) {
        const data = await response.json();
        setInvite(data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setLoading(true);
    setMessage('');
    setValidationMessage('');

    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setInvite(data);
        setNewUrl('');
        setMessage('Link updated successfully!');
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch {
      setMessage('Error saving link');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateLink = async () => {
    if (!invite?.url) return;

    setValidating(true);
    setValidationMessage('');

    try {
      const response = await fetch('/api/invite/validate', { method: 'POST' });
      const data = await response.json();

      setValidationMessage(response.ok ? data.message : `Validation failed: ${data.error}`);
      if (response.ok) await fetchInvite();
    } catch {
      setValidationMessage('Error validating link');
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    fetchInvite();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">Please log in to access the admin panel.</p>
          <Link
            href="/api/auth/login"
            className="bg-pink hover:bg-pink/90 text-white font-medium py-2 px-6 rounded-md transition-colors"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const status = invite ? getStatusInfo(invite) : null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Manage Slack invitation links</p>
            </div>
            <Link
              href="/api/auth/logout"
              className="text-black border border-pink-600 font-medium py-2 px-6 rounded-md transition-colors hover:bg-pink-50"
            >
              Log Out
            </Link>
          </div>
        </div>

        {invite && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Current Link</h2>
              <button
                onClick={handleValidateLink}
                disabled={validating || !invite.url}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center space-x-2"
              >
                {validating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <span>Validate Link</span>
                )}
              </button>
            </div>

            {validationMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                validationMessage.includes('valid and active')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {validationMessage}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">URL:</label>
                <div className="py-3 break-all text-sm text-gray-800">
                  {invite.url || 'Not set'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-1 font-semibold">Status:</label>
                  <span className={`font-semibold ${status?.color}`}>
                    {status?.text}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Created:</label>
                  <span className="text-gray-600">
                    {new Date(invite.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Link</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Slack Invitation Link:
              </label>
              <input
                type="url"
                id="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://join.slack.com/t/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent text-gray-800"
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading || !newUrl.trim()}
                className="bg-pink hover:bg-pink/90 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              {message && (
                <span className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </span>
              )}
            </div>
          </form>
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The new link will replace the current one and be active for 30 days.
              After adding, the main page will automatically redirect to this link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
