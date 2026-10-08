'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SubpageLayout from '@/components/SubpageLayout';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';

export default function CommandePage() {
  const { cartEntries, totalPrice, totalCount, showToast } = useCart();

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    ville: '',
    livraison: '',
    adresse: '',
    note: ''
  });

  const [orderMessage, setOrderMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totalCount) {
      showToast('Ajoutez des articles à votre panier');
      return;
    }

    const itemsSummary = cartEntries
      .map(
        x =>
          `• ${x.p.name} | ${
            x.size === 'default' ? 'Taille à confirmer' : `Taille ${x.size}`
          } | x${x.qty} | ${formatPrice(x.p.price * x.qty)}`
      )
      .join('\n');

    const msg = `Bonjour OUMALYA CLOTHING, je souhaite commander :\n\n${itemsSummary}\n\nTOTAL ARTICLES : ${formatPrice(
      totalPrice
    )}\nFrais de livraison : à confirmer\n\nNom : ${formData.prenom} ${formData.nom}\nTéléphone : ${
      formData.telephone
    }\nVille / commune : ${formData.ville}\nAdresse : ${formData.adresse}\nLivraison : ${
      formData.livraison
    }\nNote : ${formData.note || 'Aucune'}\n\nMerci de confirmer la disponibilité et le montant final.`;

    setOrderMessage(msg);
    showToast('Récapitulatif prêt à copier et envoyer');

    setTimeout(() => {
      document.getElementById('orderOutput')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const copyOrder = async () => {
    if (!orderMessage) return;
    try {
      await navigator.clipboard.writeText(orderMessage);
      showToast('Commande copiée. Envoyez-la à la boutique.');
    } catch {
      const textarea = document.getElementById('orderText') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.select();
      }
      showToast('Sélectionnez et copiez votre commande');
    }
  };

  return (
    <SubpageLayout>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <strong>Commande</strong>
        </div>

        {/* Section Head */}
        <div className="section-head" style={{ margin: '12px 0 32px' }}>
          <div>
            <p className="page-kicker">DERNIÈRE ÉTAPE</p>
            <h1 className="serif page-title">
              Finaliser votre <span className="highlight">commande</span>
            </h1>
            <p className="muted" style={{ fontSize: '13px' }}>
              Renseignez vos informations pour préparer le message à envoyer à la boutique.
            </p>
          </div>
        </div>

        <div className="checkout-grid">
          <div>
            <form id="orderForm" className="card checkout-form" onSubmit={handleSubmit}>
              <div className="checkout-step">
                <span>01</span>
                <h2>Vos coordonnées</h2>
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="prenom">
                    Prénom <span>*</span>
                  </label>
                  <input
                    id="prenom"
                    name="prenom"
                    autoComplete="given-name"
                    placeholder="Votre prénom"
                    required
                    maxLength={70}
                    value={formData.prenom}
                    onChange={e => setFormData({ ...formData, prenom: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="nom">
                    Nom <span>*</span>
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    autoComplete="family-name"
                    placeholder="Votre nom"
                    required
                    maxLength={70}
                    value={formData.nom}
                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="telephone">
                  Téléphone / WhatsApp <span>*</span>
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="Ex. : 77 000 00 00"
                  required
                  minLength={7}
                  maxLength={25}
                  value={formData.telephone}
                  onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>

              <div className="separator"></div>

              <div className="checkout-step">
                <span>02</span>
                <h2>Informations de livraison</h2>
              </div>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="ville">
                    Ville / commune <span>*</span>
                  </label>
                  <input
                    id="ville"
                    name="ville"
                    placeholder="Ex. : Dakar, Pikine…"
                    required
                    maxLength={95}
                    value={formData.ville}
                    onChange={e => setFormData({ ...formData, ville: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="livraison">
                    Mode de réception <span>*</span>
                  </label>
                  <select
                    id="livraison"
                    name="livraison"
                    required
                    value={formData.livraison}
                    onChange={e => setFormData({ ...formData, livraison: e.target.value })}
                  >
                    <option value="">Choisir une option</option>
                    <option value="Livraison à domicile (à confirmer)">Livraison à domicile (à confirmer)</option>
                    <option value="Retrait (si disponible)">Retrait (si disponible)</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label htmlFor="adresse">
                  Adresse ou point de repère <span>*</span>
                </label>
                <input
                  id="adresse"
                  name="adresse"
                  autoComplete="street-address"
                  required
                  placeholder="Quartier, rue, indication…"
                  maxLength={240}
                  value={formData.adresse}
                  onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="note">Note complémentaire</label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  placeholder="Une indication sur votre taille, livraison ou préférence…"
                  maxLength={500}
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                />
              </div>

              <div className="form-note">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m8.5 12 2.3 2.3 4.7-4.7" />
                </svg>{' '}
                Les informations saisies restent dans votre navigateur tant que vous ne copiez pas le récapitulatif. Aucun paiement ni transmission automatique n’est effectué.
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                id="prepareOrder"
                style={{ width: '100%' }}
                disabled={!cartEntries.length}
              >
                Préparer mon récapitulatif{' '}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </button>
            </form>

            {/* Output Section */}
            {orderMessage && (
              <section className="card form-card" id="orderOutput" style={{ marginTop: '20px' }}>
                <h2>Votre message est prêt ♡</h2>
                <p>
                  Copiez ce texte, puis envoyez-le manuellement sur le WhatsApp ou le canal de contact officiel de la boutique.
                </p>
                <div className="field">
                  <textarea
                    id="orderText"
                    rows={12}
                    readOnly
                    aria-label="Récapitulatif de la commande"
                    value={orderMessage}
                  />
                </div>
                <button className="btn btn-outline" id="copyOrder" type="button" onClick={copyOrder}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="8" y="8" width="13" height="13" rx="2" />
                    <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
                  </svg>{' '}
                  Copier le message
                </button>
                <Link className="small-link" href="/contact" style={{ marginLeft: '15px' }}>
                  Comment nous contacter{' '}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </Link>
              </section>
            )}
          </div>

          {/* Right Summary */}
          <aside className="card summary-box">
            <h2>Votre sélection</h2>
            <div id="checkoutItems">
              {cartEntries.length === 0 ? (
                <p className="notice">
                  Votre panier est vide. <Link href="/boutique">Choisir des articles</Link>.
                </p>
              ) : (
                cartEntries.map((item, idx) => (
                  <div key={`${item.p.id}-${item.size}-${idx}`} className="cart-mini">
                    <img src={item.p.img} alt={item.p.name} />
                    <div>
                      <strong>{item.p.name}</strong>
                      <small>
                        {item.size === 'default' ? 'Taille à confirmer' : `Taille ${item.size}`} × {item.qty}
                      </small>
                    </div>
                    <span className="cart-mini-price">{formatPrice(item.p.price * item.qty)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="separator"></div>
            <div className="summary-line">
              <span>Livraison</span>
              <span>À confirmer</span>
            </div>
            <div className="summary-line total">
              <span>Total articles</span>
              <strong id="checkoutTotal">{formatPrice(totalPrice)}</strong>
            </div>
            <p className="summary-notice">
              Prix indicatifs · Aucun paiement en ligne · Confirmation finale auprès de la boutique.
            </p>
            <Link href="/panier" className="small-link" style={{ marginTop: '20px' }}>
              ← Modifier mon panier
            </Link>
          </aside>
        </div>
      </div>
    </SubpageLayout>
  );
}
