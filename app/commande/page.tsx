'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SubpageLayout from '@/components/SubpageLayout';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';

const OFFICIAL_WHATSAPP = '221785999186';
const DISPLAY_WHATSAPP = '+221 78 599 91 86';

type DeliveryZone = 'dakar' | 'banlieue' | 'regions';

const ZONES: Record<DeliveryZone, { label: string; fee: number; sub: string }> = {
  dakar: {
    label: 'Dakar Ville & Centre',
    fee: 2000,
    sub: 'Almadies, Mermoz, Plateau, Point E, Ngor, Yoff, Ouakam, Fann…'
  },
  banlieue: {
    label: 'Banlieue Dakaroise',
    fee: 3000,
    sub: 'Pikine, Guédiawaye, Keur Massar, Rufisque, Parcelles Assainies…'
  },
  regions: {
    label: 'Régions du Sénégal',
    fee: 5000,
    sub: 'Thiès, Mbour, Saly, Saint-Louis, Kaolack, Touba, Ziguinchor…'
  }
};

export default function CommandePage() {
  const { cartEntries, totalPrice, totalCount, clearCart, showToast } = useCart();

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [zone, setZone] = useState<DeliveryZone>('dakar');
  const [adresse, setAdresse] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<{
    id: string;
    total: number;
    deliveryFee: number;
    whatsappMsg: string;
  } | null>(null);

  const deliveryFee = ZONES[zone].fee;
  const grandTotal = totalPrice + deliveryFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!totalCount || cartEntries.length === 0) {
      showToast('Votre panier est vide. Veuillez ajouter des articles.');
      return;
    }

    if (!nom.trim() || !telephone.trim() || !adresse.trim()) {
      showToast('Veuillez remplir votre nom, téléphone et adresse de livraison.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate clean order reference
      const orderRef = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Prepare items summary for WhatsApp
      const itemsList = cartEntries
        .map(
          item =>
            `• ${item.qty}x ${item.p.name} (${
              item.size === 'default' ? 'Taille standard' : `Taille ${item.size}`
            }) — ${formatPrice(item.p.price * item.qty)}`
        )
        .join('\n');

      const zoneInfo = ZONES[zone];

      // 3. Pre-formatted official WhatsApp message
      const whatsappMsg =
        `✨ *NOUVELLE COMMANDE OUMALYA CLOTHING* ✨\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📋 *Réf. Commande :* ${orderRef}\n\n` +
        `👤 *Cliente :* ${nom.trim()}\n` +
        `📞 *Téléphone / WhatsApp :* ${telephone.trim()}\n` +
        `📍 *Lieu de livraison :* ${zoneInfo.label}\n` +
        `🏠 *Adresse / Repère :* ${adresse.trim()}\n\n` +
        `🛍️ *Articles commandés :*\n` +
        `${itemsList}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💵 *Sous-total articles :* ${formatPrice(totalPrice)}\n` +
        `🚚 *Frais de livraison :* ${formatPrice(deliveryFee)}\n` +
        `💎 *TOTAL GÉNÉRAL :* ${formatPrice(grandTotal)}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        (note.trim() ? `📝 *Note client :* ${note.trim()}\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n` : '') +
        `\nBonjour OUMALYA, je viens de valider ma commande sur le site officiel et souhaite convenir du créneau de livraison avec vous. Merci beaucoup ! ✨`;

      // 4. Save order in the database via /api/orders
      const splitNames = nom.trim().split(' ');
      const prenomPart = splitNames[0] || '';
      const nomPart = splitNames.slice(1).join(' ') || prenomPart;

      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: orderRef,
          customer: {
            prenom: prenomPart,
            nom: nomPart,
            telephone: telephone.trim(),
            ville: zoneInfo.label,
            adresse: adresse.trim(),
            livraison: 'Livraison à domicile express',
            note: note.trim()
          },
          items: cartEntries.map(x => ({
            id: x.p.id,
            name: x.p.name,
            size: x.size,
            qty: x.qty,
            price: x.p.price,
            img: x.p.img || x.p.image
          })),
          subtotal: totalPrice,
          deliveryFee: deliveryFee,
          total: grandTotal,
          status: 'pending'
        })
      });

      // 5. Open WhatsApp directly to 221 78 599 91 86
      const waUrl = `https://wa.me/${OFFICIAL_WHATSAPP}?text=${encodeURIComponent(whatsappMsg)}`;
      window.open(waUrl, '_blank');

      // 6. Record confirmation & clear cart
      setConfirmedOrder({
        id: orderRef,
        total: grandTotal,
        deliveryFee,
        whatsappMsg
      });

      clearCart();
      showToast('Commande validée ! Redirection WhatsApp en cours…');
    } catch (err) {
      console.error(err);
      showToast('Une erreur est survenue lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyOrderMessage = async () => {
    if (!confirmedOrder) return;
    try {
      await navigator.clipboard.writeText(confirmedOrder.whatsappMsg);
      showToast('Message de commande copié dans le presse-papier !');
    } catch {
      showToast('Sélectionnez et copiez le texte ci-dessous.');
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (confirmedOrder) {
    return (
      <SubpageLayout>
        <div className="container" style={{ maxWidth: '780px', margin: '40px auto 80px' }}>
          <div
            className="card"
            style={{
              padding: '48px 36px',
              textAlign: 'center',
              borderRadius: '20px',
              border: '1px solid #f2ecee',
              boxShadow: '0 15px 45px rgba(235, 92, 142, 0.08)'
            }}
          >
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: '#fef1f5',
                color: 'var(--pink)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 20px',
                fontSize: '32px'
              }}
            >
              ✓
            </div>

            <p style={{ color: 'var(--pink)', fontWeight: 700, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>
              COMMANDE ENREGISTRÉE AVEC SUCCÈS
            </p>

            <h1 className="serif" style={{ fontSize: '32px', margin: '10px 0 16px' }}>
              Merci pour votre commande !
            </h1>

            <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 24px' }}>
              Votre commande <strong style={{ color: 'var(--ink)' }}>#{confirmedOrder.id}</strong> a été enregistrée dans notre système et transmise directement à notre service client sur WhatsApp au <strong>{DISPLAY_WHATSAPP}</strong>.
            </p>

            <div
              style={{
                background: '#fcf8fa',
                border: '1px dashed #eedce3',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '28px',
                display: 'inline-block'
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Montant total de la commande :</div>
              <strong style={{ fontSize: '24px', color: 'var(--pink)', fontFamily: "'Playfair Display', Georgia, serif" }}>
                {formatPrice(confirmedOrder.total)}
              </strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <a
                href={`https://wa.me/${OFFICIAL_WHATSAPP}?text=${encodeURIComponent(confirmedOrder.whatsappMsg)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  background: '#25D366',
                  color: '#ffffff',
                  fontSize: '14px',
                  padding: '14px 32px',
                  borderRadius: '100px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.774.979-.95 1.179-.175.2-.35.226-.65.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.35.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.244-.588-.492-.508-.676-.517l-.576-.01c-.2 0-.526.075-.801.376-.275.301-1.05 1.028-1.05 2.508 0 1.48 1.077 2.909 1.227 3.109.15.2 2.119 3.235 5.133 4.537.717.31 1.277.495 1.713.633.72.228 1.375.196 1.893.118.577-.087 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.576-.351z" />
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.502 3.585 1.377 5.08L2 22l5.07-1.33c1.442.822 3.11 1.33 4.93 1.33 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.6 0-3.1-.47-4.38-1.29l-.31-.2-3.23.85.86-3.15-.2-.33C3.89 14.81 3.4 13.46 3.4 12c0-4.74 3.86-8.6 8.6-8.6s8.6 3.86 8.6 8.6-3.86 8.6-8.6 8.6z" />
                </svg>
                Ouvrir WhatsApp ({DISPLAY_WHATSAPP})
              </a>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={copyOrderMessage}
                  className="btn btn-outline"
                  style={{ fontSize: '13px' }}
                >
                  📋 Copier le message
                </button>
                <Link href="/boutique" className="btn btn-outline" style={{ fontSize: '13px' }}>
                  Continuer mes achats →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SubpageLayout>
    );
  }

  // STANDARD CHECKOUT FORM
  return (
    <SubpageLayout>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <Link href="/panier">Panier</Link> › <strong>Commande</strong>
        </div>

        {/* Section Head */}
        <div className="section-head" style={{ margin: '14px 0 28px' }}>
          <div>
            <p className="page-kicker">COMMANDE EXPRESS & SÉCURISÉE</p>
            <h1 className="serif page-title">
              Finaliser votre <span className="highlight">commande</span>
            </h1>
            <p className="muted" style={{ fontSize: '13.5px' }}>
              Indiquez votre lieu de livraison. Votre commande sera immédiatement enregistrée et envoyée sur WhatsApp au <strong>{DISPLAY_WHATSAPP}</strong>.
            </p>
          </div>
        </div>

        <div className="checkout-grid">
          {/* Main Checkout Form */}
          <div>
            <form id="orderForm" className="card checkout-form" onSubmit={handleSubmit}>
              {/* Step 1: Lieu de Livraison */}
              <div className="checkout-step">
                <span>01</span>
                <h2>Lieu de livraison & Expédition</h2>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '8px' }}>
                  Choisissez votre zone de livraison <span>*</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {(Object.keys(ZONES) as DeliveryZone[]).map(key => {
                    const z = ZONES[key];
                    const isSelected = zone === key;
                    return (
                      <button
                        type="button"
                        key={key}
                        onClick={() => setZone(key)}
                        style={{
                          textAlign: 'left',
                          padding: '14px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid var(--pink)' : '1px solid var(--stroke)',
                          background: isSelected ? '#fef3f7' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '13px', color: isSelected ? 'var(--pink)' : 'var(--ink)' }}>
                            {z.label}
                          </strong>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pink)' }}>
                            {formatPrice(z.fee)}
                          </span>
                        </div>
                        <small style={{ fontSize: '11px', color: 'var(--muted)', display: 'block', lineHeight: 1.4 }}>
                          {z.sub}
                        </small>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <label htmlFor="adresse">
                  Adresse précise ou point de repère <span>*</span>
                </label>
                <input
                  id="adresse"
                  name="adresse"
                  placeholder="Ex. : Mermoz près de la Brioche Dorée, Immeuble A, 2e étage"
                  required
                  value={adresse}
                  onChange={e => setAdresse(e.target.value)}
                />
              </div>

              <div className="separator" style={{ margin: '24px 0' }} />

              {/* Step 2: Coordonnées Cliente */}
              <div className="checkout-step">
                <span>02</span>
                <h2>Vos coordonnées</h2>
              </div>

              <div className="field-grid">
                <div className="field">
                  <label htmlFor="nom">
                    Nom & Prénom <span>*</span>
                  </label>
                  <input
                    id="nom"
                    name="nom"
                    placeholder="Ex. : Aminata Diallo"
                    required
                    value={nom}
                    onChange={e => setNom(e.target.value)}
                  />
                </div>

                <div className="field">
                  <label htmlFor="telephone">
                    Téléphone / WhatsApp <span>*</span>
                  </label>
                  <input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    placeholder="Ex. : 77 123 45 67"
                    required
                    value={telephone}
                    onChange={e => setTelephone(e.target.value)}
                  />
                </div>
              </div>

              <div className="field">
                <label htmlFor="note">Précision ou note complémentaire (facultatif)</label>
                <textarea
                  id="note"
                  name="note"
                  rows={2}
                  placeholder="Ex. : Merci de me contacter avant 15h, ou précision sur votre taille..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>

              {/* Notice & Submit Button */}
              <div
                style={{
                  background: '#fcf8fa',
                  border: '1px solid #f6e6ec',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '20px' }}>💬</div>
                <div style={{ fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.5 }}>
                  En validant, votre commande est <strong>enregistrée dans notre boutique</strong> et transmise directement sur WhatsApp au <strong>{DISPLAY_WHATSAPP}</strong> pour confirmation immédiate avec notre équipe.
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !cartEntries.length}
                style={{
                  width: '100%',
                  background: '#25D366',
                  borderColor: '#20bd5a',
                  padding: '16px',
                  fontSize: '14px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.275-.1-.475-.15-.675.15-.2.301-.774.979-.95 1.179-.175.2-.35.226-.65.075-.301-.15-1.27-.468-2.42-1.493-.894-.798-1.498-1.784-1.674-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.35.451-.526.15-.175.2-.301.3-.501.1-.2.05-.376-.025-.526-.075-.15-.676-1.63-.926-2.233-.244-.588-.492-.508-.676-.517l-.576-.01c-.2 0-.526.075-.801.376-.275.301-1.05 1.028-1.05 2.508 0 1.48 1.077 2.909 1.227 3.109.15.2 2.119 3.235 5.133 4.537.717.31 1.277.495 1.713.633.72.228 1.375.196 1.893.118.577-.087 1.78-.727 2.03-1.43.25-.702.25-1.303.175-1.43-.075-.126-.275-.201-.576-.351z" />
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.502 3.585 1.377 5.08L2 22l5.07-1.33c1.442.822 3.11 1.33 4.93 1.33 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.6 0-3.1-.47-4.38-1.29l-.31-.2-3.23.85.86-3.15-.2-.33C3.89 14.81 3.4 13.46 3.4 12c0-4.74 3.86-8.6 8.6-8.6s8.6 3.86 8.6 8.6-3.86 8.6-8.6 8.6z" />
                </svg>
                {isSubmitting ? 'Enregistrement en cours…' : 'Commander & Envoyer sur WhatsApp'}
              </button>
            </form>
          </div>

          {/* Right Summary Box */}
          <aside className="card summary-box">
            <h2>Récapitulatif de commande</h2>
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
                        {item.size === 'default' ? 'Taille standard' : `Taille ${item.size}`} × {item.qty}
                      </small>
                    </div>
                    <span className="cart-mini-price">{formatPrice(item.p.price * item.qty)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="separator" style={{ margin: '18px 0' }} />

            <div className="summary-line">
              <span>Sous-total articles</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>

            <div className="summary-line">
              <span>Livraison ({ZONES[zone].label})</span>
              <strong style={{ color: 'var(--pink)' }}>{formatPrice(deliveryFee)}</strong>
            </div>

            <div className="summary-line total" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
              <span>Total à régler</span>
              <strong style={{ fontSize: '20px', color: 'var(--pink)' }}>{formatPrice(grandTotal)}</strong>
            </div>

            <p className="summary-notice" style={{ marginTop: '16px' }}>
              Règlement en espèces ou Wave / Orange Money à la livraison selon votre convenance.
            </p>

            <Link href="/panier" className="small-link" style={{ marginTop: '18px' }}>
              ← Revenir au panier
            </Link>
          </aside>
        </div>
      </div>
    </SubpageLayout>
  );
}
