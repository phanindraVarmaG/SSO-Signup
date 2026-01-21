import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.highlight}>NextJS Frontend</span>
        </h1>
        <p className={styles.description}>SSO Sign-In Application - Frontend</p>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Authentication &rarr;</h2>
            <p>Implement SSO authentication flow</p>
          </div>
          <div className={styles.card}>
            <h2>Dashboard &rarr;</h2>
            <p>User dashboard after login</p>
          </div>
          <div className={styles.card}>
            <h2>Profile &rarr;</h2>
            <p>Manage user profile and settings</p>
          </div>
        </div>
      </div>
    </main>
  );
}
