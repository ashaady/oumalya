import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const authFilePath = path.join(process.cwd(), 'data', 'admin.json');

interface AdminConfig {
  username: string;
  password: string;
  mustChangePassword: boolean;
  updatedAt?: string;
}

function getStoredAuth(): AdminConfig {
  try {
    if (fs.existsSync(authFilePath)) {
      const content = fs.readFileSync(authFilePath, 'utf8');
      const data = JSON.parse(content);
      if (data && data.username && data.password) {
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading admin.json:', err);
  }

  // Fallback defaults
  const defaultConfig: AdminConfig = {
    username: 'oumalya',
    password: 'passer',
    mustChangePassword: true
  };
  saveAuth(defaultConfig);
  return defaultConfig;
}

function saveAuth(data: AdminConfig): boolean {
  try {
    const dir = path.dirname(authFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(authFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving admin.json:', err);
    return false;
  }
}

// POST: Handles login and password change
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const currentAuth = getStoredAuth();

    // 1. LOGIN
    if (body.action === 'login') {
      const inputUser = (body.username || '').trim().toLowerCase();
      const inputPass = (body.password || '').trim();

      const validUser = currentAuth.username.toLowerCase();
      const validPass = currentAuth.password;

      if (inputUser === validUser && inputPass === validPass) {
        return NextResponse.json({
          success: true,
          mustChangePassword: !!currentAuth.mustChangePassword
        });
      }

      return NextResponse.json(
        { success: false, error: 'Identifiant ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // 2. CHANGE PASSWORD (Mandatory on first login)
    if (body.action === 'change-password') {
      const newPassword = (body.newPassword || '').trim();

      if (!newPassword || newPassword.length < 5) {
        return NextResponse.json(
          { success: false, error: 'Le mot de passe doit comporter au moins 5 caractères' },
          { status: 400 }
        );
      }

      if (newPassword === 'passer') {
        return NextResponse.json(
          { success: false, error: 'Veuillez choisir un mot de passe différent de "passer"' },
          { status: 400 }
        );
      }

      const updatedAuth: AdminConfig = {
        ...currentAuth,
        password: newPassword,
        mustChangePassword: false,
        updatedAt: new Date().toISOString()
      };

      saveAuth(updatedAuth);

      return NextResponse.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès'
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
