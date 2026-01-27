export default () => ({
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRATION || "15m",
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    allowedDomains: process.env.ALLOWED_EMAIL_DOMAINS
      ? process.env.ALLOWED_EMAIL_DOMAINS.split(",")
      : [],
  },
  ldap: {
    url: process.env.LDAP_URL || "ldap://mock-dc.company.local:389",
    bindDN:
      process.env.LDAP_BIND_DN ||
      "CN=AppService,OU=Service Accounts,DC=company,DC=local",
    bindCredentials:
      process.env.LDAP_BIND_CREDENTIALS || "MockServicePassword123!",
    searchBase: process.env.LDAP_SEARCH_BASE || "OU=Users,DC=company,DC=local",
    searchFilter:
      process.env.LDAP_SEARCH_FILTER || "(sAMAccountName={{username}})",
  },
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3000",
  },
});
