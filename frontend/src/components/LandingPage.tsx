import React, { useState } from 'react';
import { 
  ArrowRight, 
  Star, 
  Palette, 
  Target, 
  BarChart3,
  Code,
  Smartphone,
  Sparkles,
  Play,
  CheckCircle2
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  avatar: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  ctaText: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Marketing Director",
    company: "TechStartup Co.",
    content: "FormCraft AI completely transformed how we create forms. What used to take hours now takes minutes, and the forms match our brand perfectly every time.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Michael Rodriguez",
    role: "Web Developer",
    company: "Digital Agency",
    content: "The AI understands our client's websites better than we do sometimes. The form generation is incredibly accurate and saves us so much development time.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emily Johnson",
    role: "Product Manager",
    company: "E-commerce Plus",
    content: "Our conversion rates increased by 40% after switching to FormCraft AI. The forms feel native to each website and users love the seamless experience.",
    rating: 5,
    avatar: "EJ"
  },
  {
    name: "David Kim",
    role: "Founder",
    company: "SaaS Startup",
    content: "As a non-technical founder, FormCraft AI lets me create professional forms without bothering our dev team. It's like having an AI designer at my fingertips.",
    rating: 5,
    avatar: "DK"
  }
];

const features: Feature[] = [
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: "AI-Powered Generation",
    description: "Our AI analyzes your website's design, extracts brand elements, and generates forms that match perfectly."
  },
  {
    icon: <Palette className="w-6 h-6" />,
    title: "Brand-Perfect Styling",
    description: "Forms automatically inherit your website's colors, fonts, and styling for seamless brand consistency."
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Purpose-Optimized",
    description: "Intelligent field selection and copy generation based on your form's specific purpose and audience."
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Advanced Analytics",
    description: "Detailed insights into form performance, conversion rates, and user behavior patterns."
  },
  {
    icon: <Code className="w-6 h-6" />,
    title: "One-Click Embed",
    description: "Deploy forms instantly with our secure embed codes. No coding required, works everywhere."
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile Responsive",
    description: "Forms automatically adapt to all screen sizes and devices for optimal user experience."
  }
];

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for individuals and small projects",
    features: [
      "1 live form",
      "Basic integrations (Email, Google Sheets)",
      "Standard analytics",
      "Community support",
      "FormCraft branding"
    ],
    ctaText: "Get Started Free"
  },
  {
    name: "Professional",
    price: "$19/month",
    description: "For growing businesses and teams",
    features: [
      "Unlimited forms",
      "Premium integrations (Slack, HubSpot, Salesforce)",
      "Advanced analytics & insights",
      "Priority support",
      "Remove branding",
      "Custom domains",
      "A/B testing",
      "Team collaboration"
    ],
    highlighted: true,
    ctaText: "Start Pro Trial"
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations with custom needs",
    features: [
      "Everything in Professional",
      "Custom integrations",
      "Advanced security & compliance",
      "Dedicated account manager",
      "Custom AI training",
      "On-premise deployment",
      "SLA guarantee"
    ],
    ctaText: "Contact Sales"
  }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                AI-Powered Form Generation
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Create Perfect Forms
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                That Match Your Brand
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Our AI analyzes any website and generates beautiful, brand-consistent forms in seconds. 
              No design skills required, no coding needed.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={onGetStarted}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Creating Forms
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowVideo(true)}
                className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </button>
            </div>
            
            <div className="mt-12 text-sm text-gray-500">
              No credit card required • 1,000+ companies trust FormCraft AI
            </div>
          </div>
          
          {/* Hero Visual */}
          <div className="mt-16 relative">
            <div className="relative max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="ml-4 text-sm text-gray-600">FormCraft AI in action</div>
                </div>
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">1. Paste any website URL</h3>
                      <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                        https://your-website.com
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">2. AI generates perfect form</h3>
                      <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                        <input className="w-full px-3 py-2 border border-blue-200 rounded" placeholder="Your Name" />
                        <input className="w-full px-3 py-2 border border-blue-200 rounded" placeholder="Email Address" />
                        <button className="w-full bg-blue-600 text-white py-2 rounded font-medium">Submit</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Intelligent Form Generation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI doesn't just create forms—it understands your brand, analyzes your audience, 
              and optimizes for conversions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              From URL to perfect form in 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyze Website</h3>
              <p className="text-gray-600">
                Our AI scans your website to extract design tokens, brand colors, fonts, and voice patterns.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Generate Form</h3>
              <p className="text-gray-600">
                AI creates optimized form fields, copy, and styling that perfectly matches your brand.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Deploy Instantly</h3>
              <p className="text-gray-600">
                Embed your form anywhere with a single line of code. Start collecting responses immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Loved by 10,000+ Businesses
            </h2>
            <div className="flex justify-center items-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-gray-600">4.9/5 from 1,000+ reviews</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                    <div className="text-gray-600 text-xs">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative bg-white rounded-2xl border-2 p-8 ${
                  plan.highlighted 
                    ? 'border-blue-500 shadow-lg scale-105' 
                    : 'border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {plan.price}
                    {plan.price !== 'Free' && plan.price !== 'Custom' && <span className="text-lg text-gray-600">/month</span>}
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={onGetStarted}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.highlighted
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Forms?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses creating better forms with AI
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onGetStarted}
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onSignIn}
              className="border border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">FormCraft AI Demo</h3>
              <button 
                onClick={() => setShowVideo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Play className="w-16 h-16 mx-auto mb-4" />
                <p>Demo video would be embedded here</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};