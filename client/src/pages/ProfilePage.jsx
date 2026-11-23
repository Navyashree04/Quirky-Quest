import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userApi } from '../api/endpoints';

export default function ProfilePage() {
  const { user, refreshMe } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await userApi.updateMe({ name });
      await refreshMe();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  const hours = Math.floor(user.stats.totalPlaytimeSeconds / 3600);
  const minutes = Math.floor((user.stats.totalPlaytimeSeconds % 3600) / 60);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 font-display text-3xl font-bold">Your profile</h1>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-muted">Games played</p>
          <p className="font-mono text-2xl text-zap">{user.stats.gamesPlayed}</p>
        </div>
        <div className="card">
          <p className="text-sm text-muted">Total playtime</p>
          <p className="font-mono text-2xl text-zap">
            {hours}h {minutes}m
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm text-muted">Display name</label>
          <input
            type="text"
            minLength={2}
            maxLength={40}
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <p className="text-sm text-zap">Saved.</p>}
      </form>
    </div>
  );
}
