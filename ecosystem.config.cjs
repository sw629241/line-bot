module.exports = {
  apps: [{
    name: "linebot",
    script: "app.js",
    env: {
      PORT: 5000,
      HOST: "0.0.0.0",
      NODE_ENV: "development",
    },
    watch: false,  // Disable watch mode temporarily
    ignore_watch: ["node_modules", "logs", "data"],
    error_file: "logs/err.log",
    out_file: "logs/out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    node_args: ["--experimental-modules"]
  }]
}
