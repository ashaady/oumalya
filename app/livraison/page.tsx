'use client';

import React from 'react';
import Link from 'next/link';
import SubpageLayout from '@/components/SubpageLayout';

export default function LivraisonPage() {
  return (
    <SubpageLayout>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <strong>Livraison &amp; FAQ</strong>
        </div>

        {/* Page Hero */}
        <div className="page-hero">
          <p className="page-kicker">TOUT SAVOIR</p>
          <h1 className="serif page-title">
            Livraison &amp; <span className="highlight">questions</span>
          </h1>
          <p>
            Découvrez comment préparer votre commande et les informations à confirmer auprès de la boutique.
          </p>
        </div>

        {/* Section Head */}
        <div className="section-head">
          <div>
            <p className="page-kicker">LE PARCOURS</p>
            <h2 className="serif section-title">Comment commander ?</h2>
          </div>
        </div>

        {/* How It Works */}
        <div className="how-it-works">
          <div className="how">
            <div className="num">01</div>
            <h3>Choisissez vos articles</h3>
            <p>Parcourez les collections et choisissez la taille ou la pointure souhaitée.</p>
          </div>
          <div className="how">
            <div className="num">02</div>
            <h3>Complétez vos coordonnées</h3>
            <p>Remplissez le formulaire et récupérez le récapitulatif de votre commande.</p>
          </div>
          <div className="how">
            <div className="num">03</div>
            <h3>Faites confirmer</h3>
            <p>Envoyez le message à la boutique pour valider disponibilité, livraison et montant final.</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="row-gap">
          <p className="page-kicker" style={{ textAlign: 'center' }}>
            FOIRE AUX QUESTIONS
          </p>
          <h2 className="serif section-title" style={{ textAlign: 'center', marginBottom: '34px' }}>
            Vos questions fréquentes
          </h2>
          <div className="faq-stack">
            <details className="disclosure" open>
              <summary>Comment passer commande ?</summary>
              <p>
                Ajoutez vos articles au panier, renseignez votre lieu de livraison sur la page Commande, puis validez. Votre commande est immédiatement enregistrée et transmise sur WhatsApp au <strong>+221 78 599 91 86</strong> pour confirmation.
              </p>
            </details>
            <details className="disclosure">
              <summary>Quels sont les frais et délais de livraison ?</summary>
              <p>
                Nous livrons sous 24h à 48h à Dakar et expédions dans toutes les régions du Sénégal. Les modalités précises et les frais de livraison sont convenus directement sur WhatsApp selon votre adresse.
              </p>
            </details>
            <details className="disclosure">
              <summary>Comment vérifier les tailles disponibles ?</summary>
              <p>
                Sélectionnez votre taille sur la fiche du produit (S, M, L, XL pour les abayas ou votre pointure pour les crocs). Notre équipe confirme la disponibilité en temps réel sur WhatsApp.
              </p>
            </details>
            <details className="disclosure">
              <summary>Comment s'effectue le paiement ?</summary>
              <p>
                Le paiement s'effectue en toute simplicité à la livraison : en espèces ou par Wave / Orange Money directement auprès du livreur.
              </p>
            </details>
            <details className="disclosure">
              <summary>Comment fonctionnent les retours et échanges ?</summary>
              <p>
                En cas de problème de taille ou de conformité, contactez notre service client sur WhatsApp dès réception du colis pour organiser un échange rapide.
              </p>
            </details>
          </div>
        </div>

        {/* Wide CTA */}
        <div className="wide-cta">
          <div>
            <h2>Vous avez une autre question ?</h2>
            <p>Préparez facilement un message depuis notre page de contact.</p>
          </div>
          <Link className="btn btn-primary" href="/contact">
            Nous contacter{' '}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </SubpageLayout>
  );
}
