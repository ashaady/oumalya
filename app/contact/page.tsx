'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SubpageLayout from '@/components/SubpageLayout';
import { useCart } from '@/context/CartContext';

export default function ContactPage() {
  const { showToast } = useCart();

  const [formData, setFormData] = useState({
    nom: '',
    telephone: '',
    sujet: '',
    message: ''
  });

  const [preparedMessage, setPreparedMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Bonjour OUMALYA CLOTHING,\nNom : ${formData.nom}\nTéléphone : ${formData.telephone}\nSujet : ${formData.sujet}\n\n${formData.message}`;
    setPreparedMessage(msg);
    showToast('Message prêt. Copiez-le pour contacter la boutique.');

    setTimeout(() => {
      document.getElementById('contactResult')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const copyMessage = async () => {
    if (!preparedMessage) return;
    try {
      await navigator.clipboard.writeText(preparedMessage);
      showToast('Message copié');
    } catch {
      const el = document.getElementById('contactText') as HTMLTextAreaElement;
      if (el) el.select();
    }
  };

  return (
    <SubpageLayout>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <strong>Contact</strong>
        </div>

        {/* Page Hero */}
        <div className="page-hero">
          <p className="page-kicker">UNE QUESTION ?</p>
          <h1 className="serif page-title">
            Parlons de vos <span className="highlight">envies.</span>
          </h1>
          <p>
            Besoin d’une information sur une taille, une disponibilité ou une livraison ? Préparez votre message ici.
          </p>
        </div>

        <div className="contact-grid">
          <aside className="contact-info">
            <p className="page-kicker">RESTONS EN CONTACT</p>
            <h2>On est là pour vous ♡</h2>
            <p>
              Écrivez-nous pour poser vos questions avant de commander. Les coordonnées officielles seront ajoutées avant le lancement.
            </p>

            <div className="contact-method">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.4a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z" />
              </svg>
              <div>
                <strong>WhatsApp Service Client</strong>
                <a href="https://wa.me/221785999186" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pink)', display: 'block', fontWeight: 600 }}>
                  +221 78 599 91 86
                </a>
              </div>
            </div>

            <div className="contact-method">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <div>
                <strong>Zone de vente</strong>
                <small>Dakar &amp; expédition sécurisée dans tout le Sénégal</small>
              </div>
            </div>

            <div className="contact-method">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 6 10 8 10-8" />
              </svg>
              <div>
                <strong>E-mail Officiel</strong>
                <small>contact@oumalya.sn</small>
              </div>
            </div>

            <div className="contact-method">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 6h12v12H2zM14 10h4l4 5v3h-8" />
                <circle cx="6" cy="19" r="2" />
                <circle cx="18" cy="19" r="2" />
              </svg>
              <div>
                <strong>Livraison Express</strong>
                <small>À domicile à Dakar et retrait en agence en région</small>
              </div>
            </div>
          </aside>

          <div>
            <form className="card form-card" id="contactForm" onSubmit={handleSubmit}>
              <h2>Envoyez un petit mot</h2>
              <p>Ce formulaire prépare un message à copier. Il ne l’envoie pas automatiquement.</p>

              <div className="field-grid">
                <div className="field">
                  <label htmlFor="contactNom">
                    Votre nom <span>*</span>
                  </label>
                  <input
                    name="nom"
                    id="contactNom"
                    autoComplete="name"
                    required
                    placeholder="Nom complet"
                    maxLength={140}
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="contactTel">
                    Votre téléphone <span>*</span>
                  </label>
                  <input
                    name="telephone"
                    id="contactTel"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="Téléphone"
                    minLength={7}
                    maxLength={25}
                    value={formData.telephone}
                    onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="contactSujet">
                  Votre demande <span>*</span>
                </label>
                <select
                  id="contactSujet"
                  name="sujet"
                  required
                  value={formData.sujet}
                  onChange={e => setFormData({ ...formData, sujet: e.target.value })}
                >
                  <option value="">Choisissez un sujet</option>
                  <option value="Questions sur les tailles">Questions sur les tailles</option>
                  <option value="Disponibilité d’un produit">Disponibilité d’un produit</option>
                  <option value="Livraison">Livraison</option>
                  <option value="Autre question">Autre question</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="contactMessage">
                  Votre message <span>*</span>
                </label>
                <textarea
                  name="message"
                  id="contactMessage"
                  placeholder="Comment pouvons-nous vous aider ?"
                  required
                  maxLength={1000}
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button className="btn btn-primary" type="submit">
                Préparer mon message{' '}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </form>

            {preparedMessage && (
              <section className="card form-card" id="contactResult" style={{ marginTop: '18px' }}>
                <h2>Votre message est prêt</h2>
                <p>Copiez-le, puis envoyez-le au contact officiel de la boutique.</p>
                <div className="field">
                  <textarea id="contactText" readOnly rows={7} value={preparedMessage} />
                </div>
                <button className="btn btn-outline" id="copyContact" type="button" onClick={copyMessage}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="8" y="8" width="13" height="13" rx="2" />
                    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                  </svg>{' '}
                  Copier le message
                </button>
              </section>
            )}
          </div>
        </div>

        {/* Wide CTA */}
        <div className="wide-cta">
          <div>
            <h2>Envie de faire votre shopping ?</h2>
            <p>Parcourez nos abayas et Crocs.</p>
          </div>
          <Link className="btn btn-primary" href="/boutique">
            Voir la collection{' '}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </SubpageLayout>
  );
}
