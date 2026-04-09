'use client';

import { useState } from 'react';

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

  function chooseParty(selectedParty) {
    setParty(selectedParty);
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
        setLookupMessage('Invitation found. Select attending or not attending for any guests below.');
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

  return (
    <main>
      <header className="site-header"><div className="container nav-wrap"><a className="brand" href="#top">H &amp; V</a><nav className="nav"><a href="#details">Details</a><a href="#schedule">Schedule</a><a href="#rsvp">RSVP</a></nav></div></header>
      <section className="hero" id="top"><div className="container hero-grid"><div><p className="eyebrow">Engagement Celebration</p><h1>Hardik <span>&amp;</span> Vaidehi</h1><p className="hero-text">We’re so excited to celebrate with our favorite people. Join us for an evening of love, blessings, dinner, and dancing.</p><div className="pill-row"><span>August 8, 2026</span><span>5:00 PM</span><span>Cartersville, GA</span></div><div className="hero-actions"><a className="button primary" href="#rsvp">RSVP now</a><a className="button secondary" href="#details">View details</a></div></div><div className="hero-card"><div className="photo-placeholder"><div className="photo-frame"><p>Hardik &amp; Vaidehi</p><span>08 · 08 · 2026</span></div></div></div></div></section>
      <section className="section" id="details"><div className="container"><div className="section-heading"><p className="eyebrow">Details</p><h2>A warm, elegant evening in Cartersville</h2></div><div className="grid three-up"><article className="card"><p className="label">Date</p><h3>Saturday, August 8, 2026</h3><p>Please arrive around 4:30 PM so everyone is settled before the celebration begins at 5:00 PM.</p></article><article className="card"><p className="label">Location</p><h3>Cartersville, Georgia</h3><p>The final venue details can be updated here once you’re ready to share them with guests.</p></article><article className="card"><p className="label">Attire</p><h3>Festive formal</h3><p>Dressy, colorful, and celebration-ready. Elegant, comfortable, and perfect for dancing.</p></article></div></div></section>
      <section className="section alt" id="schedule"><div className="container schedule-grid"><div className="section-heading slim"><p className="eyebrow">Schedule</p><h2>One beautiful evening with family and friends</h2><p>This layout is ready for your real timeline and venue notes whenever you want to refine it.</p></div><div className="timeline card"><div className="timeline-item"><span>4:30 PM</span><div><h3>Guest arrival</h3><p>Welcome drinks, hugs, and time to settle in before the festivities begin.</p></div></div><div className="timeline-item"><span>5:00 PM</span><div><h3>Celebration begins</h3><p>A beautiful start to the evening with family, blessings, and the official celebration.</p></div></div><div className="timeline-item"><span>6:00 PM</span><div><h3>Dinner</h3><p>Enjoy a relaxed meal and time with loved ones.</p></div></div><div className="timeline-item"><span>7:30 PM</span><div><h3>Music and dancing</h3><p>Bring your energy for a joyful night on the dance floor.</p></div></div></div></div></section>
      <section className="section" id="rsvp"><div className="container narrow"><div className="section-heading center"><p className="eyebrow">RSVP</p><h2>Find your party</h2><p>Search by your first and last name. Your party will appear together, and you can respond for any guest.</p></div><div className="card rsvp-shell"><form className="lookup-form" onSubmit={handleLookup}><label htmlFor="guestSearch">Guest name</label><div className="lookup-row"><input id="guestSearch" type="text" placeholder="Example: Krish Patel" value={query} onChange={(e) => setQuery(e.target.value)} required /><button className="button primary" type="submit" disabled={loading}>{loading ? 'Searching...' : 'Find invitation'}</button></div>{lookupMessage ? <p className="message success">{lookupMessage}</p> : null}{lookupError ? <p className="message error">{lookupError}</p> : null}</form>

      {matches.length > 1 ? <div className="match-list">{matches.map((match, index) => <button key={`${index}-${match.members.map((m) => m.id).join('-')}`} type="button" className={`match-card ${party && party.members[0] && match.members[0] && party.members[0].id === match.members[0].id ? 'active' : ''}`} onClick={() => chooseParty(match)}><span className="match-title">Possible match {index + 1}</span><span className="match-subtitle">Matched: {match.matchedGuests.join(', ')}</span><span className="match-subtitle">Guests: {match.members.map((m) => m.fullName).join(', ')}</span></button>)}</div> : null}

      {party ? <div className="party-card"><div className="party-header"><div><p className="label">Invitation found</p><p>{party.members.map((m) => m.fullName).join(', ')}</p></div><span className="badge">{party.members.length} invited</span></div><form className="rsvp-form" onSubmit={handleSubmit}><div className="guest-list">{party.members.map((m) => <div className="guest-row" key={m.id}><p className="guest-name">{m.fullName}</p><div className="choice-row"><label><input type="radio" name={`guest-${m.id}`} checked={statuses[m.id] === 'Attending'} onChange={() => setStatuses((c) => ({ ...c, [m.id]: 'Attending' }))} />Attending</label><label><input type="radio" name={`guest-${m.id}`} checked={statuses[m.id] === 'Not attending'} onChange={() => setStatuses((c) => ({ ...c, [m.id]: 'Not attending' }))} />Not attending</label></div></div>)}</div><button className="button primary full-width" type="submit" disabled={saving}>{saving ? 'Saving RSVP...' : 'Submit RSVP'}</button>{submitMessage ? <p className="message success">{submitMessage}</p> : null}{submitError ? <p className="message error">{submitError}</p> : null}</form></div> : null}</div></div></section>
    </main>
  );
}
