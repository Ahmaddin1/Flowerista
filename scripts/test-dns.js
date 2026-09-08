const dns = require("dns");
dns.setServers(["8.8.8.8"]);
dns.resolveSrv(
  "_mongodb._tcp.cluster0.a3lrrtd.mongodb.net",
  (err, addresses) => {
    if (err) console.error("FAILED:", err);
    else console.log("SUCCESS:", addresses);
  },
);
