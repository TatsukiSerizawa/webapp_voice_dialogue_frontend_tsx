module.exports = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "voice-dialogue-backend-bzazcff4dmdrdvh4.japaneast-01.azurewebsites.net:path*", // Django のURL
      },
    ];
  },
};