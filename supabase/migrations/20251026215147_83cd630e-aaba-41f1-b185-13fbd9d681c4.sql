-- Add new organizational columns to ad_templates
ALTER TABLE public.ad_templates
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS performance_score integer CHECK (performance_score >= 0 AND performance_score <= 100),
  ADD COLUMN IF NOT EXISTS difficulty_level text CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS estimated_setup_time_minutes integer;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ad_templates_industry ON public.ad_templates(industry);
CREATE INDEX IF NOT EXISTS idx_ad_templates_performance ON public.ad_templates(performance_score DESC);
CREATE INDEX IF NOT EXISTS idx_ad_templates_difficulty ON public.ad_templates(difficulty_level);

-- Delete all existing templates (clean slate)
TRUNCATE TABLE public.ad_templates RESTART IDENTITY CASCADE;

-- Insert 15 professional templates with better organization

-- 1. Facebook/Instagram - E-commerce Flash Sale (Beginner)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular, 
  category, industry, performance_score, difficulty_level, 
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Flash Sale - E-commerce Conversion',
  'Proven high-converting template for time-sensitive product sales on Facebook & Instagram.',
  'Conversion',
  ARRAY['Facebook', 'Instagram'],
  true,
  'e-commerce',
  'retail',
  92,
  'beginner',
  10,
  '{
    "product": "Summer Flash Sale - Up to 60% Off",
    "details": "Limited-time offer! Shop our best-selling items at unbeatable prices. Premium quality, fast shipping. Use code SUMMER60 at checkout. Sale ends in 48 hours!",
    "adType": "carousel",
    "websiteUrl": "https://yourstore.com/summer-sale",
    "audience": "Retargeting: Website visitors (last 30 days) + Lookalike audience (1%)",
    "platforms": ["facebook", "instagram"],
    "suggestedHeadlines": [
      "🔥 60% Off Flash Sale - 48 Hours Only!",
      "Your Cart is Waiting: Complete Your Purchase",
      "Last Chance: Summer Sale Ends Tonight"
    ],
    "targeting": {
      "age": [25, 54],
      "gender": "all",
      "interests": ["online shopping", "fashion", "deals and coupons"]
    },
    "budget": {
      "recommended_daily": 75,
      "recommended_duration_days": 2
    }
  }'::jsonb,
  ARRAY['flash-sale', 'conversion', 'urgency', 'ecommerce']
);

-- 2. TikTok - Viral Challenge (Intermediate)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'TikTok Viral Challenge - Brand Engagement',
  'Leverage trending sounds and challenges to boost brand awareness and user-generated content.',
  'Engagement',
  ARRAY['TikTok', 'Instagram'],
  true,
  'social_media',
  'consumer_brands',
  88,
  'intermediate',
  20,
  '{
    "product": "Brand Challenge Campaign",
    "details": "Jump on trending TikTok challenges! Create authentic, entertaining content that encourages user participation. Hook viewers in 1 second, showcase transformation/result by second 3, end with clear CTA.",
    "adType": "video",
    "audience": "Gen Z & Millennials (16-34), high engagement rate, trending content consumers",
    "platforms": ["tiktok", "instagram"],
    "suggestedHeadlines": [
      "POV: You Finally Tried [Product] 😱",
      "Wait For It... This Changed Everything",
      "I Tried This For 7 Days - Results Below 👇"
    ],
    "targeting": {
      "age": [16, 34],
      "interests": ["trending challenges", "viral content", "user-generated content"]
    },
    "budget": {
      "recommended_daily": 100,
      "recommended_duration_days": 7
    }
  }'::jsonb,
  ARRAY['viral', 'tiktok', 'engagement', 'ugc', 'trending']
);

-- 3. LinkedIn - B2B Lead Generation (Advanced)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'B2B SaaS Lead Magnet - LinkedIn',
  'Professional lead generation template targeting decision-makers with valuable content offers.',
  'Traffic',
  ARRAY['LinkedIn'],
  false,
  'b2b',
  'saas',
  85,
  'advanced',
  25,
  '{
    "product": "Enterprise Productivity Solution - Free White Paper",
    "details": "Download our comprehensive guide: The 2024 Digital Transformation Playbook for Enterprise Teams. Trusted by 500+ Fortune 1000 companies. Includes case studies, ROI calculator, and implementation roadmap.",
    "adType": "document",
    "websiteUrl": "https://yoursaas.com/whitepaper-download",
    "audience": "C-Suite, VPs, Directors in companies 500+ employees, interested in enterprise software, digital transformation",
    "platforms": ["linkedin"],
    "suggestedHeadlines": [
      "How Fortune 500 Companies Are Saving 40% on Operations",
      "The Enterprise Guide 500+ CTOs Are Reading",
      "Free Download: Digital Transformation ROI Calculator"
    ],
    "targeting": {
      "jobTitles": ["CEO", "CTO", "VP Operations", "Director IT"],
      "companySize": ["500-1000", "1001-5000", "5001+"],
      "industries": ["Technology", "Financial Services", "Healthcare"]
    },
    "budget": {
      "recommended_daily": 150,
      "recommended_duration_days": 14
    }
  }'::jsonb,
  ARRAY['lead-gen', 'b2b', 'linkedin', 'whitepaper', 'enterprise']
);

-- 4. Instagram Story - Brand Awareness (Beginner)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Instagram Story - Brand Awareness',
  'Eye-catching Instagram Story ad with interactive elements to build brand recognition.',
  'Awareness',
  ARRAY['Instagram', 'Facebook'],
  true,
  'social_media',
  'lifestyle',
  80,
  'beginner',
  12,
  '{
    "product": "Brand Story Campaign",
    "details": "Share your brand journey, values, or behind-the-scenes content. Use polls, questions, and swipe-up CTAs to drive engagement. Authentic storytelling that resonates with your audience.",
    "adType": "story",
    "audience": "Broad audience aligned with brand values, lookalike of existing customers",
    "platforms": ["instagram", "facebook"],
    "suggestedHeadlines": [
      "This Is Why We Started [Brand] ❤️",
      "Behind the Scenes: Meet Our Team",
      "Your Questions Answered 👇"
    ],
    "targeting": {
      "age": [18, 44],
      "interests": ["lifestyle brands", "authentic brands", "sustainability"]
    },
    "budget": {
      "recommended_daily": 40,
      "recommended_duration_days": 5
    }
  }'::jsonb,
  ARRAY['awareness', 'story', 'instagram', 'brand-building']
);

-- 5. Facebook - App Install Campaign (Beginner)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Mobile App Install - Facebook',
  'Drive app downloads with feature showcases, ratings, and limited-time install bonuses.',
  'Traffic',
  ARRAY['Facebook', 'Instagram', 'Google'],
  true,
  'app',
  'mobile_apps',
  90,
  'beginner',
  15,
  '{
    "product": "Mobile App Download",
    "details": "Download now and get 30 days premium free! Join 500K+ users who love this app. Rated 4.8★ on App Store. Features include: seamless experience, powerful tools, and regular updates.",
    "adType": "video",
    "websiteUrl": "https://app.link/download",
    "audience": "Mobile users, interested in app category, lookalike of current users",
    "platforms": ["facebook", "instagram", "google"],
    "suggestedHeadlines": [
      "Rated 4.8★ by 500K+ Users - Download Free",
      "The App Everyone Is Talking About",
      "Get 30 Days Premium Free - Limited Time"
    ],
    "targeting": {
      "age": [18, 45],
      "deviceType": ["mobile"],
      "interests": ["mobile apps", "productivity"]
    },
    "budget": {
      "recommended_daily": 80,
      "recommended_duration_days": 10
    }
  }'::jsonb,
  ARRAY['app-install', 'mobile', 'conversion']
);

-- 6. Facebook - Cart Abandonment Retargeting (Beginner)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Cart Abandonment - Retargeting',
  'Win back customers who abandoned their carts with incentives and urgency.',
  'Conversion',
  ARRAY['Facebook', 'Instagram'],
  true,
  'e-commerce',
  'retail',
  94,
  'beginner',
  10,
  '{
    "product": "Complete Your Purchase - Special Offer Inside",
    "details": "You left something behind! Complete your purchase now and get 15% off with code COMEBACK15. Free shipping on orders over $50. Offer expires in 24 hours.",
    "adType": "carousel",
    "websiteUrl": "https://yourstore.com/cart",
    "audience": "Cart abandoners (last 7 days)",
    "platforms": ["facebook", "instagram"],
    "suggestedHeadlines": [
      "Still Thinking About It? Here is 15% Off",
      "Your Cart Is Waiting + Free Shipping",
      "Complete Your Order Before Its Gone"
    ],
    "targeting": {
      "customAudience": "cart_abandoners_7d",
      "exclusions": ["purchasers_last_7d"]
    },
    "budget": {
      "recommended_daily": 60,
      "recommended_duration_days": 3
    }
  }'::jsonb,
  ARRAY['retargeting', 'cart-abandonment', 'conversion', 'ecommerce']
);

-- 7. Google Search - Local Business (Beginner)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Local Business - Google Search',
  'Capture high-intent local searches for your service-based business.',
  'Traffic',
  ARRAY['Google'],
  false,
  'local_business',
  'services',
  87,
  'beginner',
  15,
  '{
    "product": "Professional [Service] in [City]",
    "details": "Licensed & insured. Same-day service available. 5-star rated with 200+ reviews. Free estimates. Call now or book online.",
    "adType": "search",
    "websiteUrl": "https://yourservice.com",
    "audience": "Local searchers with high purchase intent",
    "platforms": ["google"],
    "suggestedHeadlines": [
      "Best [Service] in [City] - Book Today",
      "Licensed & Insured - Free Estimates",
      "Same-Day Service Available - Call Now"
    ],
    "targeting": {
      "location": "10-mile radius",
      "keywords": ["service near me", "best service in city", "local service provider"],
      "matchType": "phrase"
    },
    "budget": {
      "recommended_daily": 50,
      "recommended_duration_days": 30
    }
  }'::jsonb,
  ARRAY['local', 'google-search', 'services', 'traffic']
);

-- 8. YouTube - Pre-Roll Ad (Intermediate)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'YouTube Pre-Roll - Product Demo',
  'Engaging 15-30 second video ads that showcase your product benefits before YouTube videos.',
  'Awareness',
  ARRAY['YouTube', 'Google'],
  false,
  'video_marketing',
  'consumer_brands',
  82,
  'intermediate',
  30,
  '{
    "product": "Product Demo Video Ad",
    "details": "Hook in first 5 seconds. Show problem/solution. Demonstrate key benefit. End with clear CTA. Skippable after 5 seconds so front-load value.",
    "adType": "video",
    "audience": "Broad audience interested in product category, in-market audiences",
    "platforms": ["youtube", "google"],
    "suggestedHeadlines": [
      "See How [Product] Works in 30 Seconds",
      "The Solution Youve Been Looking For",
      "Try [Product] Risk-Free Today"
    ],
    "targeting": {
      "age": [25, 54],
      "interests": ["product category"],
      "videoTopics": ["related content"]
    },
    "budget": {
      "recommended_daily": 100,
      "recommended_duration_days": 14
    }
  }'::jsonb,
  ARRAY['video', 'youtube', 'awareness', 'product-demo']
);

-- 9. Facebook - Event Promotion (Beginner)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Event Promotion - Facebook',
  'Drive registrations and attendance for webinars, conferences, or local events.',
  'Traffic',
  ARRAY['Facebook', 'Instagram', 'LinkedIn'],
  true,
  'events',
  'b2b',
  86,
  'beginner',
  12,
  '{
    "product": "[Event Name] - Register Now",
    "details": "Join us for [Event Name] on [Date]. Learn from industry experts. Network with 500+ attendees. Early bird pricing ends soon. Register now to secure your spot.",
    "adType": "image",
    "websiteUrl": "https://yourevent.com/register",
    "audience": "Professionals in target industry, past event attendees",
    "platforms": ["facebook", "instagram", "linkedin"],
    "suggestedHeadlines": [
      "Register for [Event] - Early Bird Ends Soon",
      "500+ Industry Leaders Attending - Join Us",
      "Free Webinar: [Topic] - [Date] at [Time]"
    ],
    "targeting": {
      "age": [25, 55],
      "interests": ["industry events", "professional development"],
      "jobTitles": ["relevant roles"]
    },
    "budget": {
      "recommended_daily": 70,
      "recommended_duration_days": 14
    }
  }'::jsonb,
  ARRAY['event', 'registration', 'traffic', 'webinar']
);

-- 10. Instagram - Influencer Collaboration (Intermediate)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Influencer Partnership - Instagram',
  'Amplify influencer content with paid promotion to reach beyond their organic audience.',
  'Engagement',
  ARRAY['Instagram', 'Facebook'],
  false,
  'influencer_marketing',
  'lifestyle',
  83,
  'intermediate',
  20,
  '{
    "product": "Influencer Collab Campaign",
    "details": "Partner with influencers to create authentic content, then boost it with paid ads. Use influencers existing content for credibility. Target their followers + lookalikes.",
    "adType": "video",
    "audience": "Influencers followers + lookalike audiences",
    "platforms": ["instagram", "facebook"],
    "suggestedHeadlines": [
      "As Seen With @[Influencer]",
      "[Influencer] Loves This - You Will Too",
      "Get [Influencers] Favorite [Product]"
    ],
    "targeting": {
      "age": [18, 34],
      "interests": ["influencer niche"],
      "behaviors": ["engaged shoppers"]
    },
    "budget": {
      "recommended_daily": 90,
      "recommended_duration_days": 10
    }
  }'::jsonb,
  ARRAY['influencer', 'engagement', 'instagram', 'collab']
);

-- 11. Google Display Network - Remarketing (Intermediate)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Display Remarketing - Google',
  'Follow visitors across the web with eye-catching display ads.',
  'Conversion',
  ARRAY['Google'],
  false,
  'display',
  'retail',
  81,
  'intermediate',
  18,
  '{
    "product": "Display Remarketing Campaign",
    "details": "Target people who visited your site but didnt convert. Show compelling visuals and offers across 2M+ websites. Use dynamic product ads for e-commerce.",
    "adType": "display",
    "websiteUrl": "https://yourstore.com",
    "audience": "Website visitors (last 30 days) who didnt purchase",
    "platforms": ["google"],
    "suggestedHeadlines": [
      "Come Back & Save 20%",
      "Still Interested? Special Offer Inside",
      "Complete Your Purchase Today"
    ],
    "targeting": {
      "remarketingList": "site_visitors_30d",
      "exclusions": ["converters"],
      "placements": ["relevant sites"]
    },
    "budget": {
      "recommended_daily": 55,
      "recommended_duration_days": 21
    }
  }'::jsonb,
  ARRAY['display', 'remarketing', 'google', 'conversion']
);

-- 12. Pinterest - Shopping Ad (Beginner)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Pinterest Shopping - Product Discovery',
  'Reach high-intent shoppers browsing for inspiration and ideas on Pinterest.',
  'Traffic',
  ARRAY['Pinterest'],
  false,
  'e-commerce',
  'retail',
  79,
  'beginner',
  15,
  '{
    "product": "Product Collection",
    "details": "Beautiful lifestyle imagery that fits naturally into Pinterest feeds. Target shoppers in discovery mode. Use rich pins with product details and pricing.",
    "adType": "catalog",
    "websiteUrl": "https://yourstore.com/shop",
    "audience": "Pinterest users searching for related products",
    "platforms": ["pinterest"],
    "suggestedHeadlines": [
      "Shop the Look - [Product Category]",
      "Get the Style Everyone Is Pinning",
      "[Season] Must-Haves - Shop Now"
    ],
    "targeting": {
      "age": [25, 44],
      "gender": "all",
      "interests": ["home decor", "fashion", "DIY"],
      "keywords": ["product category pins"]
    },
    "budget": {
      "recommended_daily": 45,
      "recommended_duration_days": 14
    }
  }'::jsonb,
  ARRAY['pinterest', 'shopping', 'traffic', 'discovery']
);

-- 13. LinkedIn - Thought Leadership (Advanced)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Thought Leadership - LinkedIn',
  'Build authority and trust with insightful content targeting B2B decision-makers.',
  'Awareness',
  ARRAY['LinkedIn'],
  false,
  'b2b',
  'saas',
  84,
  'advanced',
  30,
  '{
    "product": "Executive Insights Content",
    "details": "Share valuable industry insights, research findings, or leadership perspectives. Position your brand as industry experts. Use native document ads or video content.",
    "adType": "document",
    "websiteUrl": "https://yourblog.com/insights",
    "audience": "Senior decision-makers in target industries",
    "platforms": ["linkedin"],
    "suggestedHeadlines": [
      "The Future of [Industry]: 2025 Trends Report",
      "What 1000+ [Job Titles] Told Us About [Topic]",
      "Industry Analysis: [Timely Topic]"
    ],
    "targeting": {
      "jobTitles": ["C-Suite", "VP", "Director"],
      "companySize": ["1000+"],
      "industries": ["Technology", "Finance"]
    },
    "budget": {
      "recommended_daily": 120,
      "recommended_duration_days": 21
    }
  }'::jsonb,
  ARRAY['thought-leadership', 'b2b', 'linkedin', 'awareness']
);

-- 14. TikTok - Product Demo (Intermediate)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'TikTok Product Demo - Quick Tutorial',
  'Show your product in action with fast-paced, entertaining demonstrations.',
  'Conversion',
  ARRAY['TikTok', 'Instagram'],
  true,
  'product_demo',
  'consumer_brands',
  89,
  'intermediate',
  25,
  '{
    "product": "Product Tutorial Video",
    "details": "Quick 15-second demo showing problem → solution. Use trending music. Add text overlays. Show real results. Make it look native, not like an ad.",
    "adType": "video",
    "audience": "Product category interested, problem-aware audience",
    "platforms": ["tiktok", "instagram"],
    "suggestedHeadlines": [
      "This Changed My [Daily Routine/Life]",
      "Why Did Nobody Tell Me About This?",
      "The [Product] Everyone Needs"
    ],
    "targeting": {
      "age": [18, 44],
      "interests": ["product category", "problem solution"],
      "behaviors": ["online shoppers"]
    },
    "budget": {
      "recommended_daily": 85,
      "recommended_duration_days": 7
    }
  }'::jsonb,
  ARRAY['product-demo', 'tiktok', 'conversion', 'tutorial']
);

-- 15. Universal - Multi-Platform Launch (Advanced)
INSERT INTO public.ad_templates (
  name, description, goal, platforms, is_popular,
  category, industry, performance_score, difficulty_level,
  estimated_setup_time_minutes, template_json, tags
) VALUES (
  'Product Launch - Multi-Platform',
  'Coordinated campaign across all major platforms for maximum reach during product launches.',
  'Awareness',
  ARRAY['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'Google', 'YouTube'],
  true,
  'product_launch',
  'all_industries',
  91,
  'advanced',
  45,
  '{
    "product": "New Product Launch Campaign",
    "details": "Comprehensive launch strategy across all platforms. Adapt creative for each platform while maintaining consistent messaging. Build awareness, drive traffic, capture leads simultaneously.",
    "adType": "mixed",
    "websiteUrl": "https://yoursite.com/launch",
    "audience": "Broad + interest-based + lookalike audiences",
    "platforms": ["facebook", "instagram", "tiktok", "linkedin", "google", "youtube"],
    "suggestedHeadlines": [
      "Introducing [Product] - Revolutionary [Category]",
      "The Wait Is Over: [Product] Is Here",
      "Pre-Order Now: Limited Launch Pricing"
    ],
    "targeting": {
      "age": [18, 65],
      "interests": ["product category", "early adopters", "innovation"],
      "behaviors": ["technology adopters"]
    },
    "budget": {
      "recommended_daily": 300,
      "recommended_duration_days": 14
    }
  }'::jsonb,
  ARRAY['product-launch', 'multi-platform', 'awareness', 'comprehensive']
);