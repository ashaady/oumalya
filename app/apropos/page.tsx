'use client';

import React from 'react';
import Link from 'next/link';
import SubpageLayout from '@/components/SubpageLayout';

export default function AproposPage() {
  return (
    <SubpageLayout>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <strong>À propos</strong>
        </div>

        {/* Page Hero */}
        <div className="page-hero">
          <p className="page-kicker">BIENVENUE CHEZ OUMALYA</p>
          <h1 className="serif page-title">
            La mode, à votre <span className="highlight">image.</span>
          </h1>
          <p>
            Un univers féminin où élégance, douceur et confort se rencontrent au fil des collections.
          </p>
        </div>

        {/* About Layout */}
        <div className="about-layout">
          <img
            className="about-photo"
            src="/images/hero-abaya-pink.jpg"
            alt="Inspiration mode et abaya rose poudré"
          />
          <div className="body">
            <p className="page-kicker">NOTRE UNIVERS</p>
            <h2 className="serif section-title">
              Des détails simples.<br />
              <span className="highlight">Un style qui reste.</span>
            </h2>
            <div className="pink-divider"></div>
            <p>
              OUMALYA CLOTHING, c’est l’envie de réunir des abayas féminines et des Crocs personnalisées dans une boutique à l’identité douce et contemporaine.
            </p>
            <p>
              Des pièces fluides, des teintes délicates et des accessoires pleins de caractère : chaque sélection invite à composer une tenue dans laquelle on se sent bien.
            </p>
            <p>
              Cette présentation est une proposition éditoriale pour le futur site. L’histoire exacte de la marque pourra être ajoutée par sa fondatrice.
            </p>
            <Link className="btn btn-primary" href="/boutique">
              Explorer nos collections{' '}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Values Section */}
        <section className="row-gap">
          <div className="section-head">
            <div>
              <p className="page-kicker">L&apos;ESPRIT OUMALYA</p>
              <h2 className="serif section-title">Ce qui nous inspire</h2>
            </div>
          </div>
          <div className="values">
            <div className="value">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z" />
              </svg>
              <h3>Élégance</h3>
              <p>Des silhouettes féminines et des choix de couleurs délicats pour toutes les envies.</p>
            </div>
            <div className="value">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
              <h3>Douceur</h3>
              <p>Une identité tendre et lumineuse qui rend chaque pièce facile à aimer.</p>
            </div>
            <div className="value">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 8h14l1 13H4L5 8Z" />
                <path d="M9 9V6a3 3 0 0 1 6 0v3" />
              </svg>
              <h3>Liberté</h3>
              <p>Associer confort et style, avec des produits adaptés à différentes occasions.</p>
            </div>
          </div>
        </section>

        {/* Wide CTA */}
        <div className="wide-cta">
          <div>
            <h2>Prête à trouver votre coup de cœur ?</h2>
            <p>Abayas élégantes ou Crocs colorées, explorez la sélection.</p>
          </div>
          <Link className="btn btn-primary" href="/boutique">
            Découvrir la boutique{' '}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </SubpageLayout>
  );
}
