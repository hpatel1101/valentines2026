'use client';

import { useEffect, useState } from 'react';

const SITE_ACCESS_CODE = 'hv2026';
const ACCESS_STORAGE_KEY = 'hv_site_access';

export default function Page() {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [party, setParty] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [lookupMessage, setLookupMessage] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [hasAccess, setHasAccess] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    try {
      const storedAccess = window.sessionStorage.getItem(ACCESS_STORAGE_KEY);
      if (storedAccess === 'granted') {
        setHasAccess(true);
      }
    } catch (error) {
      // Ignore storage access issues and fall back to code entry.
    } finally {
      setAccessChecked(true);
    }
  }, []);

  function handleAccessSubmit(event) {
    event.preventDefault();
    if (accessCode.trim() === SITE_ACCESS_CODE) {
      setHasAccess(true);
      setAccessError('');
      try {
        window.sessionStorage.setItem(ACCESS_STORAGE_KEY, 'granted');
      } catch (error) {
        // Ignore storage access issues after successful validation.
      }
      return;
    }

    setAccessError('Incorrect code. Please try again.');
  }

  function chooseParty(selectedParty) {
    setParty(selectedParty);
    setMatches([]);
    setStatuses(Object.fromEntries(selectedParty.members.map((m) => [m.id, m.attending || ''])));
    setSubmitError('');
    setSubmitMessage('');
  }

  async function handleLookup(event) {
    event.preventDefault();
    setLoading(true);
    setLookupError('');
    setLookupMessage('');
    setSubmitError('');
    setSubmitMessage('');
    setParty(null);
    setMatches([]);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to search right now.');

      const parties = Array.isArray(data.parties) ? data.parties : [];
      if (!parties.length) {
        setStatuses({});
        setLookupError('We could not find that guest. Try a full first and last name.');
        return;
      }

      setMatches(parties);

      if (parties.length === 1) {
        chooseParty(parties[0]);
        setLookupMessage('Invitation found. You can respond for any guest below.');
      } else {
        setLookupMessage('We found multiple possible matches. Please choose your invitation below.');
      }
    } catch (error) {
      setLookupError(error.message || 'Unable to search right now.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!party) return setSubmitError('Please choose your invitation first.');

    const updates = party.members
      .filter((m) => statuses[m.id] === 'Attending' || statuses[m.id] === 'Not attending')
      .map((m) => ({ id: m.id, attending: statuses[m.id] }));

    if (!updates.length) return setSubmitError('Please choose attending or not attending for at least one guest.');

    setSaving(true);
    setSubmitError('');
    setSubmitMessage('');
    try {
      const response = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save RSVP.');
      setSubmitMessage('Your RSVP has been saved. Thank you!');
    } catch (error) {
      setSubmitError(error.message || 'Unable to save RSVP.');
    } finally {
      setSaving(false);
    }
  }

  if (!accessChecked) {
    return <main />;
  }

  if (!hasAccess) {
    return (
      <main>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');

          .names {
            font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
            font-size: clamp(3.2rem, 7vw, 5rem);
            font-weight: 300;
            letter-spacing: 0.03em;
            text-transform: none;
            line-height: 0.95;
          }
        `}</style>
        <section className="section" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <div className="container narrow">
            <div className="card rsvp-shell" style={{ textAlign: 'center' }}>
              <p className="eyebrow">Private access</p>
              <p className="names" style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', marginBottom: '0.75rem' }}>Hardik &amp; Vaidehi</p>
              <p className="message" style={{ marginBottom: '1.25rem' }}>Enter the access code to continue.</p>
              <form className="lookup-form" onSubmit={handleAccessSubmit}>
                <label htmlFor="accessCode">Access code</label>
                <input
                  id="accessCode"
                  type="password"
                  placeholder="Enter code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  autoComplete="off"
                  required
                />
                <button className="button primary full-width" type="submit">Enter site</button>
                {accessError ? <p className="message error">{accessError}</p> : null}
              </form>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&display=swap');

        .names {
          font-family: 'Cormorant Garamond', Georgia, 'Times New Roman', serif;
          font-size: clamp(3.2rem, 7vw, 5rem);
          font-weight: 300;
          letter-spacing: 0.03em;
          text-transform: none;
          line-height: 0.95;
        }
      `}</style>
      <header className="site-header">
        <div className="container header-inner">
          <div className="crest">H &amp; V</div>
          <p className="names">Hardik &amp; Vaidehi</p>
          <p className="meta">August 8, 2026 • 5:00 PM • Cartersville, GA</p>
          <nav className="nav">
            <a href="#details">Details</a>
            <a href="#rsvp">RSVP</a>
          </nav>
        </div>
      </header>

      <section className="hero-image-wrap">
        <div className="container">
          <div className="hero-image-card">
            <div className="hero-image-placeholder">
              <img className="hero-image" src="/engaged.jpg" alt="Hardik and Vaidehi engagement portrait" />
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="details">
        <div className="container narrow">
          <div className="section-heading center">
            <p className="eyebrow">Details</p>
            <h2>Saturday, August 8, 2026</h2>
            <p>5:00 PM · Clarence Brown Conference Center</p>
            <p>5450 GA-20, Cartersville, GA 30121</p>
            <p>Dress code: Indian Traditional</p>
          </div>
        </div>
      </section>

      <section className="section muted-section" id="rsvp">
        <div className="container narrow">
          <div className="section-heading center">
            <p className="eyebrow">RSVP</p>
            <h2>Find your invitation</h2>
            <p>Search your name. Select your invitation. Respond for any guest.</p>
          </div>

          <div className="card rsvp-shell">
            <form className="lookup-form" onSubmit={handleLookup}>
              <label htmlFor="guestSearch">Guest name</label>
              <div className="lookup-row">
                <input
                  id="guestSearch"
                  type="text"
                  placeholder="Example: Krish Patel"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  required
                />
                <button className="button primary" type="submit" disabled={loading}>
                  {loading ? 'Searching...' : 'Find invitation'}
                </button>
              </div>
              {lookupMessage ? <p className="message success">{lookupMessage}</p> : null}
              {lookupError ? <p className="message error">{lookupError}</p> : null}
            </form>

            {matches.length > 1 && !party ? (
              <div className="match-list">
                {matches.map((match, index) => (
                  <button
                    key={`${index}-${match.members.map((m) => m.id).join('-')}`}
                    type="button"
                    className={`match-card ${party && party.members[0] && match.members[0] && party.members[0].id === match.members[0].id ? 'active' : ''}`}
                    onClick={() => chooseParty(match)}
                  >
                    <span className="match-title">Possible match {index + 1}</span>
                    <span className="match-subtitle">Matched: {match.matchedGuests.join(', ')}</span>
                    <span className="match-subtitle">Guests: {match.members.map((m) => m.fullName).join(', ')}</span>
                  </button>
                ))}
              </div>
            ) : null}

            {party ? (
              <div className="party-card">
                <div className="party-header">
                  <div>
                    <p className="label">Invitation found</p>
                    <p>{party.members.map((m) => m.fullName).join(', ')}</p>
                  </div>
                  <span className="badge">{party.members.length} invited</span>
                </div>
                <form className="rsvp-form" onSubmit={handleSubmit}>
                  <div className="guest-list">
                    {party.members.map((m) => (
                      <div className="guest-row" key={m.id}>
                        <p className="guest-name">{m.fullName}</p>
                        <div className="choice-row">
                          <label>
                            <input
                              type="radio"
                              name={`guest-${m.id}`}
                              checked={statuses[m.id] === 'Attending'}
                              onChange={() => setStatuses((c) => ({ ...c, [m.id]: 'Attending' }))}
                            />
                            Attending
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`guest-${m.id}`}
                              checked={statuses[m.id] === 'Not attending'}
                              onChange={() => setStatuses((c) => ({ ...c, [m.id]: 'Not attending' }))}
                            />
                            Not attending
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="button primary full-width" type="submit" disabled={saving}>
                    {saving ? 'Saving RSVP...' : 'Submit RSVP'}
                  </button>
                  {submitMessage ? <p className="message success">{submitMessage}</p> : null}
                  {submitError ? <p className="message error">{submitError}</p> : null}
                </form>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
