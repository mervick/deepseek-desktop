import { useState } from 'react';

import './cookie-login-settings.css';

export function CookieLoginSettings() {
    const [cookieHeader, setCookieHeader] = useState('');
    const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setStatus(null);
        setSaving(true);
        try {
            const result = await window.electronAPI?.importDeepSeekCookies(cookieHeader);
            setStatus(
                result?.success
                    ? { type: 'success', text: 'Cookies saved. DeepSeek is reloading.' }
                    : { type: 'error', text: result?.error ?? 'Could not save cookies.' }
            );
            if (result?.success) setCookieHeader('');
        } catch {
            setStatus({ type: 'error', text: 'Could not save cookies.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="cookie-login-settings" data-testid="cookie-login-settings">
            <p>Paste the Cookie header copied from chat.deepseek.com.</p>
            <textarea
                value={cookieHeader}
                onChange={(event) => setCookieHeader(event.target.value)}
                placeholder="name=value; another_name=value"
                aria-label="DeepSeek Cookie header"
                rows={4}
                spellCheck={false}
            />
            <button type="button" onClick={handleSave} disabled={saving || !cookieHeader.trim()}>
                {saving ? 'Saving...' : 'Save cookies'}
            </button>
            {status && <p className={`cookie-login-settings__status ${status.type}`}>{status.text}</p>}
        </div>
    );
}
