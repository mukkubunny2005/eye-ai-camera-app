import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  Cloud,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  X,
  Upload,
  FolderUp,
  FileCheck,
  LogOut,
  Smartphone,
} from 'lucide-react';
import {
  initAuth,
  googleSignIn,
  logout,
  uploadFileToGoogleDrive,
  DriveUploadResult,
  getAccessToken,
} from '../services/googleDriveService';
import { generateAndroidProjectZipBlob } from '../utils/exportProjectZip';

interface GoogleDriveUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveUploadModal: React.FC<GoogleDriveUploadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<DriveUploadResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setUploadResult(null);
  };

  const initiateUpload = () => {
    setErrorMsg(null);
    setShowConfirmDialog(true);
  };

  const executeUpload = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);
    setErrorMsg(null);
    setUploadProgress(15);

    try {
      // Step 1: Generate Zip Blob
      setUploadProgress(40);
      const zipBlob = await generateAndroidProjectZipBlob();

      // Step 2: Upload to Google Drive via multipart API
      setUploadProgress(75);
      const fileName = `SecureEyeControl-v1.0.0-Android-App.zip`;
      const result = await uploadFileToGoogleDrive(
        fileName,
        zipBlob,
        'Secure AI Eye-Controlled Android Phone complete application package and source code'
      );

      setUploadProgress(100);
      setUploadResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to upload to Google Drive');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyLink = () => {
    if (uploadResult?.webViewLink) {
      navigator.clipboard.writeText(uploadResult.webViewLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cloud className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Save App to Google Drive</h3>
            <p className="text-xs text-slate-400">Download the Android app package directly to your Drive</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Auth State & Content */}
        {!currentUser ? (
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
              <FolderUp className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">Connect Your Google Account</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Sign in with Google to allow Secure Eye Control to upload the app package directly to your personal Google Drive.
              </p>
            </div>

            {/* Official GSI Button Style */}
            <button
              onClick={handleSignIn}
              disabled={isLoggingIn}
              className="w-full max-w-xs mx-auto py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 font-medium text-sm rounded-xl shadow-md flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* User Account Pill */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="User" className="w-8 h-8 rounded-full border border-slate-700" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">
                    {currentUser.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{currentUser.displayName || 'Google User'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{currentUser.email}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 text-xs flex items-center gap-1 font-mono"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Package Details */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase">Package Information</div>
              <div className="flex justify-between text-slate-300">
                <span>File Name:</span>
                <span className="font-mono text-white font-bold">SecureEyeControl-v1.0.0-Android-App.zip</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Contents:</span>
                <span className="text-slate-400">Kotlin sources, Gradle, TFLite models, Manifest</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Target Drive Folder:</span>
                <span className="text-emerald-400 font-mono">My Drive (Root)</span>
              </div>
            </div>

            {/* Upload Button or Progress */}
            {isUploading ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs text-cyan-300 font-mono">
                  <span>Uploading to Google Drive...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : !uploadResult ? (
              <button
                onClick={initiateUpload}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4" /> Upload App Package to My Google Drive
              </button>
            ) : (
              /* Success Card with Drive Link */
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm font-mono">
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  <span>Successfully Saved to Google Drive!</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 break-all">
                  {uploadResult.webViewLink}
                </div>

                <div className="flex gap-2">
                  <a
                    href={uploadResult.webViewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <span>Open in Google Drive</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700 active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Modal Dialog for Mutating Action (Workspace Skill Requirement) */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-20 flex items-center justify-center p-6 bg-slate-950/95 rounded-3xl">
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Cloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">Confirm Google Drive Upload</h4>
                <p className="text-xs text-slate-300 max-w-xs mx-auto">
                  Are you sure you want to upload <strong>SecureEyeControl-v1.0.0-Android-App.zip</strong> to the Google Drive of{' '}
                  <span className="text-cyan-400">{currentUser?.email}</span>?
                </p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono"
                >
                  Cancel
                </button>
                <button
                  onClick={executeUpload}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono shadow-lg shadow-cyan-500/20"
                >
                  Yes, Upload to Drive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
