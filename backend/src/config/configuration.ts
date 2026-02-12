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
  },
   ldap: {
    url: process.env.LDAP_URL || 'ldap://localhost:389',
    bindDN: process.env.LDAP_BIND_DN || 'cn=admin,dc=example,dc=org',
    bindCredentials: process.env.LDAP_BIND_CREDENTIALS || 'admin',
    searchBase: process.env.LDAP_SEARCH_BASE || 'dc=example,dc=org',
    searchFilter: process.env.LDAP_SEARCH_FILTER || '(uid={{username}})',
  },
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3000",
  },
});
