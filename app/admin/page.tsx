'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  if (daysLeft <= 7) {
    return { text: `Active (${daysLeft} days left)`, color: 'text-yellow-500' };
  }
  return { text: `Active (${daysLeft} days left)`, color: 'text-green-500' };
};

function AdminPanelContent() {
  const { user, isLoading } = useUser();
  const searchParams = useSearchParams();
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [message, setMessage] = useState('');
  const [validationMessage, setValidationMessage] = useState('');

  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

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

      setValidationMessage(
        response.ok ? data.message : `Validation failed: ${data.error}`
      );
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 text-center shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-gray-800">
            Authentication Required
          </h1>

          {error === 'access_denied' && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                {errorDescription || 'Access denied. Use your cube.dev email.'}
              </p>
            </div>
          )}

          <p className="mb-6 text-gray-600">
            Please log in to access the admin panel.
          </p>
          <button
            onClick={() => (window.location.href = '/api/auth/login')}
            className="bg-pink hover:bg-pink/90 cursor-pointer rounded-md px-6 py-2 font-medium text-white transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  const status = invite ? getStatusInfo(invite) : null;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
              <p className="mt-1 text-gray-600">
                Manage Slack invitation links
              </p>
            </div>
            <button
              onClick={() => (window.location.href = '/api/auth/logout')}
              className="cursor-pointer rounded-md border border-pink-600 px-6 py-2 font-medium text-black transition-colors hover:bg-pink-50"
            >
              Log Out
            </button>
          </div>
        </div>

        {invite && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                Current Link
              </h2>
              <button
                onClick={handleValidateLink}
                disabled={validating || !invite.url}
                className="flex cursor-pointer items-center space-x-2 rounded-md bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:bg-gray-400"
              >
                {validating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <span>Validate Link</span>
                )}
              </button>
            </div>

            {validationMessage && (
              <div
                className={`mb-4 rounded-md p-3 ${
                  validationMessage.includes('valid and active')
                    ? 'border border-green-200 bg-green-50 text-green-800'
                    : 'border border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {validationMessage}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700">
                  URL:
                </label>
                <div className="py-3 text-sm break-all text-gray-800">
                  {invite.url || 'Not set'}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Status:
                  </label>
                  <span className={`font-semibold ${status?.color}`}>
                    {status?.text}
                  </span>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">
                    Created:
                  </label>
                  <span className="text-gray-600">
                    {new Date(invite.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Add New Link
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="url"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Slack Invitation Link:
              </label>
              <input
                type="url"
                id="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://join.slack.com/t/..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-800 focus:border-transparent focus:ring-2 focus:ring-gray-300 focus:outline-none"
                required
                disabled={loading}
              />
            </div>
            <div className="flex items-center space-x-4">
              <button
                type="submit"
                disabled={loading || !newUrl.trim()}
                className="bg-pink hover:bg-pink/90 cursor-pointer rounded-md px-4 py-2 font-medium text-white transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
              {message && (
                <span
                  className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}
                >
                  {message}
                </span>
              )}
            </div>
          </form>
          <div className="mt-4 rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The new link will replace the current one
              and be active for 30 days. After adding, the main page will
              automatically redirect to this link.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      }
    >
      <AdminPanelContent />
    </Suspense>
  );
}
