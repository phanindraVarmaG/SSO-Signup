"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import styles from "../../app/dashboard/dashboard.module.css";

export default function GoogleDriveDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const accessToken = searchParams.get("access_token");
  const error = searchParams.get("error");

  if (typeof window !== "undefined" && accessToken) {
    // eslint-disable-next-line no-console
    console.log("Google Drive Access Token:", accessToken);
  }

  const handleLogout = () => {
    // Optionally clear any tokens here
    router.push("/login");
  };

  const handleBackToLogin = () => {
    router.push("/login");
  };

  function GoogleDriveFileAccessTester({ accessToken }: { accessToken: string }) {
    const [fileUrl, setFileUrl] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [fileId, setFileId] = useState<string | null>(null);
    const [isExcel, setIsExcel] = useState(false);

    const handleCheck = async () => {
      setResult(null);
      setIsExcel(false);
      setFileId(null);
      // Extract file ID from the URL
      const match = fileUrl.match(/\/d\/([\w-]+)/) || fileUrl.match(/id=([\w-]+)/);
      const id = match ? match[1] : null;
      setFileId(id);
      if (!id) {
        setResult("❌ Invalid Google Drive file URL");
        return;
      }
      // Check file metadata for mimeType
      try {
        const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=id,name,mimeType`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          setResult("❌ File is NOT accessible with this token");
          return;
        }
        const meta = await res.json();
        setResult(`✅ File is accessible with this token. Name: ${meta.name}`);
        // Check if it's an Excel file (Google Sheets or uploaded Excel)
        if (
          meta.mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          meta.mimeType === "application/vnd.ms-excel" ||
          meta.mimeType === "application/vnd.google-apps.spreadsheet"
        ) {
          setIsExcel(true);
        }
      } catch (e) {
        setResult("❌ Error checking file");
      }
    };

    // Securely download or open Excel file from Drive using fetch and Blob
    const handleOpenExcel = async () => {
      if (!fileId) return;
      let url = "";
      let filename = "drive-file.xlsx";
      if (fileUrl.includes("/spreadsheets/") || fileUrl.includes("google-apps.spreadsheet")) {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
      } else {
        url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      }
      try {
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (!res.ok) {
          alert("Failed to download file. Check your permissions or file type.");
          return;
        }
        // Try to get filename from Content-Disposition header
        const disposition = res.headers.get('Content-Disposition');
        if (disposition) {
          const match = disposition.match(/filename="?([^";]+)"?/);
          if (match) filename = match[1];
        }
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(blobUrl);
          a.remove();
        }, 100);
      } catch (e) {
        alert("Error downloading file.");
      }
    };

    return (
      <div style={{ marginTop: 24 }}>
        <h3 style={{marginBottom:8}}>Test Google Drive File Access</h3>
         <div className={styles.inputRow}>
        <input
        className={styles.input}
          type="text"
          placeholder="Paste Google Drive file URL"
          value={fileUrl}
          onChange={e => setFileUrl(e.target.value)}
        />
        <button className={styles.drivebutton} onClick={handleCheck}>Check Access</button>
       </div>
        {result && <div style={{ marginTop: 12 }}>{result}</div>}
        {isExcel && fileId && (
          <button
            className={styles.drivebutton}
            style={{ marginTop: 16, background: '#34A853' }}
            onClick={handleOpenExcel}
          >
            Open or Download Excel File
          </button>
        )}
      </div>
    );
  }

  if (error === "access_denied") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.driveheader}>
            <h1 className={styles.title}>Google Sign-In Cancelled</h1>
          </div>
  
          <button onClick={handleBackToLogin} className={styles.logoutButton} style={{ width: 180, margin: '0 auto', display: 'block' }}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
        <div className={styles.profileSection}>
          <h2 className={styles.sectionTitle}>Google Drive access granted successfully</h2>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.label}>Email:</span>
              <span className={styles.value}>{email || "Unknown"}</span>
            </div>
            {accessToken && (
              <div className={styles.infoRow}>
                <span className={styles.label}>Access Token:</span>
                <span className={styles.mailvalue}>{accessToken}</span>
              </div>
            )}
          </div>
        </div>
        {accessToken && <GoogleDriveFileAccessTester accessToken={accessToken} />}
      </div>
    </div>
  );
}
