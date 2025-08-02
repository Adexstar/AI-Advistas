const PlatformSection = () => {
  const platforms = [
    { name: "Facebook", color: "bg-blue-600", users: "3B+" },
    { name: "Instagram", color: "bg-pink-500", users: "2B+" },
    { name: "TikTok", color: "bg-black", users: "1B+" },
    { name: "YouTube", color: "bg-red-600", users: "2.7B+" },
    { name: "Google Ads", color: "bg-green-600", users: "4B+" },
    { name: "Twitter/X", color: "bg-blue-400", users: "400M+" },
    { name: "LinkedIn", color: "bg-blue-700", users: "900M+" },
    { name: "Snapchat", color: "bg-yellow-400", users: "750M+" }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Advertise Across <span className="bg-gradient-primary bg-clip-text text-transparent">All Major Platforms</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Reach billions of users across the world's most popular social media and advertising platforms 
            with unified campaign management.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {platforms.map((platform, index) => (
            <div 
              key={index}
              className="group relative p-6 rounded-xl bg-gradient-card border border-border hover:shadow-soft transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className={`w-12 h-12 ${platform.color} rounded-lg mx-auto mb-4 flex items-center justify-center text-white font-bold text-lg`}>
                  {platform.name.charAt(0)}
                </div>
                <h3 className="font-semibold text-lg mb-2">{platform.name}</h3>
                <p className="text-sm text-muted-foreground">{platform.users} users</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-gradient-glass backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">12+ Billion</span> total users reached through our platform
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformSection;