import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Token not cached in memory
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink?: string;
  size?: string;
}

/**
 * Uploads a file (e.g. zip/apk) to user's Google Drive via multipart upload.
 */
export async function uploadFileToGoogleDrive(
  fileName: string,
  fileBlob: Blob,
  description: string = 'Secure AI Eye-Controlled Android Phone Application package'
): Promise<DriveUploadResult> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated with Google Drive. Please sign in first.');
  }

  const metadata = {
    name: fileName,
    description: description,
    mimeType: fileBlob.type || 'application/zip',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;

  const reader = new FileReader();
  const fileArrayBuffer = await fileBlob.arrayBuffer();

  // Create multipart body
  const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
  const headerBlob = new Blob(
    [`${delimiter}Content-Type: ${fileBlob.type || 'application/zip'}\r\n\r\n`],
    { type: 'text/plain' }
  );
  const footerBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBlob = new Blob(
    [metadataBlob, headerBlob, fileArrayBuffer, footerBlob],
    { type: `multipart/related; boundary=${boundary}` }
  );

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBlob,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
    webContentLink: data.webContentLink,
    size: data.size,
  };
}
